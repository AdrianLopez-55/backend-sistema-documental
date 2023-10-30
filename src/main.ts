import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import getConfig from './config/configuration';
import * as express from 'express';
import * as fs from 'fs';
import * as bodyParser from 'body-parser';
// import { ErrorManager } from './documents/error.interceptor';
import { AuthGuard } from './guards/auth.guard';
// import { LoggerMiddleware } from './logger.middleware';
import { PermissionsService } from './permissions/permission.service';
import { RolService } from './rol/rol.service';
// import * as io from 'socket.io';

async function bootstrap() {
  process.env.TZ = 'America/La_Paz';

  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(express.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(bodyParser.text({ type: 'text/html' }));

  const permission = app.get(PermissionsService);
  permission.setPermissionDefault();

  const rol = app.get(RolService);
  rol.setRolDefault();

  // const httpAdapter = app.getHttpAdapter();
  // const ioServer = new io.Server(httpAdapter)

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
    .addBearerAuth()
    .setTitle('API Document Management')
    .setDescription('api validate and registry documents')
    .setVersion('1.0')
    .addTag(
      'Validate Token',
      'Verify that the token and validation are correct',
    )
    .addTag(
      'user-logedd-info',
      'View the data of the authenticated user in the microservice',
    )
    .addTag('Documents', 'endpoints related to the CRUD of a document')
    .addTag('file', 'enpoints related to the update file for a document')
    .addTag(
      'documentation-type',
      'endpoints related to the CRUD of documentation types',
    )
    .addTag('workflows', 'endpoints related to creating a workflow')

    .addTag(
      'estado-ubicacion',
      'endpoints for view states and location from a documents',
    )

    .addTag(
      'step',
      'enpoints related to the creation of steps that a document must follow according to the organization chart',
    )
    .addTag(
      'rol',
      'enpoints related to the creation and designation of roles and permissions',
    )
    .addTag('Permissions', 'endpoints related to creating permissions')
    .addTag(
      'external-organization-chart-data',
      'endpoint related to obtaining the organizational chart',
    )
    .addTag('personal-get', 'obtain data personal')
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
