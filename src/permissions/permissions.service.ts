// import { Injectable, NotFoundException } from '@nestjs/common';
// import { CreatePermissionDto } from './dto/create-permission.dto';
// import { UpdatePermissionDto } from './dto/update-permission.dto';
// import { InjectModel } from '@nestjs/mongoose';
// import { Permission, PermissionDocument } from './schemas/permission.schema';
// import { Model } from 'mongoose';

// @Injectable()
// export class PermissionsService {
//   constructor(@InjectModel(Permission.name) private readonly permissionModel: Model<PermissionDocument>,){}

//   async create(createPermissionDto: CreatePermissionDto):Promise<Permission> {
//     return this.permissionModel.create(createPermissionDto);
//   }

//   async findAll(): Promise<Permission[]> {
//     return this.permissionModel.find().exec();
//   }

//   async findOne(id: string): Promise<Permission> {
//     return this.permissionModel.findOne({ _id: id }).exec();
//   }

//   async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
//     return this.permissionModel.findOneAndUpdate({ _id: id }, updatePermissionDto, { new: true });
//   }

//   // async remove(id: number) {
//   //   return `This action removes a #${id} permission`;
//   // }

//   async inactiverPermission(id: string, active: boolean) {
//     const permission: PermissionDocument = await this.permissionModel.findById(id);
//     if(!permission){
//       throw new NotFoundException('Permission not found')
//     }
//     permission.active = false;
// 		await permission.save()
// 		return permission;
// 	}

//   // async findPermissionActive(): Promise<PermissionDocument[]>{
//   //   // const activePermission: PermissionDocument[] = await this.permissionModel.find({ active: true }).exec();
// 	// 	return this.permissionModel.find({ active: true }).exec();
// 	// }

//   // async findDocumentsActive(query: any): Promise<Permission[]>{
// 	// 	return this.permissionModel.find(query).sort({numberDocument: 1}).setOptions({sanitizeFilter: true}).exec();
// 	// }
// }
