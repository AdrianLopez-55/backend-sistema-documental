import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DigitalSignature,
  DigitalSignatureSchema,
} from './schemas/digital-signature.schema';
import { Rol, RolSchema } from 'src/rol/schema/rol.schema';
import {
  Permission,
  PermissionSchema,
} from 'src/permissions/schemas/permission.schema';
import { HttpModule } from '@nestjs/axios';
import { DigitalSignatureService } from './digital-signature.service';
import { DigitalSignatureController } from './digital-signature.controller';
import {
  Documents,
  DocumentsSchema,
} from 'src/documents/schema/documents.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DigitalSignature.name, schema: DigitalSignatureSchema },
      { name: Rol.name, schema: RolSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: Documents.name, schema: DocumentsSchema },
    ]),
    HttpModule,
  ],
  controllers: [DigitalSignatureController],
  providers: [DigitalSignatureService],
})
export class DigitalSignatureModule {}
