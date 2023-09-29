import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BitacoraService } from './bitacora.service';

@Controller('bitacora')
@ApiTags('bitacora')
export class BitacoraController {
  constructor(private readonly bitacoraService: BitacoraService) {}

  @Get()
  async getBitacora() {
    return await this.bitacoraService.getAllBitacora();
  }
}
