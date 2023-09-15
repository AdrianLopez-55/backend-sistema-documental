import { Injectable, HttpException } from '@nestjs/common';
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

@Injectable()
export class DigitalSignatureService {
  constructor(
    @InjectModel(DigitalSignature.name)
    private readonly digitalSignatureModel: Model<DigitalSignatureDocument>,
    @InjectModel(Documents.name)
    private readonly documentsModel: Model<DocumentDocument>,
    private readonly httpService: HttpService,
  ) {}

  async createKeys(userId: string) {
    const userData = await this.digitalSignatureModel
      .findOne({ userId: userId })
      .exec();
    if (userData) {
      throw new HttpException('usted ya cuenta con firma digital valida', 400);
    }
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
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
    );
    return savePublicKeyUser;
  }

  private async savePublicKey(
    userId: string,
    publicKey: string,
    privateKey: string,
  ): Promise<any> {
    const key = new this.digitalSignatureModel({
      userId,
      publicKey,
      privateKey,
    });
    await key.save();
    return key;
  }

  async signatureDocument(documentId: string, userId: string) {
    const crypto = require('crypto');
    const document = this.documentsModel.findById(documentId);
    const documentString = JSON.stringify(
      document,
      Object.keys(document).sort(),
    );

    const sign = crypto.createSign('SHA256');
    sign.update(documentString, 'utf8');
    const user = await this.digitalSignatureModel
      .findOne({ userId: userId })
      .exec();
    console.log(user);
    const keyUser = user.privateKey;
    const signature = sign.sign(keyUser, 'base64');
    console.log(keyUser);
    console.log('firma digital del documento: ', signature);

    //------------confirmar firma -----------
    const publicKey = user.publicKey;
    const verify = crypto.createVerify('SHA256');
    verify.update(documentString, 'utf8');
    const isSignatureValid = verify.verify(publicKey, signature, 'base64');
    if (isSignatureValid) {
      console.log('firma valida');
    } else {
      console.log('firma no valida');
    }
    return `documento firmado con exito. La firma es: ${signature}`;
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

  // async signDocumentWithPrivateKey(privateKey: string, document: Buffer){
  //   try {
  //     const privateKeyResponse = await this.httpService.post('http://localhost:8091/api/sign/document', {
  //       document
  //     })
  //   } catch (error) {

  //   }
  // }
}
