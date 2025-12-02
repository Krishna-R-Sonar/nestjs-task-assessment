// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { QueryFailedFilter } from './common/filters/query-failed.filter';

dotenv.config();

console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'LOADED' : 'MISSING!!!');
console.log('DB_HOST:', process.env.DB_HOST);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new QueryFailedFilter());
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Task Manager API')
    .setDescription('NestJS + JWT + TypeORM + Docker')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log('API Running: http://localhost:3000/api');
}
bootstrap();