import { Controller, Post, Get, Req, UseGuards, Param } from '@nestjs/common';
import { DigitalSignatureService } from './digital-signature.service';
import { RolesGuard } from 'src/guard/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/guard/decorators/permissions.decorator';
import { Permission } from 'src/guard/constants/Permission';

@Controller('digital-signature')
@ApiTags('digital-signature')
@UseGuards(RolesGuard)
@UseGuards()
export class DigitalSignatureController {
  constructor(
    private readonly digitalSignatureService: DigitalSignatureService,
  ) {}

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post('generate')
  @ApiOperation({ summary: 'digitally sign a user' })
  generateKeys(@Req() req) {
    const userId = req.user;
    return this.digitalSignatureService.createKeys(userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Post(':documentId/signature-document')
  @ApiOperation({ summary: 'signature document by ID document' })
  signatureDocument(@Param('documentId') documentId: string, @Req() req) {
    const userId = req.user;
    return this.digitalSignatureService.signatureDocument(documentId, userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get()
  @ApiOperation({ summary: 'show users with dogital signature' })
  getUsersWithDigitalSignature() {
    return this.digitalSignatureService.getUsersDigitalSignatures();
  }

  @ApiBearerAuth()
  @Permissions(Permission.ADMIN)
  @Permissions(Permission.SUPERADMIN)
  @Get('user')
  @ApiOperation({ summary: 'show if you have a digital signature' })
  getUserDigitalSignature(@Req() req) {
    const userId = req.user;
    return this.digitalSignatureService.getUserWithDigitalSignature(userId);
  }

  // @ApiBearerAuth()
  // @Permissions(Permission.ADMIN)
  // @Permissions(Permission.SUPERADMIN)
  // @Post('upload-private-key')
  // async uploadPrivateKey(@Body() requestBody, @Req() req){
  //   const userId = req.user;
  //   const userPrivateKey = await this.digitalSignatureService.getUserWithDigitalSignature(userId)

  //   const privateKey = userPrivateKey.privateKey;
  //   const signedDocument = DigiSignLib.sign_pdf
  // }
}
