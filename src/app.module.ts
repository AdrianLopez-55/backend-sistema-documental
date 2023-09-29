import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { ApiModule } from './ServiceApi/api.module';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from './documents/documents.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import configuration from './config/configuration';
import getConfig from './config/configuration';
import { MulterModule } from '@nestjs/platform-express';
import { OrganizationChartModule } from './organization-chart/organization-chart.module';
import { DocumentationTypeModule } from './documentation-type/documentation-type.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ErrorsInterceptor } from './interceptors/error-format.interceptor';
import { AuthMiddleware } from './auth.middleware';
import { User } from './interfaces/user.interface';
import { StepService } from './step/step.service';
import { WorkflowService } from './workflow/workflow.service';
import { WorkflowModule } from './workflow/workflow.module';
import { StepModule } from './step/step.module';
import { DocxModule } from './docx/docx.module';
import * as path from 'path';
import * as ejs from 'ejs';
import { PermissionsModule } from './permissions/permission.module';
import { RolModule } from './rol/rol.module';
import { UserLoginService } from './user-login/user-login.service';
import { UserLoginModule } from './user-login/user-login.module';
import { PersonalGetService } from './personal-get/personal-get.service';
import { PersonalGetController } from './personal-get/personal-get.controller';
import { PersonalGetModule } from './personal-get/personal-get.module';
import { TemplateModule } from './template/template.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { DigitalSignatureController } from './digital-signature/digital-signature.controller';
import { DigitalSignatureService } from './digital-signature/digital-signature.service';
import { DigitalSignatureModule } from './digital-signature/digital-signature.module';
import { GatewayModule } from './gateway/gateway.module';
import { RolesGuard } from './guard/roles.guard';
import { RoadmapModule } from './roadmap/roadmap.module';
// import { StateDocumentModule } from './state-document/state-document.module';
import { BitacoraService } from './bitacora/bitacora.service';
import { BitacoraModule } from './bitacora/bitacora.module';
import { Bitacora, BitacoraSchema } from './bitacora/schema/bitacora.schema';
import { CustomErrorService } from './error.service';
import { EmailService } from './email/email.service';
import { EmailController } from './email/email.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './template',
    }),
    ApiModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DocumentsModule,
    MongooseModule.forRoot(getConfig().mongodb, {
      dbName: getConfig().db_name,
    }), //process.env.MONGO_URI, {dbName: process.env.DB_NAME}),
    MongooseModule.forFeature([
      { name: Bitacora.name, schema: BitacoraSchema },
    ]),
    PassportModule,
    HttpModule,
    MulterModule.register({
      limits: {
        fileSize: 10485760,
      },
    }),
    OrganizationChartModule,
    DocumentationTypeModule,
    PermissionsModule,
    WorkflowModule,
    StepModule,
    DocxModule,
    RolModule,
    UserLoginModule,
    PersonalGetModule,
    TemplateModule,
    DigitalSignatureModule,
    GatewayModule,
    RoadmapModule,
    BitacoraModule,
  ],
  controllers: [PersonalGetController, EmailController],
  providers: [PersonalGetService, CustomErrorService, EmailService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes(
      { path: '/documents', method: RequestMethod.POST },
      { path: '/documents/*', method: RequestMethod.POST },
      { path: '/documents/*', method: RequestMethod.DELETE },
      { path: '/documents/*', method: RequestMethod.PUT },

      { path: '/documentation-type', method: RequestMethod.POST },
      { path: '/documentation-type/*', method: RequestMethod.PUT },
      { path: '/documentation-type/*', method: RequestMethod.DELETE },

      { path: '/workflow', method: RequestMethod.POST },
      { path: '/workflow/*', method: RequestMethod.PUT },
      { path: '/workflow/*', method: RequestMethod.DELETE },

      { path: '/step', method: RequestMethod.POST },
      { path: '/step/*', method: RequestMethod.PUT },
      { path: '/step/*', method: RequestMethod.DELETE },

      // { path: '/rol/*', method: RequestMethod.PUT },
      // { path: '/rol/*', method: RequestMethod.DELETE },

      // { path: '/permissions/*', method: RequestMethod.PUT },
      // { path: '/permissions/*', method: RequestMethod.DELETE },

      { path: '/roadmap', method: RequestMethod.POST },
      { path: '/roadmap/*', method: RequestMethod.PUT },
      { path: '/roadmap/*', method: RequestMethod.DELETE },

      { path: '/digital-signature', method: RequestMethod.POST },
      { path: '/digital-signature/*', method: RequestMethod.PUT },
      { path: '/digital-signature/*', method: RequestMethod.DELETE },
    );

    consumer.apply((req, res, next) => {
      res.render = (view, options) => {
        ejs.renderFile(
          path.join(__dirname, '..', 'views', view + '.ejs'),
          options,
          (err, str) => {
            if (err) throw err;
            res.send(str);
          },
        );
      };
      next();
    });
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
