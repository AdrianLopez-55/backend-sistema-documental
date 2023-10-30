import { Module } from '@nestjs/common';
import { EstadoUbicacionService } from './estado-ubicacion.service';
import { EstadoUbicacionController } from './estado-ubicacion.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EstadoUbiacion,
  EstadoUbiacionSchema,
} from './schema/estado-ubicacion.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EstadoUbiacion.name, schema: EstadoUbiacionSchema },
    ]),
    HttpModule,
  ],
  controllers: [EstadoUbicacionController],
  providers: [EstadoUbicacionService],
  // imports: [EstadoUbicacionService],
})
export class EstadoUbicacionModule {}
