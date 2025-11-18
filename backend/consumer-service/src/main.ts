import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Transport, MicroserviceOptions } from "@nestjs/microservices"; // 1. IMPORT LẠI

async function bootstrap() {
	console.log("Khởi chạy Consumer Service...");

	const app = await NestFactory.create(AppModule);

	app.setGlobalPrefix("api");

	app.enableCors({
		origin: "*",
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
		credentials: true,
	});

	// --- 2. THÊM LẠI ĐOẠN KẾT NỐI KAFKA (QUAN TRỌNG) ---
	app.connectMicroservice<MicroserviceOptions>({
		transport: Transport.KAFKA,
		options: {
			client: {
				brokers: [process.env.KAFKA_BROKERS || ""],
				// Cấu hình bảo mật cho Redpanda Cloud
				ssl: true,
				sasl: {
					mechanism: "scram-sha-256",
					username: process.env.KAFKA_USERNAME || "",
					password: process.env.KAFKA_PASSWORD || "",
				},
			},
			consumer: {
				groupId: "consumer-service-group", // Tên nhóm Consumer
			},
		},
	});

	// 3. KHỞI ĐỘNG KAFKA LISTENER
	await app.startAllMicroservices();
	console.log("✅ Kafka Consumer đã kết nối!");
	// ---------------------------------------------------

	// 4. KHỞI ĐỘNG HTTP APP (Giữ nguyên logic port của bạn)
	let port = parseInt(process.env.PORT || "3001", 10);
	// (Logic vòng lặp thử port của bạn ở đây là tốt, cứ giữ nguyên)
	let started = false;
	let attempts = 0;
	const maxAttempts = 20;

	while (!started && attempts < maxAttempts) {
		try {
			await app.listen(port, "0.0.0.0");
			started = true;
			console.log(`✅ Consumer Service đang lắng nghe:`);
			console.log(`  - HTTP API: http://localhost:${port}/api`);
			console.log(`  - WebSocket: ws://localhost:${port}`);
		} catch (error: any) {
			if (error.code === "EADDRINUSE") {
				console.log(
					`⚠️  Port ${port} đang được sử dụng, thử port ${port + 1}...`
				);
				port++;
				attempts++;
			} else {
				throw error;
			}
		}
	}
}
bootstrap();
