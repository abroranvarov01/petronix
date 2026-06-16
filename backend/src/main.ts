import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
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

/** Allowed browser origins. Configurable via CORS_ORIGINS (comma-separated). */
function corsOrigins(): string[] {
  const fromEnv = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean);
  if (fromEnv?.length) return fromEnv;
  return [
    'https://petronix.uz',
    'https://www.petronix.uz',
    'http://localhost:3000',
  ];
}

async function bootstrap() {
  assertProdSecrets();
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: corsOrigins(),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger only outside production — avoid leaking the API surface.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Petronix API')
      .setDescription('API для платформы CNG оборудования Petronix')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
