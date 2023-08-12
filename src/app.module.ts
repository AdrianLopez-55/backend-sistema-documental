import { Module, NestModule, MiddlewareConsumer  } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiModule } from './ServiceApi/api.module';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from './documents/documents.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
// import { PersonalModule } from './personal/personal.module';
// import { PersonalController } from './personal/personal.controller';
// import { PersonalService } from './personal/personal.service';
import configuration from './config/configuration';
import getConfig from './config/configuration';
import { MulterModule } from '@nestjs/platform-express';
// import { PermissionsModule } from './permissions/permissions.module';
import { OrganizationChartModule } from './organization-chart/organization-chart.module';
import { DocumentationTypeModule } from './documentation-type/documentation-type.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ErrorsInterceptor } from './interceptors/error-format.interceptor';
import { AuthMiddleware } from './auth.middleware';
import { User } from './interfaces/user.interface';
import { StepService } from './step/step.service';
import { WorkflowService } from './workflow/workflow.service';
import { WorkflowModule } from './workflow/workflow.module';
import { StepModule } from './step/step.module';
import * as path from 'path';
import * as ejs from 'ejs';

@Module({
  imports: [
    ApiModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DocumentsModule,
    MongooseModule.forRoot(getConfig().mongodb), //process.env.MONGO_URI, {dbName: process.env.DB_NAME}),
    PassportModule,
    HttpModule,
    // PersonalModule,
    MulterModule.register({
      limits: {
        fileSize: 10485760,
      },
    }),
    // PermissionsModule,
    OrganizationChartModule,
    DocumentationTypeModule,
    WorkflowModule,
    StepModule,
  ],
  controllers: [AppController, /*PersonalController*/],
  providers: [/*{provide: APP_INTERCEPTOR, useClass: ErrorsInterceptor},*/ AppService, /*PersonalService,*/],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply((req, res, next) => {
      res.render = (view, options) => {
        ejs.renderFile(path.join(__dirname, '..', 'views', view + '.ejs'), options, (err, str) => {
          if (err) throw err;
          res.send(str);
        });
      };
      next();
    });
    consumer.apply(AuthMiddleware).forRoutes('*')
  }
}
