import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentDocument, Documents } from './schema/documents.schema';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration';
import { PaginationDto } from 'src/common/pagination.dto';
import { DocumentsFilter } from './dto/documents-filter.dto';

@Injectable()
export class GetDocumentsService {
  private readonly apiPersonalGet = getConfig().api_personal_get;
  private defaultLimit: number;
  constructor(
    @InjectModel(Documents.name)
    private readonly documentModel: Model<DocumentDocument>,
    private httpService: HttpService,
  ) {}

  //---------------------------------------------------------
  async getDocuments(
    userId: string,
    view: string,
    withWorkflow: string,
    paginationDto: PaginationDto,
    filter: DocumentsFilter,
  ) {
    const { limit = this.defaultLimit, page = 1 } = paginationDto;
    const offset = (page - 1) * limit;
    let showDocument = [];
    const documents = await this.documentModel.find().exec();
    if (view === undefined) {
      let query = this.documentModel.find({ userId: userId });

      if (filter.numberDocument) {
        query = query.where(
          'numberDocument',
          new RegExp(filter.numberDocument, 'i'),
        );
      }

      if (filter.userId) {
        query = query.where('userId', new RegExp(filter.userId, 'i'));
      }
      if (filter.title) {
        query = query.where('title', new RegExp(filter.title, 'i'));
      }
      if (filter.typeName) {
        query['documentationType'] = {
          $elemMatch: { documentationType: filter.typeName },
        };
      }
      if (filter.stateDocumentUserSend) {
        query['stateDocumentUserSend'] = filter.stateDocumentUserSend;
      }
      if (filter.nombre) {
        query['workflow'] = {
          $elemMatch: { nombre: filter.nombre },
        };
      }
      if (filter.descriptionWorkflow) {
        query['workflow'] = {
          $elemMatch: { descriptionWorkflow: filter.descriptionWorkflow },
        };
      }
      if (filter.oficinaActual) {
        query['workflow'] = {
          $elemMatch: { oficinaActual: filter.oficinaActual },
        };
      }
      if (filter.description) {
        query = query.where('userId', new RegExp(filter.description, 'i'));
      }
      if (filter.active) {
        // query['active'] = filter.active;
        query = query.where('active', filter.active);
      }

      if (filter.userDigitalSignature) {
        query['digitalSignatureDocument'] = {
          $elemMatch: { userDigitalSignature: filter.userDigitalSignature },
        };
      }

      if (filter.userDigitalSignature) {
        query = query.where(
          'digitalSignatureDocument.userDigitalSignature',
          new RegExp(filter.userDigitalSignature, 'i'),
        );
      }

      const filteredDocuments = await this.documentModel
        .find(query)
        .limit(limit)
        .skip(offset);

      filteredDocuments.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      const total = await this.documentModel.countDocuments(query).exec();
      return {
        data: filteredDocuments,
        total: total,
        totalPages: Math.ceil(total / limit),
      };
    } else if (view === 'RECIBIDOS') {
      if (withWorkflow === undefined) {
        let query = this.documentModel.find({
          'userReceivedDocument.idOfUser': userId,
          'userReceivedDocument.observado': false,
          // workflow: { $ne: null },
        });

        if (filter.numberDocument) {
          query = query.where(
            'numberDocument',
            new RegExp(filter.numberDocument, 'i'),
          );
        }
        if (filter.userId) {
          query = query.where('userId', new RegExp(filter.userId, 'i'));
        }
        if (filter.title) {
          query = query.where('title', new RegExp(filter.title, 'i'));
        }
        if (filter.typeName) {
          query['documentationType'] = {
            $elemMatch: { documentationType: filter.typeName },
          };
        }
        if (filter.stateDocumentUserSend) {
          query['stateDocumentUserSend'] = filter.stateDocumentUserSend;
        }
        if (filter.nombre) {
          query['workflow'] = {
            $elemMatch: { nombre: filter.nombre },
          };
        }
        if (filter.descriptionWorkflow) {
          query['workflow'] = {
            $elemMatch: { descriptionWorkflow: filter.descriptionWorkflow },
          };
        }
        if (filter.oficinaActual) {
          query['workflow'] = {
            $elemMatch: { oficinaActual: filter.oficinaActual },
          };
        }
        if (filter.description) {
          query = query.where('userId', new RegExp(filter.description, 'i'));
        }
        if (filter.active) {
          // query['active'] = filter.active;
          query = query.where('active', filter.active);
        }

        const filteredDocuments = await this.documentModel
          .find(query)
          .limit(limit)
          .skip(offset);

        filteredDocuments.sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        const total = await this.documentModel.countDocuments(query).exec();

        return {
          data: filteredDocuments,
          total: total,
          totalPages: Math.ceil(total / limit),
        };
      }
      if (withWorkflow === 'true') {
        // const results = await Promise.all([
        //   this.getRecievedDocumentsWithWorkflow(userId),
        // ]);
        // const validResults = results.filter((result) => result.length > 0);
        // showDocument = [].concat(...validResults);
        let query = this.documentModel.find({
          'userReceivedDocument.idOfUser': userId,
          workflow: { $ne: null },
        });
        if (filter.numberDocument) {
          query = query.where(
            'numberDocument',
            new RegExp(filter.numberDocument, 'i'),
          );
        }
        if (filter.userId) {
          query = query.where('userId', new RegExp(filter.userId, 'i'));
        }
        if (filter.title) {
          query = query.where('title', new RegExp(filter.title, 'i'));
        }
        if (filter.typeName) {
          query['documentationType'] = {
            $elemMatch: { documentationType: filter.typeName },
          };
        }
        if (filter.stateDocumentUserSend) {
          query['stateDocumentUserSend'] = filter.stateDocumentUserSend;
        }
        if (filter.nombre) {
          query['workflow'] = {
            $elemMatch: { nombre: filter.nombre },
          };
        }
        if (filter.descriptionWorkflow) {
          query['workflow'] = {
            $elemMatch: { descriptionWorkflow: filter.descriptionWorkflow },
          };
        }
        if (filter.oficinaActual) {
          query['workflow'] = {
            $elemMatch: { oficinaActual: filter.oficinaActual },
          };
        }
        if (filter.description) {
          query = query.where('userId', new RegExp(filter.description, 'i'));
        }
        if (filter.active) {
          // query['active'] = filter.active;
          query = query.where('active', filter.active);
        }
        if (filter.userDigitalSignature) {
          query['digitalSignatureDocument.userDigitalSignature'] =
            filter.userDigitalSignature;
        }

        const filteredDocuments = await this.documentModel
          .find(query)
          .limit(limit)
          .skip(offset);

        filteredDocuments.sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        const total = await this.documentModel.countDocuments(query).exec();

        return {
          data: filteredDocuments,
          total: total,
          totalPages: Math.ceil(total / limit),
        };
      }
      if (withWorkflow === 'false') {
        // const results = await Promise.all([
        //   this.getRecievedDocumentsMultiUnitys(userId),
        // ]);
        // const validResults = results.filter((result) => result.length > 0);
        // showDocument = [].concat(...validResults);
        let query = this.documentModel.find({
          'userReceivedDocument.idOfUser': userId,
          workflow: null,
        });
        if (filter.numberDocument) {
          query = query.where(
            'numberDocument',
            new RegExp(filter.numberDocument, 'i'),
          );
        }
        if (filter.userId) {
          query = query.where('userId', new RegExp(filter.userId, 'i'));
        }
        if (filter.title) {
          query = query.where('title', new RegExp(filter.title, 'i'));
        }
        if (filter.typeName) {
          query['documentationType'] = {
            $elemMatch: { documentationType: filter.typeName },
          };
        }
        if (filter.stateDocumentUserSend) {
          query['stateDocumentUserSend'] = filter.stateDocumentUserSend;
        }
        if (filter.nombre) {
          query['workflow'] = {
            $elemMatch: { nombre: filter.nombre },
          };
        }
        if (filter.descriptionWorkflow) {
          query['workflow'] = {
            $elemMatch: { descriptionWorkflow: filter.descriptionWorkflow },
          };
        }
        if (filter.oficinaActual) {
          query['workflow'] = {
            $elemMatch: { oficinaActual: filter.oficinaActual },
          };
        }
        if (filter.description) {
          query = query.where('userId', new RegExp(filter.description, 'i'));
        }
        if (filter.active) {
          // query['active'] = filter.active;
          query = query.where('active', filter.active);
        }

        const filteredDocuments = await this.documentModel
          .find(query)
          .limit(limit)
          .skip(offset);

        filteredDocuments.sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        const total = await this.documentModel.countDocuments(query).exec();

        return {
          data: filteredDocuments,
          total: total,
          totalPages: Math.ceil(total / limit),
        };
      }
      // const results = await Promise.all([
      //   this.getRecievedDocumentsWithWorkflow(userId),
      //   this.getRecievedDocumentsMultiUnitys(userId),
      // ]);
      // const validResults = results.filter((result) => result.length > 0);
      // showDocument = [].concat(...validResults);
    } else if (view === 'REVISADOS') {
      let query = this.documentModel.find({
        'userReceivedDocument.stateDocumentUser': 'REVISADO',
        userId: userId,
      });
      if (filter.numberDocument) {
        query = query.where(
          'numberDocument',
          new RegExp(filter.numberDocument, 'i'),
        );
      }
      if (filter.userId) {
        query = query.where('userId', new RegExp(filter.userId, 'i'));
      }
      if (filter.title) {
        query = query.where('title', new RegExp(filter.title, 'i'));
      }
      if (filter.typeName) {
        query['documentationType'] = {
          $elemMatch: { documentationType: filter.typeName },
        };
      }
      if (filter.stateDocumentUserSend) {
        query['stateDocumentUserSend'] = filter.stateDocumentUserSend;
      }
      if (filter.nombre) {
        query['workflow'] = {
          $elemMatch: { nombre: filter.nombre },
        };
      }
      if (filter.descriptionWorkflow) {
        query['workflow'] = {
          $elemMatch: { descriptionWorkflow: filter.descriptionWorkflow },
        };
      }
      if (filter.oficinaActual) {
        query['workflow'] = {
          $elemMatch: { oficinaActual: filter.oficinaActual },
        };
      }
      if (filter.description) {
        query = query.where('userId', new RegExp(filter.description, 'i'));
      }
      if (filter.active) {
        // query['active'] = filter.active;
        query = query.where('active', filter.active);
      }

      const filteredDocuments = await this.documentModel
        .find(query)
        .limit(limit)
        .skip(offset);

      filteredDocuments.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      const total = await this.documentModel.countDocuments(query).exec();

      return {
        data: filteredDocuments,
        total: total,
        totalPages: Math.ceil(total / limit),
      };

      // const results = await Promise.all([this.getDocumentReviewed(userId)]);
      // const validResults = results.filter((result) => result.length > 0);
      // showDocument = [].concat(...validResults);
    } else if (view === 'ENVIADOS') {
      if (withWorkflow === undefined) {
        //enviado sin workflow
        // let query = this.documentModel.find({
        //   userId: userId,
        //   stateDocumentUserSend: 'ENVIADO DIRECTO',
        //   stateDocumentUsreSend: 'INICIADO',
        // });

        let query = this.documentModel.find({
          userId: userId,
          $or: [
            {
              stateDocumentUserSend: 'INICIADO',
              workflow: { $ne: null },
            },
            {
              stateDocumentUserSend: 'ENVIADO DIRECTO',
              workflow: null,
            },
          ],
        });

        if (filter.numberDocument) {
          query = query.where(
            'numberDocument',
            new RegExp(filter.numberDocument, 'i'),
          );
        }
        if (filter.userId) {
          query = query.where('userId', new RegExp(filter.userId, 'i'));
        }
        if (filter.title) {
          query = query.where('title', new RegExp(filter.title, 'i'));
        }
        if (filter.typeName) {
          query['documentationType'] = {
            $elemMatch: { documentationType: filter.typeName },
          };
        }
        if (filter.stateDocumentUserSend) {
          query['stateDocumentUserSend'] = filter.stateDocumentUserSend;
        }
        if (filter.nombre) {
          query['workflow'] = {
            $elemMatch: { nombre: filter.nombre },
          };
        }
        if (filter.descriptionWorkflow) {
          query['workflow'] = {
            $elemMatch: { descriptionWorkflow: filter.descriptionWorkflow },
          };
        }
        if (filter.oficinaActual) {
          query['workflow'] = {
            $elemMatch: { oficinaActual: filter.oficinaActual },
          };
        }
        if (filter.description) {
          query = query.where('userId', new RegExp(filter.description, 'i'));
        }
        if (filter.active) {
          // query['active'] = filter.active;
          query = query.where('active', filter.active);
        }

        const filteredDocuments = await this.documentModel
          .find(query)
          .limit(limit)
          .skip(offset);

        filteredDocuments.sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        const total = await this.documentModel.countDocuments(query).exec();

        return {
          data: filteredDocuments,
          total: total,
          totalPages: Math.ceil(total / limit),
        };

        // const results = await Promise.all([
        //   this.getAllDocumentsSentWithoutWorkflow(userId),
        //   this.getAllDocumentSent(userId),
        // ]);
        // const validResults = results.filter((result) => result.length > 0);
        // showDocument = [].concat(...validResults);
      }
      if (withWorkflow && withWorkflow === 'true') {
        // const results = await Promise.all([this.getAllDocumentSent(userId)]);
        // const validResults = results.filter((result) => result.length > 0);
        // showDocument = [].concat(...validResults);
        let query = this.documentModel.find({
          userId: userId,
          stateDocumentUserSend: 'INICIADO',
        });
        if (filter.numberDocument) {
          query = query.where(
            'numberDocument',
            new RegExp(filter.numberDocument, 'i'),
          );
        }
        if (filter.userId) {
          query = query.where('userId', new RegExp(filter.userId, 'i'));
        }
        if (filter.title) {
          query = query.where('title', new RegExp(filter.title, 'i'));
        }
        if (filter.typeName) {
          query['documentationType'] = {
            $elemMatch: { documentationType: filter.typeName },
          };
        }
        if (filter.stateDocumentUserSend) {
          query['stateDocumentUserSend'] = filter.stateDocumentUserSend;
        }
        if (filter.nombre) {
          query['workflow'] = {
            $elemMatch: { nombre: filter.nombre },
          };
        }
        if (filter.descriptionWorkflow) {
          query['workflow'] = {
            $elemMatch: { descriptionWorkflow: filter.descriptionWorkflow },
          };
        }
        if (filter.oficinaActual) {
          query['workflow'] = {
            $elemMatch: { oficinaActual: filter.oficinaActual },
          };
        }
        if (filter.description) {
          query = query.where('userId', new RegExp(filter.description, 'i'));
        }
        if (filter.active) {
          // query['active'] = filter.active;
          query = query.where('active', filter.active);
        }

        const filteredDocuments = await this.documentModel
          .find(query)
          .limit(limit)
          .skip(offset);

        filteredDocuments.sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        const total = await this.documentModel.countDocuments(query).exec();

        return {
          data: filteredDocuments,
          total: total,
          totalPages: Math.ceil(total / limit),
        };
      }
      if (withWorkflow && withWorkflow === 'false') {
        // const results = await Promise.all([
        //   this.getAllDocumentsSentWithoutWorkflow(userId),
        // ]);
        // const validResults = results.filter((result) => result.length > 0);
        // showDocument = [].concat(...validResults);
        let query = this.documentModel.find({
          userId: userId,
          stateDocumentUserSend: 'ENVIADO DIRECTO',
        });
        if (filter.numberDocument) {
          query = query.where(
            'numberDocument',
            new RegExp(filter.numberDocument, 'i'),
          );
        }
        if (filter.userId) {
          query = query.where('userId', new RegExp(filter.userId, 'i'));
        }
        if (filter.title) {
          query = query.where('title', new RegExp(filter.title, 'i'));
        }
        if (filter.typeName) {
          query['documentationType'] = {
            $elemMatch: { documentationType: filter.typeName },
          };
        }
        if (filter.stateDocumentUserSend) {
          query['stateDocumentUserSend'] = filter.stateDocumentUserSend;
        }
        if (filter.nombre) {
          query['workflow'] = {
            $elemMatch: { nombre: filter.nombre },
          };
        }
        if (filter.descriptionWorkflow) {
          query['workflow'] = {
            $elemMatch: { descriptionWorkflow: filter.descriptionWorkflow },
          };
        }
        if (filter.oficinaActual) {
          query['workflow'] = {
            $elemMatch: { oficinaActual: filter.oficinaActual },
          };
        }
        if (filter.description) {
          query = query.where('userId', new RegExp(filter.description, 'i'));
        }
        if (filter.active) {
          // query['active'] = filter.active;
          query = query.where('active', filter.active);
        }

        const filteredDocuments = await this.documentModel
          .find(query)
          .limit(limit)
          .skip(offset);

        filteredDocuments.sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        const total = await this.documentModel.countDocuments(query).exec();

        return {
          data: filteredDocuments,
          total: total,
          totalPages: Math.ceil(total / limit),
        };
      }
    } else if (view === 'COMPLETADO') {
      let query = this.documentModel.find({
        'userReceivedDocument.stateDocumentUser': 'CONCLUIDO',
      });
      if (filter.numberDocument) {
        query = query.where(
          'numberDocument',
          new RegExp(filter.numberDocument, 'i'),
        );
      }
      if (filter.userId) {
        query = query.where('userId', new RegExp(filter.userId, 'i'));
      }
      if (filter.title) {
        query = query.where('title', new RegExp(filter.title, 'i'));
      }
      if (filter.typeName) {
        query['documentationType'] = {
          $elemMatch: { documentationType: filter.typeName },
        };
      }
      if (filter.stateDocumentUserSend) {
        query['stateDocumentUserSend'] = filter.stateDocumentUserSend;
      }
      if (filter.nombre) {
        query['workflow'] = {
          $elemMatch: { nombre: filter.nombre },
        };
      }
      if (filter.descriptionWorkflow) {
        query['workflow'] = {
          $elemMatch: { descriptionWorkflow: filter.descriptionWorkflow },
        };
      }
      if (filter.oficinaActual) {
        query['workflow'] = {
          $elemMatch: { oficinaActual: filter.oficinaActual },
        };
      }
      if (filter.description) {
        query = query.where('userId', new RegExp(filter.description, 'i'));
      }
      if (filter.active) {
        // query['active'] = filter.active;
        query = query.where('active', filter.active);
      }

      const filteredDocuments = await this.documentModel
        .find(query)
        .limit(limit)
        .skip(offset);

      filteredDocuments.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      const total = await this.documentModel.countDocuments(query).exec();

      return {
        data: filteredDocuments,
        total: total,
        totalPages: Math.ceil(total / limit),
      };

      // const results = await Promise.all([
      //   this.getAllDocumentsCompleted(userId),
      //   this.getDocumentsMarkComplete(userId),
      // ]);
      // const validResults = results.filter((result) => result.length > 0);
      // showDocument = [].concat(...validResults);
    } else if (view === 'OBSERVADO') {
      let query = this.documentModel.find({
        'userReceivedDocument.stateDocumentUser': 'OBSERVADO',
      });
      if (filter.numberDocument) {
        query = query.where(
          'numberDocument',
          new RegExp(filter.numberDocument, 'i'),
        );
      }
      if (filter.userId) {
        query = query.where('userId', new RegExp(filter.userId, 'i'));
      }
      if (filter.title) {
        query = query.where('title', new RegExp(filter.title, 'i'));
      }
      if (filter.typeName) {
        query['documentationType'] = {
          $elemMatch: { documentationType: filter.typeName },
        };
      }
      if (filter.stateDocumentUserSend) {
        query['stateDocumentUserSend'] = filter.stateDocumentUserSend;
      }
      if (filter.nombre) {
        query['workflow'] = {
          $elemMatch: { nombre: filter.nombre },
        };
      }
      if (filter.descriptionWorkflow) {
        query['workflow'] = {
          $elemMatch: { descriptionWorkflow: filter.descriptionWorkflow },
        };
      }
      if (filter.oficinaActual) {
        query['workflow'] = {
          $elemMatch: { oficinaActual: filter.oficinaActual },
        };
      }
      if (filter.description) {
        query = query.where('userId', new RegExp(filter.description, 'i'));
      }
      if (filter.active) {
        // query['active'] = filter.active;
        query = query.where('active', filter.active);
      }

      const filteredDocuments = await this.documentModel
        .find(query)
        .limit(limit)
        .skip(offset);

      filteredDocuments.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      const total = await this.documentModel.countDocuments(query).exec();

      return {
        data: filteredDocuments,
        total: total,
        totalPages: Math.ceil(total / limit),
      };

      // const results = await Promise.all([
      //   this.getDocumentsByUserIdAndObservation(userId),
      // ]);
      // const validResults = results.filter((result) => result.length > 0);
      // showDocument = [].concat(...validResults);
    } else if (view === 'EN ESPERA') {
      // const results = await Promise.all([
      //   await this.getDocumentsOnHold(userId),
      // ]);
      // const validResults = results.filter((result) => result.length > 0);
      // showDocument = [].concat(...validResults);
      let query = this.documentModel.find({
        userId: userId,
        stateDocumentUserSend: 'EN ESPERA',
      });
      if (filter.numberDocument) {
        query = query.where(
          'numberDocument',
          new RegExp(filter.numberDocument, 'i'),
        );
      }
      if (filter.userId) {
        query = query.where('userId', new RegExp(filter.userId, 'i'));
      }
      if (filter.title) {
        query = query.where('title', new RegExp(filter.title, 'i'));
      }
      if (filter.typeName) {
        query['documentationType'] = {
          $elemMatch: { documentationType: filter.typeName },
        };
      }
      if (filter.stateDocumentUserSend) {
        query['stateDocumentUserSend'] = filter.stateDocumentUserSend;
      }
      if (filter.nombre) {
        query['workflow'] = {
          $elemMatch: { nombre: filter.nombre },
        };
      }
      if (filter.descriptionWorkflow) {
        query['workflow'] = {
          $elemMatch: { descriptionWorkflow: filter.descriptionWorkflow },
        };
      }
      if (filter.oficinaActual) {
        query['workflow'] = {
          $elemMatch: { oficinaActual: filter.oficinaActual },
        };
      }
      if (filter.description) {
        query = query.where('userId', new RegExp(filter.description, 'i'));
      }
      if (filter.active) {
        // query['active'] = filter.active;
        query = query.where('active', filter.active);
      }

      const filteredDocuments = await this.documentModel
        .find(query)
        .limit(limit)
        .skip(offset);

      filteredDocuments.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      const total = await this.documentModel.countDocuments(query).exec();

      return {
        data: filteredDocuments,
        total: total,
        totalPages: Math.ceil(total / limit),
      };
    } else if (view === 'ARCHIVADOS') {
      // const results = await Promise.all([
      //   await this.findDocumentsArchivedUser(userId),
      // ]);
      // const validResults = results.filter((result) => result.length > 0);
      // showDocument = [].concat(...validResults);
      let query = this.documentModel.find({
        userId: userId,
        stateDocumentUserSend: 'ARCHIVADO',
      });
      if (filter.numberDocument) {
        query = query.where(
          'numberDocument',
          new RegExp(filter.numberDocument, 'i'),
        );
      }
      if (filter.userId) {
        query = query.where('userId', new RegExp(filter.userId, 'i'));
      }
      if (filter.title) {
        query = query.where('title', new RegExp(filter.title, 'i'));
      }
      if (filter.typeName) {
        query['documentationType'] = {
          $elemMatch: { documentationType: filter.typeName },
        };
      }
      if (filter.stateDocumentUserSend) {
        query['stateDocumentUserSend'] = filter.stateDocumentUserSend;
      }
      if (filter.nombre) {
        query['workflow'] = {
          $elemMatch: { nombre: filter.nombre },
        };
      }
      if (filter.descriptionWorkflow) {
        query['workflow'] = {
          $elemMatch: { descriptionWorkflow: filter.descriptionWorkflow },
        };
      }
      if (filter.oficinaActual) {
        query['workflow'] = {
          $elemMatch: { oficinaActual: filter.oficinaActual },
        };
      }
      if (filter.description) {
        query = query.where('userId', new RegExp(filter.description, 'i'));
      }
      if (filter.active) {
        // query['active'] = filter.active;
        query = query.where('active', filter.active);
      }

      const filteredDocuments = await this.documentModel
        .find(query)
        .limit(limit)
        .skip(offset);

      filteredDocuments.sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      const total = await this.documentModel.countDocuments(query).exec();

      return {
        data: filteredDocuments,
        total: total,
        totalPages: Math.ceil(total / limit),
      };
    }

    // const filteredDocuments = await this.filterResults(showDocument, filter);

    // let filteredDocuments = showDocument;
    /*


    //filtrar los documentos
    if (filter.numberDocument) {
      filteredDocuments = filteredDocuments.filter((document) => {
        return document.numberDocument === filter.numberDocument;
      });
    }

    if (filter.userId) {
      filteredDocuments = filteredDocuments.filter((document) => {
        return document.userId === filter.userId;
      });
    }

    if (filter.title) {
      const titleSearchRegex = new RegExp(filter.title, 'i');
      filteredDocuments = filteredDocuments.filter((document) => {
        return titleSearchRegex.test(document.title);
      });
    }

    if (filter.typeName) {
      const typeNameSearchRegex = new RegExp(filter.typeName, 'i');
      filteredDocuments = filteredDocuments.filter((document) => {
        if (document.documentationType) {
          return typeNameSearchRegex.test(document.documentationType.typeName);
        }
      });
    }

    if (filter.description) {
      const descriptionSearchRegex = new RegExp(filter.title, 'i');
      filteredDocuments = filteredDocuments.filter((document) => {
        if (document.description) {
          return descriptionSearchRegex.test(document.description);
        }
      });
    }

    if (filter.stateDocumentUserSend) {
      const stateDocumentUserSendSearchRegex = new RegExp(filter.typeName, 'i');
      filteredDocuments = filteredDocuments.filter((document) => {
        if (document.stateDocumentUserSend) {
          return stateDocumentUserSendSearchRegex.test(
            document.stateDocumentUserSend,
          );
        }
      });
    }

    if (filter.nombre) {
      const nombreSearchRegex = new RegExp(filter.nombre, 'i');
      filteredDocuments = filteredDocuments.filter((document) => {
        if (document.workflow && document.workflow.nombre) {
          return nombreSearchRegex.test(document.workflow.nombre);
        }
        // return false;
      });
    }

    if (filter.descriptionWorkflow) {
      const descriptionWorkflowSearchRegex = new RegExp(
        filter.descriptionWorkflow,
        'i',
      );
      filteredDocuments = filteredDocuments.filter((document) => {
        if (document.workflow) {
          return descriptionWorkflowSearchRegex.test(
            document.workflow.descriptionWorkflow,
          );
        }
      });
    }

    if (filter.oficinaActual) {
      const oficinaActualSearchRegex = new RegExp(filter.oficinaActual, 'i');
      filteredDocuments = filteredDocuments.filter((document) => {
        if (document.oficinaActual) {
          return oficinaActualSearchRegex.test(document.oficinaActual);
        }
      });
    }

    */

    // await filteredDocuments.sort((a, b) => {
    //   return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    // });

    //---------------------------------------------

    // const total = showDocument.length;
    // const paginateDocuments = showDocument.slice(offset, offset + limit);
    // const totalpages = Math.ceil(total / limit);
    // return {
    //   documents: paginateDocuments,
    //   total,
    //   totalpages,
    // };
  }

