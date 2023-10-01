// import { Module } from '@nestjs/common';
// import { MessageGateway } from './gateway';
// import { MongooseModule } from '@nestjs/mongoose';
// import {
//   Permission,
//   PermissionSchema,
// } from 'src/permissions/schemas/permission.schema';
// import { Rol, RolSchema } from 'src/rol/schema/rol.schema';
// import { HttpModule } from '@nestjs/axios';
// import { GatewayController } from './gateway.controller';
// import { GatewayService } from './gateway.service';

// @Module({
//   imports: [
//     MongooseModule.forFeature([
//       { name: Permission.name, schema: PermissionSchema },
//       { name: Rol.name, schema: RolSchema },
//     ]),
//     HttpModule,
//   ],
//   providers: [MessageGateway, GatewayService],
//   controllers: [GatewayController],
// })
// export class GatewayModule {}
