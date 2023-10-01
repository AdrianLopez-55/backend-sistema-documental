import {
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  Param,
  Delete,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { DigitalSignatureService } from './digital-signature.service';
import { RolesGuard } from 'src/guard/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/guard/decorators/permissions.decorator';
import { Permission } from 'src/guard/constants/Permission';
import { LoggerInterceptor } from 'src/interceptors/loggerinterceptors';
import { signatureDocumentDto } from './dto/signatureDocument.dto';
import { CredentialUserDto } from './dto/CredentialUser.dto';

@Controller('digital-signature')
@ApiTags('digital-signature')
@UseGuards(RolesGuard)
@UseGuards()
export class DigitalSignatureController {
  constructor(
    private readonly digitalSignatureService: DigitalSignatureService,
  ) {}

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  // @UseInterceptors(LoggerInterceptor)
  @Post('generate-credential')
  @ApiOperation({ summary: 'create credentials from a user' })
  generateKeys(@Req() req, @Body() createCredentialDto: CredentialUserDto) {
    const userId = req.user;
    const passwordUser = req.password;

    return this.digitalSignatureService.createKeys(
      userId,
      createCredentialDto,
      passwordUser,
    );
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  // @UseInterceptors(LoggerInterceptor)
  @Post(':documentId/signature-document')
  @ApiOperation({ summary: 'signature document by ID document' })
  signatureDocument(
    @Body() signatureDocumentDto: CredentialUserDto,
    @Param('documentId') documentId: string,
    @Req() req,
  ) {
    const userId = req.user;
    const passwordUser = req.password;
    return this.digitalSignatureService.signatureDocument(
      documentId,
      userId,
      passwordUser,
      signatureDocumentDto,
    );
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get()
  @ApiOperation({ summary: 'show users with digital signature' })
  getUsersWithDigitalSignature() {
    return this.digitalSignatureService.getUsersDigitalSignatures();
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('get-keys-user')
  async getKeysUser(@Req() req) {
    const userId = req.user;
    return this.digitalSignatureService.getUserWithDigitalSignature(userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('get-documents-with-digital-signature-user')
  async getDocumentsWithDigitalSignatureUser(@Req() req) {
    const userId = req.user;
    return this.digitalSignatureService.getDocumentsWithDigitalSignatureUser(
      userId,
    );
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  // @UseInterceptors(LoggerInterceptor)
  @Delete('delete-digital-signature/:id')
  @ApiOperation({ summary: 'show if you have a digital signature' })
  deleteDigitalSignature(@Req() req, @Param('id') id: string) {
    const userId = req.user;
    return this.digitalSignatureService.removeDigitalSignature(id, userId);
  }
}
