// import {
//   Controller,
//   Get,
//   Param,
//   HttpException,
//   HttpStatus,
//   Res,
// } from '@nestjs/common';
// import { PersonalService } from './personal.service';
// import { ApiOperation, ApiTags } from '@nestjs/swagger';
// import getConfig from '../config/configuration';
// import { Response } from 'express';

// @Controller('personal')
// export class PersonalController {
//   constructor(private readonly personalService: PersonalService) {}

//   @Get('external-data-personal')
//   @ApiOperation({ summary: 'get all personal registered' })
//   @ApiTags('External Data Personal')
//   public async getExternalData(@Res() res: Response): Promise<any> {
//     const url = `${getConfig().api_personal_get}`;
//     try {
//       const data = await this.personalService.fetchDataFromExternalServer(url);
//       res.send(data);
//       return data;
//     } catch (error) {
//       return 'Error al obtener datos del servidor externo';
//     }
//   }

//   @Get('external-data-personal/:id')
//   @ApiOperation({ summary: 'get personal by ID' })
//   @ApiTags('External Data Personal')
//   public async getExternalDataById(
//     @Param('id') personalId: string,
//   ): Promise<any> {
//     try {
//       const data = await this.personalService.fetchDataFromExternalServerById(
//         personalId,
//       );
//       return data;
//     } catch (error) {
//       return 'Error al obtener el id del personal externo';
//     }
//   }

//   @Get(':ci')
//   @ApiOperation({ summary: 'get personal by ci' })
//   @ApiTags('External Data Personal')
//   async getPersonalByCi(@Param('ci') ci: string): Promise<any> {
//     try {
//       const personalData =
//         await this.personalService.fetchDataFromExternalServerByCi(ci);
//       return personalData;
//     } catch (error) {
//       throw new HttpException(
//         'Error al obtener los datos del personal',
//         HttpStatus.INTERNAL_SERVER_ERROR,
//       );
//     }
//   }
// }
