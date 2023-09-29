import {
  Injectable,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { generateKeyPairSync } from 'crypto';
import { Model } from 'mongoose';
import {
  DigitalSignature,
  DigitalSignatureDocument,
  DigitalSignatureSchema,
} from './schemas/digital-signature.schema';
import {
  DocumentDocument,
  Documents,
} from 'src/documents/schema/documents.schema';
import { HttpService } from '@nestjs/axios';
import { signatureDocumentDto } from './dto/signatureDocument.dto';
import { compare } from 'bcrypt';
import { CredentialUserDto } from './dto/CredentialUser.dto';
import { CredentialUser } from './schemas/credentialUser.schema';
import { PinUser } from './schemas/pinUser.schema';
const bcrypt = require('bcrypt');

@Injectable()
export class DigitalSignatureService {
  constructor(
    @InjectModel(DigitalSignature.name)
    private readonly digitalSignatureModel: Model<DigitalSignatureDocument>,
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
    const userData = await this.digitalSignatureModel
      .findOne({ userId: userId })
      .exec();
    if (userData) {
      throw new HttpException('usted ya cuenta con credenciales validos', 400);
    }

    const { password, pin } = createCredentialDto;

    const checkPassword = await compare(password, passwordUser);
    if (!checkPassword) {
      throw new UnauthorizedException('Credenciales invalidas');
    }
    // const allUser = await this.digitalSignatureModel.find().exec();
    // const dataAllUser = allUser.find((dat) => dat.hasPin);

    // console.log('todos los pin de los usuarios');
    // console.log(dataAllUser.hasPin);
    if (await this.validatePin(pin)) {
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
    } else {
      throw new HttpException(
        `El pin ${pin} no es valido, debe tener 5 caracteres con letras mayúsculas o numeros combinados`,
        400,
      );
    }
  }

  private async savePublicKey(
    userId: string,
    publicKey: string,
    privateKey: string,
    hasPin: string,
  ): Promise<any> {
    const key = new this.digitalSignatureModel({
      userId,
      publicKey,
      privateKey,
      hasPin,
    });

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
    await key.save();
    return { key, credentialUser, pinUser };
  }

  private async validatePin(pin: string) {
    const regex = /^[A-Z0-9]{5}$/;
    return regex.test(pin);
  }

  async signatureDocument(
    documentId: string,
    userId: string,
    passwordUser: string,
    signatureDocumentDto: CredentialUserDto,
  ) {
    const crypto = require('crypto');
    const document = await this.documentsModel.findById(documentId);
    if (document.active === false) {
      throw new HttpException('documento archivado', 400);
    }
    if (!document) {
      throw new HttpException('documento no encontrado', 404);
    }

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

  private async createPINHash(pin: string): Promise<string> {
    // generar un salt aleatorio
    const saltRounds = 15;
    const salt = await bcrypt.genSalt(saltRounds);

    // Hashear el PIN con el salt
    const hashedPIN = await bcrypt.hash(pin, salt);
    return hashedPIN;
  }

  async getKeysUser(userId: string) {
    const digitalSignatureUser = await this.digitalSignatureModel
      .find({ userId })
      .exec();
    return digitalSignatureUser;
  }

  async getDocumentsWithDigitalSignatureUser(
    userId: string,
  ): Promise<Documents[]> {
    const document = await this.documentsModel
      .find({ 'digitalSignatureDocument.userDigitalSignature': userId })
      .exec();
    return document;
  }

  async getUsersDigitalSignatures() {
    const digitalSignatures = await this.digitalSignatureModel.find().exec();
    return digitalSignatures;
  }

  async getUserWithDigitalSignature(userId: string): Promise<DigitalSignature> {
    try {
      const digitalSignature = await this.digitalSignatureModel
        .findOne({ userId: userId })
        .exec();
      if (!digitalSignature) {
        throw new HttpException('usted no cuenta con claves', 404);
      }
      return digitalSignature;
    } catch (error) {
      throw new HttpException('algo salio mal', 500);
    }
  }

  async removeDigitalSignature(id: string, userId: string): Promise<Documents> {
    const document = await this.documentsModel.findById(id).exec();
    if (!document) {
      throw new NotFoundException(`Documento con ID "${id}" no encontrado`);
    }
    const removeDigitalSignatureDocument =
      document.digitalSignatureDocument.filter(
        (signature) => signature.userDigitalSignature !== userId,
      );
    document.digitalSignatureDocument = removeDigitalSignatureDocument;
    await document.save();
    return document;
  }
}
