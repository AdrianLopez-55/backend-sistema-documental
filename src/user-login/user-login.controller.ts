import {
  Controller,
  Get,
  HttpException,
  HttpServer,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/guard/roles.guard';
import { Permissions } from '../guard/decorators/permissions.decorator';
import { Permission } from 'src/guard/constants/Permission';
import { HttpService } from '@nestjs/axios';
import { UserLoginService } from './user-login.service';

@ApiTags('user-logedd-info')
@UseGuards(RolesGuard)
@Controller('user-login')
export class UserLoginController {
  constructor(
    private readonly httpService: HttpService,
    private readonly userLoginService: UserLoginService,
  ) {}

  @ApiBearerAuth()
  @Permissions(Permission.USER)
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('profile')
  @ApiOperation({ summary: 'see data of the logged in user' })
  async getUserLogged(@Request() req) {
    const userId = req.user;
    const userRol = req.userRol;
    return this.userLoginService.getUserLogged(userId, userRol);
  }
}
