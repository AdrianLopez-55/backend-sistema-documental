import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiModule } from './ServiceApi/api.module';
import { ConfigModule } from '@nestjs/config';
import { DocumentsModule } from './documents/documents.module';
import { RoadMapModule } from './road-map/road-map.module';
//import { UsersModule } from './users/users.module';
import { CorrelationIdMiddleware } from './correlation-id/correlation-id.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './auth/auth.module';
import { CustomHeaderMiddleware } from './custom-header.middleware';
import { HttpModule } from '@nestjs/axios';
// import { MyController } from './myControllerGetPersonal.controller';
// import { ExternalDataService } from './externalDataService.service';
import { PersonalModule } from './personal/personal.module';
import { PersonalController } from './personal/personal.controller';
import { PersonalService } from './personal/personal.service';
// import { Base64DocumentController } from './base64-document/base64-document.controller';
// import { Base64DocumentService } from './base64-document/base64-document.service';
// import { MyController } from './myControllerGetPersonal.controller';
// import { ExternalDataService } from './externalDataService.service';
import configuration from './config/configuration'
import getConfig from './config/configuration'
// import { Base64DocumentModule } from './base64-document/base64-document.module';


@Module({
  imports: [
    ApiModule,
    ConfigModule.forRoot(
      {
        isGlobal: true,
        load: [configuration]
      }
    ),
    DocumentsModule,
    //UsersModule,
    RoadMapModule,
    MongooseModule.forRoot(getConfig().mongodb),//process.env.MONGO_URI, {dbName: process.env.DB_NAME}),
    PassportModule,
    AuthModule,
    HttpModule,
    PersonalModule,
    // Base64DocumentModule,
  ],
  controllers: [AppController, PersonalController,], //MyController],
  providers: [AppService, PersonalService,], //ExternalDataService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer){
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
    consumer.apply(CustomHeaderMiddleware).forRoutes('*');
  }
}
