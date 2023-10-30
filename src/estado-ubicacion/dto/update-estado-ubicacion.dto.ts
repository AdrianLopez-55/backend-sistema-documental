import { PartialType } from '@nestjs/swagger';
import { CreateEstadoUbicacionDto } from './create-estado-ubicacion.dto';

export class UpdateEstadoUbicacionDto extends PartialType(CreateEstadoUbicacionDto) {}