  filterResults(results, filter) {
    return results.filter((document) => {
      let matchesFilter = true;
      if (
        filter.numberDocument &&
        document.numberDocument !== filter.numberDocument
      ) {
        matchesFilter = false;
      }

      if (filter.userId && document.userId !== filter.userId) {
        matchesFilter = false;
      }

      if (filter.title && !new RegExp(filter.title, 'i').test(document.title)) {
        matchesFilter = false;
      }

      if (filter.typeName) {
        if (
          !document.documentationType ||
          !new RegExp(filter.typeName, 'i').test(
            document.documentationType.typeName,
          )
        ) {
          matchesFilter = false;
        }
      }

      if (
        filter.description &&
        (!document.description ||
          !new RegExp(filter.description, 'i').test(document.description))
      ) {
        matchesFilter = false;
      }

      if (
        filter.stateDocumentUserSend &&
        (!document.stateDocumentUserSend ||
          !new RegExp(filter.stateDocumentUserSend, 'i').test(
            document.stateDocumentUserSend,
          ))
      ) {
        matchesFilter = false;
      }

      if (
        filter.nombre &&
        (!document.workflow ||
          !new RegExp(filter.nombre, 'i').test(document.workflow.nombre))
      ) {
        matchesFilter = false;
      }

      if (
        filter.descriptionWorkflow &&
        (!document.workflow ||
          !new RegExp(filter.descriptionWorkflow, 'i').test(
            document.workflow.descriptionWorkflow,
          ))
      ) {
        matchesFilter = false;
      }

      if (
        filter.oficinaActual &&
        (!document.oficinaActual ||
          !new RegExp(filter.oficinaActual, 'i').test(document.oficinaActual))
      ) {
        matchesFilter = false;
      }

      return matchesFilter;
    });
  }

