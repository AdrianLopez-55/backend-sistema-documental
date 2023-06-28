import { Module } from '@nestjs/common';
import { Base64DocumentController } from './base64-document.controller';
import { Base64DocumentService } from './base64-document.service'
import { HttpModule } from '@nestjs/axios'

@Module({
	imports:[
		HttpModule
	],
	providers:[Base64DocumentService],
	controllers:[Base64DocumentController],
})
export class ApiModule {}