import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Step, StepSchema } from './schemas/step.schema';
import { StepService } from './step.service';
import { StepController } from './step.controller';
import { HttpModule, HttpService } from '@nestjs/axios';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Step.name, schema: StepSchema }
		]),
		HttpModule,
	],
	providers: [StepService, ],
	exports: [StepService],
	controllers: [StepController],
})
export class StepModule {}
