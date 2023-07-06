import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType  } from '@nestjs/common';
import getConfig from './config/configuration'
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {cors: true});
  app.use(express.json({ limit: '10mb' }));
  // app.enableVersioning({
  //   type: VersioningType.HEADER,
  //   header: 'v=',
  // });
  // app.useGlobalPipes(new ValidationPipe({
  //   whitelist: true,
  //   forbidNonWhitelisted: true,
  //   transform: true,
  //   transformOptions: {
  //     enableImplicitConversion: true,
  //   }
  // }),);
  
  const config = new DocumentBuilder()
  .setTitle('API Documentation')
  .setDescription('api validate and registry documents')
  .setVersion('1.0')
  .addTag('Validate Token')
  .addTag('Registry Documents')
  .addTag('External Data Personal')
  .addTag('Road-map')
  .addBearerAuth()
  .build();

  
  const document = SwaggerModule.createDocument(app, config);

  
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      filter: true,
      showRequestDuration: true,
    }
  });

  await app.listen(getConfig().port);
}
bootstrap();