  //-----------------------------------------------------------------

  //-utilizado // revisado para uso // uso correcto
  // ver documentos que fueron revisados
  async getDocumentReviewed(userId: string) {
    const documents = await this.documentModel.find({ active: true }).exec();

    let showDocument = [];
    for (const document of documents) {
      // if (document.userId) {
      //   try {
      //     const res = await this.httpService
      //       .get(`${this.apiPersonalGet}/${document.userId}`)
      //       .toPromise();
      //     document.userInfo = {
      //       name: res.data.name,
      //       lastName: res.data.lastName,
      //       ci: res.data.ci,
      //       email: res.data.email,
      //       unity: res.data.unity,
      //     };
      //   } catch (error) {
      //     document.userId = 'no se encontraron datos del usuario';
      //   }
      // }

      if (
        document.userReceivedDocument.find((entry) => {
          return (
            entry.idOfUser === userId && entry.stateDocumentUser === 'REVISADO'
          );
        })
      ) {
        showDocument.push(document);
      }
    }
    return showDocument;
  }

  // utilizado // revisado para su uso //uso normal
  async getRecievedDocumentsWithWorkflow(userId: string): Promise<Documents[]> {
    const documents = await this.documentModel.find({ active: true }).exec();
    let showDocuments = [];
    for (const document of documents) {
      // if (document.userId) {
      // try {
      //   const res = await this.httpService
      //     .get(`${this.apiPersonalGet}/${document.userId}`)
      //     .toPromise();
      //   document.userInfo = {
      //     name: res.data.name,
      //     lastName: res.data.lastName,
      //     ci: res.data.ci,
      //     email: res.data.email,
      //     unity: res.data.unity,
      //   };
      // } catch (error) {
      //   document.userId = 'no se encontraron datos del usuario';
      // }
      // }
      const filteredDocumentsUserSome = document.userReceivedDocument.some(
        (entry) => {
          return (
            entry.idOfUser === userId && entry.stateDocumentUser === 'RECIBIDO'
          );
        },
      );
      if (filteredDocumentsUserSome) {
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

  // no usar
  async getRecievedDocument(
    idUser: string,
    paginationDto: PaginationDto,
  ): Promise<{
    documents: Documents[];
    totalDocuments: number;
    totalPages: number;
  }> {
    const { limit = this.defaultLimit, page = 1 } = paginationDto;
    const offset = (page - 1) * limit;

    const totalDocuments = await this.documentModel.countDocuments().exec();

    const documents = await this.documentModel
      .find({ active: true })
      .skip(offset)
      .limit(limit);
    const findDocument = await this.functionObtainAndDerivedDocument(
      documents,
      idUser,
    );

    const totalPages = Math.ceil(totalDocuments / limit);
    return {
      documents: findDocument,
      totalDocuments,
      totalPages,
    };
    // findDocument;
  }

  //utilizado
  //ver todos los documentos enviados con workflow
  //para realizar su SEGUIMIENTO, no usar para ver
  //documentos enviados de todos los usuarios
  async getAllDocumentSent(userId: string): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ userId: userId, stateDocumentUserSend: 'INICIADO' })
      // .sort({ numberDocument: 1 })
      // .setOptions({ sanitizeFilter: true })
      .exec();

    for (const document of documents) {
      // if (document.userId) {
      //   try {
      //     const res = await this.httpService
      //       .get(`${this.apiPersonalGet}/${document.userId}`)
      //       .toPromise();
      //     document.userInfo = {
      //       name: res.data.name,
      //       lastName: res.data.lastName,
      //       ci: res.data.ci,
      //       email: res.data.email,
      //       unity: res.data.unity,
      //     };
      //   } catch (error) {
      //     document.userId = 'no se encontraron datos del usuario';
      //   }
      // }
    }
    documents.sort((a, b) => {
      const dateA = new Date(a.userReceivedDocument[0]?.dateRecived).getTime();
      const dateB = new Date(b.userReceivedDocument[0]?.dateRecived).getTime();
      return dateB - dateA;
    });
    return documents;
  }

