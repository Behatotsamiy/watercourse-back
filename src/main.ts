import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser'; 
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   app.use(cookieParser());

  // 1. Префикс для всех роутов (api/v1/students)
  app.setGlobalPrefix('api');

  // 2. Глобальная валидация (авто-проверка DTO)
  app.useGlobalFilters(new AllExceptionsFilter());
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
const allowedOrigins = [
  'https://watercoursecrm.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.enableCors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
});

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
