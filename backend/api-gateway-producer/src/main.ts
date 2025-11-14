import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ SET GLOBAL PREFIX
  app.setGlobalPrefix('api');

  // ✅ ENABLE CORS
  app.enableCors({
    origin: '*', // Cho phép mọi origin (dev only)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT || 3000);
  console.log('🚀 Producer Service running on http://localhost:3000');
}
bootstrap();