  //--utilizado //revisado
  async getAllDocumentsCompleted(userId: string): Promise<Documents[]> {
    const documents = await this.documentModel
      .find({ userId: userId, stateDocumentUserSend: 'CONCLUIDO' })
      // .sort({ numberDocument: 1 })
      // .setOptions({ sanitizeFilter: true })
      .exec();

    for (const document of documents) {
      // if (document.userId) {
      //   try {
      //     const res = await this.httpService
      //       .get(`${this.apiPersonalGet}/${document.userId}`)
      //       .toPromise();
      //     document.userInfo = {
      //       name: res.data.name,
      //       lastName: res.data.lastName,
      //       ci: res.data.ci,
      //       email: res.data.email,
      //       unity: res.data.unity,
      //     };
      //   } catch (error) {
      //     document.userId = 'no se encontraron datos del usuario';
      //   }
      // }
    }
    documents.sort((a, b) => {
      const dateA = new Date(a.userReceivedDocument[0]?.dateRecived).getTime();
      const dateB = new Date(b.userReceivedDocument[0]?.dateRecived).getTime();
      return dateB - dateA;
    });
    return documents;
  }

  //--utilizado //revisado
  async getDocumentsMarkComplete(userId: string) {
    const documents = await this.documentModel.find().exec();
    let showDocuments = [];
    for (const document of documents) {
      // if (document.userId) {
      //   try {
      //     const res = await this.httpService
      //       .get(`${this.apiPersonalGet}/${document.userId}`)
      //       .toPromise();
      //     document.userInfo = {
      //       name: res.data.name,
      //       lastName: res.data.lastName,
      //       ci: res.data.ci,
      //       email: res.data.email,
      //       unity: res.data.unity,
      //     };
      //   } catch (error) {
      //     document.userId = 'no se encontraron datos del usuario';
      //   }
      // }
      const findMarkDocuments = document.userReceivedDocument.some((entry) => {
        return (
          entry.idOfUser === userId && entry.stateDocumentUser === 'CONCLUIDO'
        );
      });
      if (findMarkDocuments) {
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

  //--utilizado //revisado
  async getAllDocumentsSentWithoutWorkflow(userId: string) {
    const documents = await this.documentModel
      .find({
        workflow: null,
        active: true,
      })
      // .setOptions({ sanitizeFilter: true })
      .exec();

    const filteredDocuments = [];
    for (const document of documents) {
      // if (document.userId) {
      //   try {
      //     const res = await this.httpService
      //       .get(`${this.apiPersonalGet}/${document.userId}`)
      //       .toPromise();
      //     document.userInfo = {
      //       name: res.data.name,
      //       lastName: res.data.lastName,
      //       ci: res.data.ci,
      //       email: res.data.email,
      //       unity: res.data.unity,
      //     };
      //   } catch (error) {
      //     document.userId = 'no se encontraron datos del usuario';
      //   }
      // }
      if (document.stateDocumentUserSend === 'ENVIADO DIRECTO') {
        filteredDocuments.push(document);
      }
      if (
        document.bitacoraWithoutWorkflow.some((entry) => {
          entry.recievedUsers.some((entry) => {
            entry.idOfUser === userId;
          });
        })
      ) {
        filteredDocuments.push(document);
      } else null;
    }
    filteredDocuments.sort((a, b) => {
      const dateA = new Date(a.updateAt[0]?.dateRecived).getTime();
      const dateB = new Date(b.updateAt[0]?.dateRecived).getTime();
      return dateB - dateA;
    });

    return filteredDocuments;
  }

  //--------- USADO ---------------
  async getDocumentsOnHold(userId: string) {
    const documents = await this.documentModel
      .find({
        active: true,
        // bitacoraWorkflow: [],
        // bitacoraWithoutWorkflow: [],
        stateDocumentUserSend: 'EN ESPERA',
        userId: userId,
      })
      .exec();
    for (const document of documents) {
      // if (document.userId) {
      //   try {
      //     const res = await this.httpService
      //       .get(`${this.apiPersonalGet}/${document.userId}`)
      //       .toPromise();
      //     document.userInfo = {
      //       name: res.data.name,
      //       lastName: res.data.lastName,
      //       ci: res.data.ci,
      //       email: res.data.email,
      //       unity: res.data.unity,
      //     };
      //   } catch (error) {
      //     document.userId = 'no se encontraron datos del usuario';
      //   }
      // }
    }
    documents.sort((a, b) => {
      const dateA = new Date(a.updateAt[0]?.dateRecived).getTime();
      const dateB = new Date(b.updateAt[0]?.dateRecived).getTime();
      return dateB - dateA;
    });
    return documents;
  }

  //--uitlizado //revisado
  //ver documentos observados
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
    showDocuments.sort((a, b) => {
      const dateA = new Date(a.stateDocumentUser[0]?.dateRecived).getTime();
      const dateB = new Date(b.stateDocumentUser[0]?.dateRecived).getTime();
      return dateB - dateA;
    });
    return showDocuments;
  }

  //--utilizado
  async getRecievedDocumentsMultiUnitys(userId: string) {
    // Busca el primer documento que contiene el usuario en la lista receivedUsers
    const documents = await this.documentModel
      .find({
        // 'sendMultiUnitysWithoutWorkflow.send.receivedUsers.idOfUser': userId,
        active: true,
      })
      .exec();

    // Si se encontró un documento, lo devuelve; de lo contrario, devuelve null
    let showDocuments = [];
    for (const document of documents) {
      const findUserRecievedDocument =
        document.sendMultiUnitysWithoutWorkflow.some((entry) => {
          entry.send.some((entry) => {
            entry.receivedUsers.some((entry) => {
              entry.idOfUser === userId;
            });
          });
        });
      if (findUserRecievedDocument) {
        showDocuments.push(document);
      }
    }
    showDocuments.sort((a, b) => {
      const dateA = new Date(a.updateAt[0]?.dateRecived).getTime();
      const dateB = new Date(b.updateAt[0]?.dateRecived).getTime();
      return dateB - dateA;
    });
    return showDocuments;
    /*
    try {
      // Busca el primer documento que contiene el usuario en la lista receivedUsers
      const documents = await this.documentModel
        .find({
          'sendMultiUnitysWithoutWorkflow.send.receivedUsers.idOfUser': userId,
        })
        .exec();

      // Si se encontró un documento, lo devuelve; de lo contrario, devuelve null
      documents.sort((a, b) => {
        const dateA = new Date(a.updateAt[0]?.dateRecived).getTime();
        const dateB = new Date(b.updateAt[0]?.dateRecived).getTime();
        return dateB - dateA;
      });
      return document || null;
    } 
    catch (error) {
      // Manejo de errores, por ejemplo, lanzar una excepción si hay un error
      throw new Error('Error al buscar el documento del usuario');
    }
    */
  }

  private async functionObtainAndDerivedDocument(
    documents: Documents[],
    userId: string,
  ) {
    let showDocuments = [];
    for (const document of documents) {
      // if (document.userId) {
      //   try {
      //     const res = await this.httpService
      //       .get(`${this.apiPersonalGet}/${document.userId}`)
      //       .toPromise();
      //     document.userInfo = {
      //       name: res.data.name,
      //       lastName: res.data.lastName,
      //       ci: res.data.ci,
      //       email: res.data.email,
      //       unity: res.data.unity,
      //     };
      //   } catch (error) {
      //     document.userId = 'no se encontraron datos del usuario';
      //   }
      // }
      const filteredDocumentsUserSome = document.userReceivedDocument.some(
        (entry) => {
          return entry.idOfUser === userId;
        },
      );
      if (filteredDocumentsUserSome) {
        // document.stateDocumetUser = 'RECIBIDO';
        showDocuments.push(document);
      }
      if (
        !filteredDocumentsUserSome
        // document.stateDocumetUser === 'DERIVADO'
      ) {
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

  async findDocumentsArchivedUser(userId: string) {
    const document = await this.documentModel
      .find({ userId: userId, stateDocumentUserSend: 'ARCHIVADO' })
      .exec();
    document.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return document;
  }
}
