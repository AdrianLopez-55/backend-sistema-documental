// import { Module } from '@nestjs/common';
// import { Base64DocumentController } from './base64-document.controller';
// import { Base64DocumentService } from './base64-document.service'
// import { HttpModule } from '@nestjs/axios'
// import { MongooseModule } from '@nestjs/mongoose';
// import { Base64File, Base64FileSchema } from './schema/base64-document.schema';

// @Module({
// 	imports:[
// 		MongooseModule.forFeature([
// 			{name: Base64File.name, schema: Base64FileSchema}
// 		]
// 		),
// 		HttpModule,
// 	],
// 	providers:[Base64DocumentService],
// 	controllers:[Base64DocumentController],
// })
// export class Base64DocumentModule {}