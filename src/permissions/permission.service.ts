import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { Model } from 'mongoose';
import { Request } from 'express';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  async setPermissionDefault() {
    const count = await this.permissionModel.estimatedDocumentCount();
    if (count > 0) return;
    const values = await Promise.all([
      this.permissionModel.create({ permissionName: 'CREAR_DOCUMENTO_DOC' }),
      this.permissionModel.create({ permissionName: 'OBTENER_DOCUMENTOS_DOC' }),
      this.permissionModel.create({ permissionName: 'EDITAR_DOCUMENTO_DOC' }),
      this.permissionModel.create({ permissionName: 'ELIMINAR_DOCUMENTO_DOC' }),

      this.permissionModel.create({
        permissionName: 'CREAR_TIPO_DOCUMENTACION_DOC',
      }),
      this.permissionModel.create({
        permissionName: 'OBTENER_TIPOS_DOCUMENTACION_DOC',
      }),
      this.permissionModel.create({
        permissionName: 'EDITAR_TIPOS_DOCUMENTACION_DOC',
      }),
      this.permissionModel.create({
        permissionName: 'ELIMINAR_TIPOS_DOCUMENTACION_DOC',
      }),

      this.permissionModel.create({ permissionName: 'CREAR_PERMISO_DOC' }),
      this.permissionModel.create({ permissionName: 'OBTENER_PERMISO_DOC' }),
      this.permissionModel.create({ permissionName: 'EDITAR_PERMISO_DOC' }),
      this.permissionModel.create({ permissionName: 'ELIMINAR_PERMISO_DOC' }),
    ]);
    return values;
  }

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    return this.permissionModel.create(createPermissionDto);
  }

  async findAll(): Promise<Permission[]> {
    return this.permissionModel.find().exec();
  }

  async findAllActives(): Promise<Permission[]> {
    const permissionActives = await this.permissionModel
      .find({ active: true })
      .exec();
    return permissionActives.sort((a, b) =>
      a.permissionName.localeCompare(b.permissionName),
    );
  }

  async findOne(id: string): Promise<Permission> {
    return this.permissionModel.findOne({ _id: id }).exec();
  }

  async update(
    id: string,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    return this.permissionModel.findOneAndUpdate(
      { _id: id },
      updatePermissionDto,
      { new: true },
    );
  }

  // async remove(id: number) {
  //   return `This action removes a #${id} permission`;
  // }

  async inactiverPermission(id: string, active: boolean) {
    const permission: PermissionDocument = await this.permissionModel.findById(
      id,
    );
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    permission.active = false;
    await permission.save();
    return permission;
  }

  async activerPermission(id: string, active: boolean) {
    const permission: PermissionDocument = await this.permissionModel.findById(
      id,
    );
    if (!permission) {
      throw new HttpException('permission no existe', 404);
    }
    if (permission.active === true) {
      throw new HttpException('permission ya se encuentra activo', 400);
    }
    permission.active = true;
    await permission.save();
    return permission;
  }

  async filteParams(request: Request) {
    return this.permissionModel
      .find(request.query)
      .sort({ permissionName: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
  }

  // async findPermissionActive(): Promise<PermissionDocument[]>{
  //   // const activePermission: PermissionDocument[] = await this.permissionModel.find({ active: true }).exec();
  // 	return this.permissionModel.find({ active: true }).exec();
  // }

  // async findDocumentsActive(query: any): Promise<Permission[]>{
  // 	return this.permissionModel.find(query).sort({numberDocument: 1}).setOptions({sanitizeFilter: true}).exec();
  // }
}
