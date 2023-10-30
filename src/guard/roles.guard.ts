import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from './constants/Permission';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PermissionDocument,
  Permission as PermissionSchema,
} from 'src/permissions/schemas/permission.schema';
import { Rol, RolDocument } from 'src/rol/schema/rol.schema';
import getConfig from '../config/configuration';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private httpService: HttpService,
    @InjectModel(PermissionSchema.name)
    private readonly permissionModel: Model<PermissionDocument>,
    @InjectModel(Rol.name) private readonly rolModel: Model<RolDocument>,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredPermission = this.reflector.getAllAndOverride<Permission[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );
    // console.log('estos son requiredPermission, permisos requeridos');
    // console.log(requiredPermission);

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No autorizado, no existe token');
    }

    let userPermission;
    let userDataId;
    let userDataRol;
    let userPassword;
    let tokenDat;
    try {
      const decodedToken = await this.httpService
        .post(`${getConfig().api_central}/auth/decoded`, { token })
        .toPromise();
      //-------------usuarios
      userDataId = decodedToken.data.idUser;
      userDataRol = decodedToken.data.roles;
      userPassword = decodedToken.data.password;
      tokenDat = token;
      // console.log('esto es id del usuario mediante guard');
      // console.log(userDataId);
      // console.log('esto es roles id del usuario mediaten guard');
      // console.log(userDataRol);
      request['user'] = userDataId;
      request['userRol'] = userDataRol;
      request['password'] = userPassword;
      request['token'] = tokenDat;

      //-------------roles ----

      if (decodedToken.data.roles.length === 0) {
        throw new HttpException('no tiene roles', 401);
      }

      const rolesWithDetails = await Promise.all(
        decodedToken.data.roles.map((roleId) =>
          this.httpService
            .get(`${getConfig().api_central}/rol/${roleId}`)
            .toPromise(),
        ),
      );

      const roleDetails = rolesWithDetails.map((response) => response.data);

      const roleNames = roleDetails.map((role) => role.rolName);
      // console.log('estos son nombre de los roles del usuario logeado');
      // console.log(roleNames);
      if (!roleNames) {
        throw new HttpException('no tiene los permisos necesarios', 403);
      }

      let hasRequiredPermissions = true;
      for (const rolName of roleNames) {
        const findRole = await this.rolModel
          .findOne({ rolName: rolName })
          .exec();
        // console.log('es el findRole encontrado en mi cru de roles');
        // console.log(findRole);

        if (findRole) {
          const rolePermissions = findRole.permissionName;
          // console.log('estos son los permisos (ids) dentro del rol de mi crud');
          // console.log(rolePermissions);
          if (rolePermissions.length === 0) {
            hasRequiredPermissions = false;
          }
          for (const rolePermission of rolePermissions) {
            const findPermission = await this.permissionModel
              .findById(rolePermission)
              .exec();
            // console.log(
            //   'estos son los datos que se encontro de los permisos dentro de mi crud de permisos',
            // );
            // console.log(findPermission);
            if (findPermission) {
              const hasAllPermissions = requiredPermission.every((permission) =>
                findPermission.permissionName.includes(permission),
              );
              const esIgual = requiredPermission.filter(
                (permission) => permission == findPermission.permissionName,
              );
              // console.log('para ver si hay valor de permiso igual');
              // console.log(esIgual);
              // console.log('hasAllPermissions');
              // console.log(hasAllPermissions);
              if (esIgual.length > 0) {
                hasRequiredPermissions = true;
                return true;
              } else {
                hasRequiredPermissions = false;
              }
            } else {
              hasRequiredPermissions = false;
            }
          }
        } else {
          hasRequiredPermissions = false;
        }
      }
      if (!hasRequiredPermissions) {
        throw new HttpException('el rol no tiene los permisos requeridos', 403);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw error.response?.data;
    }
  }

  private extractTokenFromHeader(
    request: Request & { headers: { authorization?: string } },
  ): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
