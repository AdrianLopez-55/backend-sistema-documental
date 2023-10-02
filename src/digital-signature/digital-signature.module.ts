import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
import { Bitacora, BitacoraSchema } from 'src/bitacora/schema/bitacora.schema';
import {
  CredentialUser,
  CredentialUserSchema,
} from './schemas/credentialUser.schema';
import { PinUser, PinUserSchema } from './schemas/pinUser.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CredentialUser.name, schema: CredentialUserSchema },
      { name: PinUser.name, schema: PinUserSchema },
      { name: Rol.name, schema: RolSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: Documents.name, schema: DocumentsSchema },
      { name: Bitacora.name, schema: BitacoraSchema },
    ]),
    HttpModule,
  ],
  controllers: [DigitalSignatureController],
  providers: [DigitalSignatureService],
})
export class DigitalSignatureModule {}
