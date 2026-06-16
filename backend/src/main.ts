import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

function assertProdSecrets() {
  if (process.env.NODE_ENV !== 'production') return;
  const jwt = process.env.JWT_SECRET;
  const insecure = !jwt || jwt.length < 16 || jwt === 'petronix-super-secret-key-2026' || jwt.startsWith('dev-');
  if (insecure) {
    throw new Error('JWT_SECRET is missing or insecure — set a strong, unique JWT_SECRET in production.');
  }
}

async function bootstrap() {
  assertProdSecrets();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Petronix API')
    .setDescription('API для платформы CNG оборудования Petronix')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
