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
  Query,
} from '@nestjs/common';
import { DigitalSignatureService } from './digital-signature.service';
import { RolesGuard } from 'src/guard/roles.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from 'src/guard/decorators/permissions.decorator';
import { Permission } from 'src/guard/constants/Permission';
import { LoggerInterceptor } from 'src/interceptors/loggerinterceptors';
import { CredentialUserDto } from './dto/CredentialUser.dto';
import { PaginationDto } from 'src/common/pagination.dto';

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
  @ApiOperation({ summary: 'Create credentials from a user' })
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
  @ApiOperation({ summary: 'Signature document by ID document' })
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
  @ApiOperation({ summary: 'Show users with digital signature' })
  getUsersWithDigitalSignature() {
    return this.digitalSignatureService.getUsersDigitalSignatures();
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('get-keys-user')
  @ApiOperation({ summary: 'Show all user credentials' })
  async getKeysUser(@Req() req) {
    const userId = req.user;
    return this.digitalSignatureService.getUserWithDigitalSignature(userId);
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Get('get-documents-with-digital-signature-user')
  @ApiOperation({ summary: 'Show your documents with digital signature' })
  async getDocumentsWithDigitalSignatureUser(@Req() req) {
    const userId = req.user;
    return this.digitalSignatureService.getDocumentsWithDigitalSignatureUser(
      userId,
    );
  }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @ApiQuery({ name: 'limit', type: Number, example: 10, required: false })
  @ApiQuery({ name: 'page', type: Number, example: 1, required: false })
  @Get('get-documents-signatured-paginate')
  async getDocumentsSignaturedPaginate(
    @Query() paginationDto: PaginationDto,
    @Req() req,
  ) {
    const userId = req.user;
    return await this.digitalSignatureService.getDocumentsSignaturePaginate(
      userId,
      paginationDto,
    );
  }

  // @Get('verify/:documentId')
  // async verifyDocument(@Param('documentId') documentId: string){
  //   const document = this.digitalSignatureService.vali
  // }

  @ApiBearerAuth()
  @Permissions(Permission.USER, Permission.ADMIN, Permission.SUPERADMIN)
  @Post('recover-pin')
  @ApiOperation({
    summary: 'This endpoint use to recover pin from a user logged',
  })
  async recoverPin(@Req() req, @Body() credentialUserDto: CredentialUserDto) {
    const userId = req.user;
    const passwordUser = req.password;
    return this.digitalSignatureService.recoverPin(
      userId,
      passwordUser,
      credentialUserDto,
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
