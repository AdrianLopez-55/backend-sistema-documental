import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiService } from './api.service';
import { LoginCentralAuthDTO } from './api.dto';
import { ApiTags } from '@nestjs/swagger';
import { User } from '../interfaces/user.interface';

@Controller('api')
@ApiTags('Validate Token')
export class ApiController {
  constructor(private apiService: ApiService) {}

  @Post('login-central')
  async loginCentral(
    @Req() req: Request,
    @Res() res: Response,
    @Body() loginCentralAuthDTO: LoginCentralAuthDTO,
  ) {
    try {
      console.log(loginCentralAuthDTO);
      const response = await this.apiService.loginAuthCentral(
        loginCentralAuthDTO,
        req
      );
      console.log('token enviado con exito');
      res.status(200).send(response.data);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  @Get('user-info')
  async getUserInfo(){
    const user: User = this.apiService.getAuthenticatedUser();
    return user;
  }
}
