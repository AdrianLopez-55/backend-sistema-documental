import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentDocument, Documents } from './schema/documents.schema';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration';

@Injectable()
export class GetDocumentsService {
  private readonly apiPersonalGet = getConfig().api_personal_get;
  constructor(
    @InjectModel(Documents.name)
    private readonly documentModel: Model<DocumentDocument>,
    private httpService: HttpService,
  ) {}

  async getDocumentReviewed(userId: string) {
    const documents = await this.documentModel.find().exec();

    for (const document of documents) {
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${this.apiPersonalGet}/${document.userId}`)
            .toPromise();
          document.userInfo = {
            name: res.data.name,
            lastName: res.data.lastName,
            ci: res.data.ci,
            email: res.data.email,
            unity: res.data.unity,
          };
        } catch (error) {
          document.userId = 'no se encontraron datos del usuario';
        }
      }

      document.userReceivedDocument.find((entry) => {
        return (
          entry.idOfUser === userId && entry.stateDocumentUser === 'REVISADO'
        );
      });
    }
    return document;
  }

  async getRecievedDocumentsWithWorkflow(userId: string): Promise<Documents[]> {
    const documents = await this.documentModel.find({ active: true }).exec();
    let showDocuments = [];
    for (const document of documents) {
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${this.apiPersonalGet}/${document.userId}`)
            .toPromise();
          document.userInfo = {
            name: res.data.name,
            lastName: res.data.lastName,
            ci: res.data.ci,
            email: res.data.email,
            unity: res.data.unity,
          };
        } catch (error) {
          document.userId = 'no se encontraron datos del usuario';
        }
      }
      const filteredDocumentsUserSome =
        document.userReceivedDocumentWithoutWorkflow.some((entry) => {
          return entry.idOfUser === userId;
        });
      if (filteredDocumentsUserSome) {
        document.stateDocumetUser = 'RECIBIDO DIRECTO';
        showDocuments.push(document);
      }
    }
    showDocuments.sort((a, b) => {
      const dateA = new Date(
        a.userReceivedDocumentWithoutWorkflow[0]?.dateRecived,
      ).getTime();
      const dateB = new Date(
        b.userReceivedDocumentWithoutWorkflow[0]?.dateRecived,
      ).getTime();
      return dateB - dateA;
    });
    return showDocuments;
  }

  async getRecievedDocument(idUser: string): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ active: true })
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();
    const findDocument = await this.functionObtainAndDerivedDocument(
      documents,
      idUser,
    );
    return findDocument;
  }

  async getAllDocumentSent(userId: string): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ userId: userId, stateDocumentUserSend: 'INICIADO' })
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();

    for (const document of documents) {
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${this.apiPersonalGet}/${document.userId}`)
            .toPromise();
          document.userInfo = {
            name: res.data.name,
            lastName: res.data.lastName,
            ci: res.data.ci,
            email: res.data.email,
            unity: res.data.unity,
          };
        } catch (error) {
          document.userId = 'no se encontraron datos del usuario';
        }
      }
    }

    return documents;
  }

  async getAllDocumentsCompleted(userId: string): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ userId: userId, stateDocumentUserSend: 'CONCLUIDO' })
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();

    for (const document of documents) {
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${this.apiPersonalGet}/${document.userId}`)
            .toPromise();
          document.userInfo = {
            name: res.data.name,
            lastName: res.data.lastName,
            ci: res.data.ci,
            email: res.data.email,
            unity: res.data.unity,
          };
        } catch (error) {
          document.userId = 'no se encontraron datos del usuario';
        }
      }
    }

    return documents;
  }

  async getDocumentsMarkComplete(userId: string) {
    const documents = await this.documentModel.find().exec();
    let showDocuments = [];
    for (const document of documents) {
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${this.apiPersonalGet}/${document.userId}`)
            .toPromise();
          document.userInfo = {
            name: res.data.name,
            lastName: res.data.lastName,
            ci: res.data.ci,
            email: res.data.email,
            unity: res.data.unity,
          };
        } catch (error) {
          document.userId = 'no se encontraron datos del usuario';
        }
      }
      const findMarkDocuments = document.userReceivedDocument.some((entry) => {
        return (
          entry.idOfUser === userId && entry.stateDocumentUser === 'CONCLUIDO'
        );
      });
      if (findMarkDocuments) {
        showDocuments.push(document);
      }
    }
    return showDocuments;
  }

  async getAllDocumentsSentWithoutWorkflow(
    userId: string,
  ): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({
        workflow: null,
        stateDocumentUserSend: 'ENVIADO DIRECTO',
        userId: userId,
        active: true,
      })
      .sort({ numberDocument: 1 })
      .setOptions({ sanitizeFilter: true })
      .exec();

    const filteredDocuments = [];

    for (const document of documents) {
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${this.apiPersonalGet}/${document.userId}`)
            .toPromise();
          document.userInfo = {
            name: res.data.name,
            lastName: res.data.lastName,
            ci: res.data.ci,
            email: res.data.email,
            unity: res.data.unity,
          };
        } catch (error) {
          document.userId = 'no se encontraron datos del usuario';
        }
      }
      filteredDocuments.push(document);
    }
    return filteredDocuments;
  }

  async getDocumentsOnHold(userId: string): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({
        active: true,
        bitacoraWorkflow: [],
        bitacoraWithoutWorkflow: [],
        stateDocumentUserSend: 'EN ESPERA',
        userId: userId,
      })
      .exec();
    for (const document of documents) {
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${this.apiPersonalGet}/${document.userId}`)
            .toPromise();
          document.userInfo = {
            name: res.data.name,
            lastName: res.data.lastName,
            ci: res.data.ci,
            email: res.data.email,
            unity: res.data.unity,
          };
        } catch (error) {
          document.userId = 'no se encontraron datos del usuario';
        }
      }
    }
    return documents;
  }

  async getDocumentsByUserIdAndObservation(
    userId: string,
  ): Promise<Documents[]> {
    const documents = await this.documentModel.find().exec();
    let showDocuments = [];
    for (const document of documents) {
      const findMarkDocuments = document.userReceivedDocument.some((entry) => {
        return (
          entry.idOfUser === userId && entry.stateDocumentUser === 'OBSERVADO'
        );
      });
      if (findMarkDocuments) {
        showDocuments.push(document);
      }
    }
    return showDocuments;
  }

  async getRecievedDocumentsMultiUnitys(userId: string) {
    try {
      // Busca el primer documento que contiene el usuario en la lista receivedUsers
      const document = await this.documentModel
        .findOne({
          'sendMultiUnitysWithoutWorkflow.send.receivedUsers.idOfUser': userId,
        })
        .exec();

      // Si se encontró un documento, lo devuelve; de lo contrario, devuelve null
      return document || null;
    } catch (error) {
      // Manejo de errores, por ejemplo, lanzar una excepción si hay un error
      throw new Error('Error al buscar el documento del usuario');
    }
  }

  private async functionObtainAndDerivedDocument(
    documents: Documents[],
    userId: string,
  ) {
    let showDocuments = [];
    for (const document of documents) {
      if (document.userId) {
        try {
          const res = await this.httpService
            .get(`${this.apiPersonalGet}/${document.userId}`)
            .toPromise();
          document.userInfo = {
            name: res.data.name,
            lastName: res.data.lastName,
            ci: res.data.ci,
            email: res.data.email,
            unity: res.data.unity,
          };
        } catch (error) {
          document.userId = 'no se encontraron datos del usuario';
        }
      }
      const filteredDocumentsUserSome = document.userReceivedDocument.some(
        (entry) => {
          return entry.idOfUser === userId;
        },
      );
      if (filteredDocumentsUserSome) {
        document.stateDocumetUser = 'RECIBIDO';
        showDocuments.push(document);
      }
    }
    showDocuments.sort((a, b) => {
      const dateA = new Date(a.userReceivedDocument[0]?.dateRecived).getTime();
      const dateB = new Date(b.userReceivedDocument[0]?.dateRecived).getTime();
      return dateB - dateA;
    });
    return showDocuments;
  }
}
