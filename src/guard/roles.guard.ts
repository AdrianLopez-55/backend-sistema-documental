import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from './constants/roles';
import { HttpService } from '@nestjs/axios';


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private httpService:HttpService
    ) {}

  async canActivate(context: ExecutionContext){
    
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No autorizado, no existe token');
    }

    let userRoles
    
    try {
      const decodedToken = await this.httpService.post('http://localhost:3110/api/auth/decoded',{token}).toPromise() 

      userRoles = decodedToken.data.roles
    } catch (error) {
      throw error.response?.data
    }
    
  
    for (const role of userRoles) {

      if (requiredRoles.includes(role.name)) {
        return true;
      }
    }
    throw new UnauthorizedException('No tienes permisos para ejecutar esta acción');
  }

  private extractTokenFromHeader(request: Request & { headers: { authorization?: string } }): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
