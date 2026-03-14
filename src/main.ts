import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Префикс для всех роутов (api/v1/students)
  app.setGlobalPrefix('api');

  // 2. Глобальная валидация (авто-проверка DTO)
    app.useGlobalPipes(
    new ValidationPipe  ({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false, // Временно отключаем для отладки
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        console.log('🚨 Validation errors:', JSON.stringify(errors, null, 2));
        return new BadRequestException({
          message: 'Validation failed',
          errors: errors.map(error => ({
            field: error.property,
            value: error.value,
            constraints: error.constraints,
            children: error.children
          }))
        });
      }
    })
  );
  const config = new DocumentBuilder()
  .setTitle('Watercourse CRM API')
  .setDescription('Система управления учебным центром')
  .setVersion('1.0')
  .addBearerAuth() // Чтобы можно было тестировать защищенные роуты
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);

  // 3. CORS для твоего React-фронта
  app.enableCors({
    origin: 'http://localhost:5173', 
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
