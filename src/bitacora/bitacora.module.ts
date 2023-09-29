import { Module } from '@nestjs/common';
import { BitacoraController } from './bitacora.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Bitacora, BitacoraSchema } from './schema/bitacora.schema';
import { HttpModule } from '@nestjs/axios';
import { BitacoraService } from './bitacora.service';
import { CustomErrorService } from 'src/error.service';
import { LoggerInterceptor } from 'src/interceptors/loggerinterceptors';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bitacora.name, schema: BitacoraSchema },
    ]),
    HttpModule,
  ],
  controllers: [BitacoraController],
  providers: [LoggerInterceptor, BitacoraService],
})
export class BitacoraModule {}
