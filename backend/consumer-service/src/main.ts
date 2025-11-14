import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
// ❌ ĐÃ XÓA: Transport, MicroserviceOptions

async function bootstrap() {
  console.log("Khởi chạy Consumer Service...");

  // 1. Tạo HTTP app (cho API endpoints)
  const app = await NestFactory.create(AppModule);

  // ✅ SET GLOBAL PREFIX
  app.setGlobalPrefix("api");

  // ✅ ENABLE CORS
  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });

  // 4. CHỈ KHỞI ĐỘNG HTTP APP
  let port = parseInt(process.env.PORT || "3001", 10);
  let started = false;
  let attempts = 0;
  const maxAttempts = 20; // Thử tối đa 20 ports

  while (!started && attempts < maxAttempts) {
    try {
      await app.listen(port);
      started = true;
      console.log("✅ Consumer Service đang lắng nghe:");
      // console.log("  - Kafka: "); // ❌ ĐÃ XÓA
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

  if (!started) {
    throw new Error(
      `Không thể tìm port available sau ${maxAttempts} lần thử (từ ${parseInt(
        process.env.PORT || "3001",
        10
      )} đến ${port - 1})`
    );
  }
}
bootstrap();
