/*

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from './constants/Permission';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private httpService: HttpService) {}

  async canActivate(context: ExecutionContext) {
    const requiredPermission = this.reflector.get<Permission>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true; // Si no se proporciona un permiso requerido, se permite el acceso.
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No autorizado, no existe token');
    }

    try {
      const decodedToken = await this.httpService
        .post(`${getConfig().api_central}/auth/decoded`, { token })
        .toPromise();

      if (decodedToken.data.roles.length === 0) {
        throw new UnauthorizedException('El usuario no tiene roles asignados.');
      }

      //       //----usuario ------
      let userDataId = decodedToken.data.idUser;
      let userDataRol = decodedToken.data.roles;
      let userPassword = decodedToken.data.password;
      // let userApp = decodedToken.data
      let tokenDat = token;

      request['user'] = userDataId;
      request['userRol'] = userDataRol;
      request['password'] = userPassword;
      request['token'] = tokenDat;

      const rolesWithDetails = await Promise.all(
        decodedToken.data.roles.map((roleId) =>
          this.httpService
            .get(`${getConfig().api_central}/rol/${roleId}`)
            .toPromise(),
        ),
      );
      const dataRoles = rolesWithDetails.map((response) => response.data);
      // console.log('dataRoles', dataRoles);

      const userPermission = rolesWithDetails
        .map((response) => response.data.permissionName)
        .filter((item) => item !== undefined)
        .flat();
      console.log('userPermission', userPermission);

      //AL OBTENER LOS PERMISOS DEL USUARIO SE OBTIENE DIRECTO LOS NOMBRES:

      // {
      //   _id: '654a4597bc5330d627920fef',
      //   permissionName: 'CENTRAL_ESTABLECER_CONTRASEÑA_USUARIO',
      //   __v: 0
      // },

      //POR LO TANTO YA NO HACE FALTA REALIZAR EL SIGUIENTE CODIGO
      // SOLO USAR SI SE USA CENTRAL DE LOCALHOST
      //--------------- SOLO USAR CON CENTRAL LOCALHOST -------------\\
      // const userPermissionWithName = await Promise.all(
      //   userPermission.map((permissionId) =>
      //     this.httpService
      //       .get(`${getConfig().api_central}/permission/${permissionId}`)
      //       .toPromise(),
      //   ),
      // );

      // const permissionNames = userPermission.map(
      //   (item) => item.data.permissionName,
      // );

      //------------------------------------------------------------------\\

      //----------- SOLO USAR SI SE USA CENTRAL EXTERNO ---------------------\\
      const permissionNames = userPermission.map((item) => item.permissionName);
      console.log(permissionNames);
      //------------------------------------------------------------------\\

      if (checkPermissions(requiredPermission, permissionNames)) {
        return true; // El usuario tiene el permiso requerido, permitir acceso.
      } else {
        throw new UnauthorizedException(
          'No tiene permisos para acceder al recurso.',
        );
      }
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException(
        'No se pudo verificar los permisos del usuario.',
      );
    }
    function checkPermissions(requiredPermissions, permissionNames) {
      return requiredPermissions.some((requiredPermission) =>
        permissionNames.includes(requiredPermission),
      );
    }
  }

  private extractTokenFromHeader(
    request: Request & { headers: { authorization?: string } },
  ): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}


*/

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
      if (!roleNames) {
        throw new HttpException('no tiene los permisos necesarios', 403);
      }

      let hasRequiredPermissions = true;
      for (const rolName of roleNames) {
        const findRole = await this.rolModel
          .findOne({ rolName: rolName })
          .exec();

        if (findRole) {
          const rolePermissions = findRole.permissionName;

          if (rolePermissions.length === 0) {
            hasRequiredPermissions = false;
          }
          for (const rolePermission of rolePermissions) {
            const findPermission = await this.permissionModel
              .findById(rolePermission)
              .exec();

            if (findPermission) {
              const hasAllPermissions = requiredPermission.every((permission) =>
                findPermission.permissionName.includes(permission),
              );
              const esIgual = requiredPermission.filter(
                (permission) => permission == findPermission.permissionName,
              );

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
