import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import getConfig from './config/configuration';
import * as express from 'express';
import * as fs from 'fs';
import * as bodyParser from 'body-parser';
// import { ErrorManager } from './documents/error.interceptor';
import { AuthGuard } from './guards/auth.guard';
import { LoggerMiddleware } from './logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(express.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));
  // app.use(LoggerMiddleware);

  

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
    .addTag('Documents')
    .addTag('Docx')
    // .addTag('External Data Personal')
    .addTag('external-organization-chart-data')
    .addTag('documentation-type')
    // .addTag('Permissions')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync('./swagger.json', JSON.stringify(document));

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      filter: true,
      showRequestDuration: true,
    },
  });

  // app.useGlobalInterceptors(new ErrorManager());
  // app.useGlobalGuards(new AuthGuard());
  await app.listen(getConfig().port);
}
bootstrap();
