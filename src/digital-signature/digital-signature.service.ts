import {
  Injectable,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { generateKeyPairSync } from 'crypto';
import { Model } from 'mongoose';
import {
  DocumentDocument,
  Documents,
} from 'src/documents/schema/documents.schema';
import { compare } from 'bcrypt';
import { CredentialUserDto } from './dto/CredentialUser.dto';
import { CredentialUser } from './schemas/credentialUser.schema';
import { PinUser } from './schemas/pinUser.schema';
const bcrypt = require('bcrypt');
import * as crypto from 'crypto';
import { PaginationDto } from 'src/common/pagination.dto';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration';

@Injectable()
export class DigitalSignatureService {
  private defaultLimit: number;
  constructor(
    @InjectModel(Documents.name)
    private readonly documentsModel: Model<DocumentDocument>,
    @InjectModel(CredentialUser.name)
    private readonly credentialUserModel: Model<CredentialUser>,
    @InjectModel(PinUser.name)
    private readonly pinUserModel: Model<PinUser>,
    private readonly httpService: HttpService,
  ) {}

  async createKeys(
    userId: string,
    createCredentialDto: CredentialUserDto,
    passwordUser: string,
  ) {
    if (!userId) {
      throw new HttpException(`usuario logeado sin datos`, 500);
    }
    const userData = await this.credentialUserModel.findOne({ userId: userId });
    if (userData) {
      throw new HttpException('Usted ya cuenta con credenciales válidos', 400);
    }

    const userPin = await this.pinUserModel.findOne({ userId: userId });
    if (userPin) {
      throw new HttpException('Usted ya cuenta con pin válido', 400);
    }

    const { password, pin } = createCredentialDto;

    const checkPassword = await compare(password, passwordUser);
    if (!checkPassword) {
      throw new UnauthorizedException('Contraseña inválida');
    }

    const pinInUse = await this.isPinUse(pin);

    // if (pinInUse) {
    //   throw new HttpException(`El pin ${pin} ya está en uso`, 400);
    // }

    if (await this.validatePin(pin)) {
      try {
        const hasPin = await this.createPINHash(pin);
        const { publicKey, privateKey } = generateKeyPairSync('rsa', {
          modulusLength: 4096,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
          },
        });
        const savePublicKeyUser = await this.savePublicKey(
          userId,
          publicKey,
          privateKey,
          hasPin,
        );
        return savePublicKeyUser;
      } catch (error) {
        throw new HttpException(`Esto es el error ${error}`, 500);
      }
    } else {
      throw new HttpException(
        `El pin ${pin} no es válido, debe tener 5 caracteres con letras mayúsculas y/o números combinados`,
        400,
      );
    }
  }

  async signatureDocument(
    documentId: string,
    userId: string,
    passwordUser: string,
    signatureDocumentDto: CredentialUserDto,
  ) {
    const crypto = require('crypto');
    const document = await this.validateDocumentFind(documentId);
    const documentString = JSON.stringify(
      document,
      Object.keys(document).sort(),
    );

    const sign = crypto.createSign('SHA256');
    sign.update(documentString, 'utf8');
    const userPin = await this.pinUserModel.findOne({ userId: userId }).exec();
    const userCredentials = await this.credentialUserModel
      .findOne({ userId: userId })
      .exec();

    const { password, pin } = signatureDocumentDto;

    const checkPassword = await compare(password, passwordUser);
    if (!checkPassword) {
      throw new UnauthorizedException('contraseña invalida');
    }

    const checkPin = await compare(pin, userPin.hasPin);
    if (!checkPin) {
      throw new UnauthorizedException('pin no valido');
    }

    const keyUser = userCredentials.privateKey;
    const signature = sign.sign(keyUser, 'base64');

    //------------confirmar firma -----------
    const publicKey = userCredentials.publicKey;
    const verify = crypto.createVerify('SHA256');
    verify.update(documentString, 'utf8');
    const isSignatureValid = verify.verify(publicKey, signature, 'base64');
    if (isSignatureValid) {
      console.log('firma valida');
    } else {
      console.log('firma no valida');
    }
    const newSignature = {
      digitalSignature: signature,
      userDigitalSignature: userId,
    };
    const hasUserSigned = document.digitalSignatureDocument.some(
      (signature) => signature.userDigitalSignature === userId,
    );
    if (hasUserSigned) {
      throw new HttpException('El usuario ya ha firmado este documento', 400);
    }
    document.digitalSignatureDocument.push(newSignature);
    await document.save();
    return document;
  }

  async verifySignature(
    document: any,
    signature: string,
    publicKey: string,
  ): Promise<boolean> {
    try {
      const documentString = JSON.stringify(
        document,
        Object.keys(document).sort(),
      );
      const verify = crypto.createVerify('SHA256');
      verify.update(documentString, 'utf8');
      const isSignatureValid = verify.verify(publicKey, signature, 'base64');

      return isSignatureValid;
    } catch (error) {
      console.error('Error al verificar la firma:', error);
      return false;
    }
  }

  async getKeysUser(userId: string) {
    const credentialUser = await this.credentialUserModel
      .find({ userId })
      .exec();
    const pinUser = await this.pinUserModel.find({ userId }).exec();

    return { credentialUser, pinUser };
  }

  async getDocumentsWithDigitalSignatureUser(
    userId: string,
  ): Promise<Documents[]> {
    const document = await this.documentsModel
      .find({ 'digitalSignatureDocument.userDigitalSignature': userId })
      .exec();
    return document;
  }

  async getDocumentsSignaturePaginate(
    userId: string,
    paginationDto: PaginationDto,
  ) {
    const { limit = this.defaultLimit, page = 1 } = paginationDto;
    const offset = (page - 1) * limit;
    const documents = await this.documentsModel
      .find({
        'digitalSignatureDocument.userDigitalSignature': userId,
      })
      .limit(limit)
      .skip(offset);

    const total = await this.documentsModel.countDocuments().exec();
    return {
      data: documents,
      total: total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUsersDigitalSignatures() {
    const credentialUsers = await this.credentialUserModel.find().exec();
    const pinUsers = await this.pinUserModel.find().exec();
    return { credentialUsers, pinUsers };
  }

  async getUserWithDigitalSignature(userId: string) {
    try {
      const credentialUser = await this.credentialUserModel
        .findOne({ userId: userId })
        .exec();

      const pinUserModel = await this.pinUserModel
        .findOne({ userId: userId })
        .exec();

      if (!credentialUser) {
        throw new HttpException('usted no cuenta con credenciales', 404);
      }
      if (!pinUserModel) {
        throw new HttpException('usted no cuenta con pin', 404);
      }

      return { credentialUser, pinUserModel };
    } catch (error) {
      throw new HttpException(`algo salio mal: ${error}`, 500);
    }
  }

  async recoverPin(
    userId: string,
    passwordUser: string,
    createCredentialDto: CredentialUserDto,
  ) {
    const userPin = await this.pinUserModel.findOne({ userId: userId });
    const { password, pin } = createCredentialDto;
    const checkPassword = await compare(password, passwordUser);
    if (!checkPassword) {
      throw new UnauthorizedException('Contraseña inválida');
    } else {
      if (await this.validatePin(pin)) {
        try {
          const hasPin = await this.createPINHash(pin);
          userPin.hasPin = hasPin;
          await userPin.save();
          return userPin;
        } catch (error) {
          throw new HttpException(`Esto es el error: ${error}`, 500);
        }
      }
    }
  }

  async getDigitalSignatureFromDocument(idDocument: string) {
    const document = await this.validateDocumentFind(idDocument);
    const userDigitalSignatureIds = document.digitalSignatureDocument.map(
      (signature) => signature.userDigitalSignature,
    );
    const obtenerNombreUsuario = async (userId) => {
      try {
        const response = await this.httpService
          .get(`${getConfig().api_personal}/api/personal/${userId}`)
          .toPromise();
        const { name, lastName, ci, unity } = response.data;
        return { name, lastName, ci, unity };
      } catch (error) {
        console.error(
          `Error al obtener el nombre para el usuario con ID ${userId}: ${error.message}`,
        );
        return null;
      }
    };

    const nombresUsuariosPromesas =
      userDigitalSignatureIds.map(obtenerNombreUsuario);

    const nombresUsuarios = await Promise.all(nombresUsuariosPromesas);

    return nombresUsuarios.map((datosUsuario) => {
      return { ...datosUsuario };
    });
  }

  async removeDigitalSignature(id: string, userId: string): Promise<Documents> {
    const document = await this.validateDocumentFind(id);
    const removeDigitalSignatureDocument =
      document.digitalSignatureDocument.filter(
        (signature) => signature.userDigitalSignature !== userId,
      );
    document.digitalSignatureDocument = removeDigitalSignatureDocument;
    await document.save();
    return document;
  }

  //----FUNCIONES USADAS PARA EL SERVICE
  private async validateDocumentFind(idDocument: string) {
    const document = await this.documentsModel.findById(idDocument).exec();
    if (!document) {
      throw new HttpException(
        `Documento con ID "${idDocument}" no encontrado`,
        404,
      );
    }
    if (document.active === false) {
      throw new HttpException(
        `El documento con ID "${idDocument}" fue archivado o eliminado`,
        400,
      );
    }
    return document;
  }

  private async isPinUse(pin: string): Promise<Boolean> {
    try {
      const pins = await this.pinUserModel.find().exec();
      for (const hasPin of pins) {
        const isMatch = await compare(pin, hasPin.hasPin);
        if (isMatch) {
          return true;
        }
      }
      return false;
    } catch (error) {
      throw new HttpException(`El error es: ${error}`, 500);
    }
  }

  private async createPINHash(pin: string): Promise<string> {
    try {
      // generar un salt aleatorio
      const saltRounds = 15;
      const salt = await bcrypt.genSalt(saltRounds);

      // Hashear el PIN con el salt
      const hashedPIN = await bcrypt.hash(pin, salt);
      return hashedPIN;
    } catch (error) {
      throw new HttpException(`Esto es el error: ${error}`, 500);
    }
  }

  private async savePublicKey(
    userId: string,
    publicKey: string,
    privateKey: string,
    hasPin: string,
  ): Promise<any> {
    try {
      const credentialUser = new this.credentialUserModel({
        userId,
        publicKey,
        privateKey,
      });

      const pinUser = new this.pinUserModel({
        userId,
        hasPin,
      });
      await credentialUser.save();
      await pinUser.save();
      return { credentialUser, pinUser };
    } catch (error) {
      throw new HttpException(`Esto es el error: ${error}`, 500);
    }
  }

  private async validatePin(pin: string) {
    const regex = /^[A-Z0-9]{5}$/;
    return regex.test(pin);
  }
}
