import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiService } from './api.service';
import { LoginCentralAuthDTO } from './api.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '../interfaces/user.interface';
import { HttpService } from '@nestjs/axios';

@Controller('api')
@ApiTags('Validate Token')
export class ApiController {
  private readonly apiSeguridad = process.env.API_CENTRAL;
  constructor(
    private apiService: ApiService,
    private readonly httpService: HttpService,
  ) {}

  @Post('login-central')
  @ApiOperation({ summary: 'use token and app to confirm login' })
  async verifyToken(
    @Body() loginCentralAuthDTO: LoginCentralAuthDTO,
    @Res() res: Response,
  ) {
    try {
      const { app, token } = loginCentralAuthDTO;
      const response = await this.httpService
        .post(`${this.apiSeguridad}/auth/verify-app-token`, loginCentralAuthDTO)
        .toPromise();
      console.log(token);
      res.status(200).send(response.data);

      return token;
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        res.status(status).send(data);
      } else {
        throw new HttpException(
          'ocurrio un error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  // @Post('login-test')
  // async authLogin(
  //   @Res() res: Response,
  //   @Body() loginAuthDocumentalDTO: LoginCentralAuthDTO,
  // ) {
  //   const response = await this.apiService.loginAuthDocumental(
  //     loginAuthDocumentalDTO,
  //   );
  //   return res.status(HttpStatus.OK).json({ response });
  // }

  // @Post('login-test-test')
  // async loginCentral(
  //   @Req() req: Request,
  //   @Res() res: Response,
  //   @Body() loginCentralDTO: LoginCentralAuthDTO,
  // ) {
  //   try {
  //     console.log(loginCentralDTO);
  //     const response = await this.apiService.loginAuthCentralTest(
  //       loginCentralDTO,
  //     );
  //     return res.send(response);
  //   } catch (error) {
  //     console.log(error);
  //     throw error;
  //   }
  // }
}
