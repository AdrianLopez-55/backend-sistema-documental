import { Injectable, HttpException } from '@nestjs/common';
import { CreateRolDto } from './dto/create-rol.dto';
import { UpdateRolDto } from './dto/update-rol.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Rol, RolDocument } from './schema/rol.schema';
import { Model } from 'mongoose';
import {
  Permission,
  PermissionDocument,
} from 'src/permissions/schemas/permission.schema';
import { HttpService } from '@nestjs/axios';
import { SetPermissionToRolDto } from './dto/permission.rol';
import { Request } from 'express';

@Injectable()
export class RolService {
  constructor(
    @InjectModel(Rol.name)
    private readonly rolModel: Model<RolDocument>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
    private httpService: HttpService,
  ) {}

  async setRolesDefault() {
    const count = await this.rolModel.estimatedDocumentCount();
    if (count > 0) return;
    const values = await Promise.all([
      this.rolModel.create({ rolName: 'user' }),
      this.rolModel.create({ rolName: 'admin' }),
      this.rolModel.create({ rolName: 'superadmin' }),
    ]);
    return values;
  }

  async sowAllRols() {
    const dataRol = await this.rolModel.find();
    return dataRol;
  }

  async findRolActive(): Promise<Rol[]> {
    const rolActives = await this.rolModel.find({ activeRol: true }).exec();
    return rolActives.sort((a, b) => a.rolName.localeCompare(b.rolName));
  }

  async getRolbyId(id: string) {
    return this.rolModel.findById(id);
  }

  async createNewRol(rolObject: CreateRolDto) {
    return await this.rolModel.create(rolObject);
  }

  async updateRol(id: string, rolObject: UpdateRolDto) {
    return await this.rolModel.findByIdAndUpdate(id, rolObject, { new: true });
  }

  async setPermission(id: string, setPermissionObject: SetPermissionToRolDto) {
    const findRol = await this.rolModel.findById(id);
    if (!findRol) {
      throw new HttpException('rol no encontrado', 404);
    }
    const { permissionName } = setPermissionObject;
    const findPermission = await this.permissionModel.findOne({
      permissionName,
    });
    if (!findPermission) {
      const permissions = await this.permissionModel.find({});
      const combinedArray = [...permissions];
      const permissionFind = combinedArray.filter(
        (permission) => permission.permissionName == permissionName,
      );

      if (!permissionFind) {
        throw new HttpException('permiso no encontrado', 404);
      }
      if (!findRol.permissionName.includes(permissionFind[0]._id.toString())) {
        findRol.permissionName.push(permissionFind[0]._id.toString());
      } else {
        throw new HttpException('El permiso ya existe en el rol', 400);
      }
      return findRol.save();
    }

    if (!findRol.permissionName.includes(findPermission._id.toString())) {
      findRol.permissionName.push(findPermission._id.toString());
    } else {
      throw new HttpException('el permiso ya existe en el rol', 400);
    }

    return findRol.save();
  }

  async deleteRol(id: string, activeRol: boolean) {
    const rol: RolDocument = await this.rolModel.findById(id);
    rol.activeRol = false;
    await rol.save();
    return rol;
  }

  async activerRol(id: string, activeRol: boolean) {
    const rol: RolDocument = await this.rolModel.findById(id);
    if (rol.activeRol === true) {
      throw new HttpException('rol ya esta activado', 400);
    }
    rol.activeRol = true;
    await rol.save();
    return rol;
  }

  async filterParams(request: Request) {
    return this.rolModel
      .find(request.query)
      .sort({ rolName: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
  }
}
