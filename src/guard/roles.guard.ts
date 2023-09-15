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
    try {
      const decodedToken = await this.httpService
        .post(`${getConfig().api_central}/auth/decoded`, { token })
        .toPromise();
      //-------------usuarios
      userDataId = decodedToken.data.idUser;
      userDataRol = decodedToken.data.roles;
      console.log('esto es id del usuario');
      console.log(userDataId);
      console.log(userDataRol);
      request['user'] = userDataId;
      request['userRol'] = userDataRol;

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
              if (hasAllPermissions) {
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

      //-----------uso de permisos del token
      // userPermission = roleDetails.map((index) => index.permissionName).flat();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw error.response?.data;
    }

    //---------- listar los permisos y comparlo con local, ya no usar ---
    // const findAllPermission = await this.permissionModel.find();
    // const filteredPermissions = findAllPermission.filter((permission) =>
    //   userPermission.includes(permission._id.toString()),
    // );
    // console.log(findAllPermission);
    // console.log(userPermission);
    // console.log('asfsadfdasf', filteredPermissions);

    // for (const permission of filteredPermissions) {
    //   if (requiredPermission[0] == permission.permissionName) {
    //     return true;
    //   }
    // }
    // throw new UnauthorizedException(
    //   'NO tiene permisos para ejecutar esta accion',
    // );
  }

  private extractTokenFromHeader(
    request: Request & { headers: { authorization?: string } },
  ): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
