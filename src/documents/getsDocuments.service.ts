import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentDocument, Documents } from './schema/documents.schema';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import getConfig from '../config/configuration';
import { PaginationDto } from 'src/common/pagination.dto';
// import { DocumentsFilter } from './dto/documents-dto';
import { FilterDocumentsAll } from './dto/filterDocumentsAll';

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
    filterAll: FilterDocumentsAll,
    dateRange: { startDate: Date; endDate: Date },
    dateRangeRecived: { startDateRecived: Date; endDateRecived: Date },
  ) {
    const {
      numberDocument,
      active,
      description,
      descriptionWorkflow,
      nombre,
      oficinaActual,
      stateDocumentUserSend,
      title,
      typeName,
      userDigitalSignature,
      year,
      limit = this.defaultLimit,
      page = 1,
    } = filterAll;

    if (view === undefined) {
      let query = this.documentModel.find({ userId: userId });

      if (numberDocument) {
        query = query.where('numberDocument', new RegExp(numberDocument, 'i'));
      }

      if (userId) {
        query = query.where('userId', new RegExp(userId, 'i'));
      }
      if (title) {
        query = query.where('title', new RegExp(title, 'i'));
      }
      if (typeName) {
        query['documentationType'] = {
          $elemMatch: { documentationType: typeName },
        };
      }
      if (stateDocumentUserSend) {
        query['stateDocumentUserSend'] = stateDocumentUserSend;
      }
      if (nombre) {
        query['workflow'] = {
          $elemMatch: { nombre: nombre },
        };
      }
      if (descriptionWorkflow) {
        query['workflow'] = {
          $elemMatch: { descriptionWorkflow: descriptionWorkflow },
        };
      }
      if (oficinaActual) {
        query['workflow'] = {
          $elemMatch: { oficinaActual: oficinaActual },
        };
      }
      if (description) {
        query = query.where('userId', new RegExp(description, 'i'));
      }
      if (active) {
        // query['active'] = active;
        query = query.where('active', active);
      }

      if (userDigitalSignature) {
        query = query.where(
          'digitalSignatureDocument.userDigitalSignature',
          userId,
        );
      }

      if (dateRange.startDate && dateRange.endDate) {
        query = query.where('createdAt', {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        });
      }

      //--filtrar documentos recividos
      if (
        dateRangeRecived.startDateRecived &&
        dateRangeRecived.endDateRecived
      ) {
        // Filtrar por el campo 'userReceivedDocument.dateRecived' dentro del array
        query = query.elemMatch('userReceivedDocument', {
          dateRecived: {
            $gte: dateRangeRecived.startDateRecived,
            $lte: dateRangeRecived.endDateRecived,
          },
        });
      }

      const offset = (page - 1) * limit;

      const filteredDocuments = await this.documentModel
        .find(query)
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });

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
        console.log('esto es user id', userId);

        if (numberDocument) {
          query = query.where(
            'numberDocument',
            new RegExp(numberDocument, 'i'),
          );
        }
        if (userId) {
          query = query.where('userId', new RegExp(userId, 'i'));
        }
        if (title) {
          query = query.where('title', new RegExp(title, 'i'));
        }
        if (typeName) {
          query['documentationType'] = {
            $elemMatch: { documentationType: typeName },
          };
        }
        if (stateDocumentUserSend) {
          query['stateDocumentUserSend'] = stateDocumentUserSend;
        }
        if (nombre) {
          query['workflow'] = {
            $elemMatch: { nombre: nombre },
          };
        }
        if (descriptionWorkflow) {
          query['workflow'] = {
            $elemMatch: { descriptionWorkflow: descriptionWorkflow },
          };
        }
        if (oficinaActual) {
          query['workflow'] = {
            $elemMatch: { oficinaActual: oficinaActual },
          };
        }
        if (description) {
          query = query.where('userId', new RegExp(description, 'i'));
        }
        if (active) {
          // query['active'] = active;
          query = query.where('active', active);
        }

        if (userDigitalSignature) {
          query = query.where(
            'digitalSignatureDocument.userDigitalSignature',
            userId,
          );
        }

        if (dateRange.startDate && dateRange.endDate) {
          query = query.where('createdAt', {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          });
        }

        //--filtrar documentos recividos
        if (
          dateRangeRecived.startDateRecived &&
          dateRangeRecived.endDateRecived
        ) {
          // Filtrar por el campo 'userReceivedDocument.dateRecived' dentro del array
          query = query.elemMatch('userReceivedDocument', {
            dateRecived: {
              $gte: dateRangeRecived.startDateRecived,
              $lte: dateRangeRecived.endDateRecived,
            },
          });
        }

        // const documents = await this.documentModel
        //   .find({ active: true })
        //   .exec();

        // const filteredDocuments = documents.filter((document) => {
        //   return document.userReceivedDocument.some((entry) => {
        //     return entry.idOfUser === userId;
        //   });
        // });

        const offset = (page - 1) * limit;
        const filteredDocuments = await this.documentModel
          .find(query)
          .limit(limit)
          .skip(offset)
          .sort({ createdAt: -1 });

        console.log('filteredDocuments', filteredDocuments);

        const total = await this.documentModel.countDocuments(query).exec();

        return {
          data: filteredDocuments,
          total: total,
          totalPages: Math.ceil(total / limit),
        };
      }
      if (withWorkflow === 'true') {
        let query = this.documentModel.find({
          'userReceivedDocument.idOfUser': userId,
          workflow: { $ne: null },
        });
        if (numberDocument) {
          query = query.where(
            'numberDocument',
            new RegExp(numberDocument, 'i'),
          );
        }
        if (userId) {
          query = query.where('userId', new RegExp(userId, 'i'));
        }
        if (title) {
          query = query.where('title', new RegExp(title, 'i'));
        }
        if (typeName) {
          query['documentationType'] = {
            $elemMatch: { documentationType: typeName },
          };
        }
        if (stateDocumentUserSend) {
          query['stateDocumentUserSend'] = stateDocumentUserSend;
        }
        if (nombre) {
          query['workflow'] = {
            $elemMatch: { nombre: nombre },
          };
        }
        if (descriptionWorkflow) {
          query['workflow'] = {
            $elemMatch: { descriptionWorkflow: descriptionWorkflow },
          };
        }
        if (oficinaActual) {
          query['workflow'] = {
            $elemMatch: { oficinaActual: oficinaActual },
          };
        }
        if (description) {
          query = query.where('userId', new RegExp(description, 'i'));
        }
        if (active) {
          // query['active'] = active;
          query = query.where('active', active);
        }
        if (userDigitalSignature) {
          query['digitalSignatureDocument.userDigitalSignature'] =
            userDigitalSignature;
        }

        if (dateRange.startDate && dateRange.endDate) {
          query = query.where('createdAt', {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          });
        }

        //--filtrar documentos recividos
        if (
          dateRangeRecived.startDateRecived &&
          dateRangeRecived.endDateRecived
        ) {
          // Filtrar por el campo 'userReceivedDocument.dateRecived' dentro del array
          query = query.elemMatch('userReceivedDocument', {
            dateRecived: {
              $gte: dateRangeRecived.startDateRecived,
              $lte: dateRangeRecived.endDateRecived,
            },
          });
        }

        const offset = (page - 1) * limit;

        const filteredDocuments = await this.documentModel
          .find(query)
          .limit(limit)
          .skip(offset)
          .sort({ createdAt: -1 });

        // filteredDocuments.sort((a, b) => {
        //   return (
        //     new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        //   );
        // });

        const total = await this.documentModel.countDocuments(query).exec();

        return {
          data: filteredDocuments,
          total: total,
          totalPages: Math.ceil(total / limit),
        };
      }
      if (withWorkflow === 'false') {
        let query = this.documentModel.find({
          'userReceivedDocument.idOfUser': userId,
          workflow: null,
        });
        if (numberDocument) {
          query = query.where(
            'numberDocument',
            new RegExp(numberDocument, 'i'),
          );
        }
        if (userId) {
          query = query.where('userId', new RegExp(userId, 'i'));
        }
        if (title) {
          query = query.where('title', new RegExp(title, 'i'));
        }
        if (typeName) {
          query['documentationType'] = {
            $elemMatch: { documentationType: typeName },
          };
        }
        if (stateDocumentUserSend) {
          query['stateDocumentUserSend'] = stateDocumentUserSend;
        }
        if (nombre) {
          query['workflow'] = {
            $elemMatch: { nombre: nombre },
          };
        }
        if (descriptionWorkflow) {
          query['workflow'] = {
            $elemMatch: { descriptionWorkflow: descriptionWorkflow },
          };
        }
        if (oficinaActual) {
          query['workflow'] = {
            $elemMatch: { oficinaActual: oficinaActual },
          };
        }
        if (description) {
          query = query.where('userId', new RegExp(description, 'i'));
        }
        if (active) {
          // query['active'] = active;
          query = query.where('active', active);
        }

        if (userDigitalSignature) {
          query = query.where(
            'digitalSignatureDocument.userDigitalSignature',
            userId,
          );
        }

        //--filtrar documentos recividos
        if (
          dateRangeRecived.startDateRecived &&
          dateRangeRecived.endDateRecived
        ) {
          // Filtrar por el campo 'userReceivedDocument.dateRecived' dentro del array
          query = query.elemMatch('userReceivedDocument', {
            dateRecived: {
              $gte: dateRangeRecived.startDateRecived,
              $lte: dateRangeRecived.endDateRecived,
            },
          });
        }

        if (dateRange.startDate && dateRange.endDate) {
          query = query.where('createdAt', {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          });
        }

        const offset = (page - 1) * limit;

        const filteredDocuments = await this.documentModel
          .find(query)
          .limit(limit)
          .skip(offset)
          .sort({ createdAt: -1 });

        // filteredDocuments.sort((a, b) => {
        //   return (
        //     new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        //   );
        // });

        const total = await this.documentModel.countDocuments(query).exec();

        return {
          data: filteredDocuments,
          total: total,
          totalPages: Math.ceil(total / limit),
        };
      }
    } else if (view === 'REVISADOS') {
      let query = this.documentModel.find({
        'userReceivedDocument.stateDocumentUser': 'REVISADO',
        userId: userId,
      });
      if (numberDocument) {
        query = query.where('numberDocument', new RegExp(numberDocument, 'i'));
      }
      if (userId) {
        query = query.where('userId', new RegExp(userId, 'i'));
      }
      if (title) {
        query = query.where('title', new RegExp(title, 'i'));
      }
      if (typeName) {
        query['documentationType'] = {
          $elemMatch: { documentationType: typeName },
        };
      }
      if (stateDocumentUserSend) {
        query['stateDocumentUserSend'] = stateDocumentUserSend;
      }
      if (nombre) {
        query['workflow'] = {
          $elemMatch: { nombre: nombre },
        };
      }
      if (descriptionWorkflow) {
        query['workflow'] = {
          $elemMatch: { descriptionWorkflow: descriptionWorkflow },
        };
      }
      if (oficinaActual) {
        query['workflow'] = {
          $elemMatch: { oficinaActual: oficinaActual },
        };
      }
      if (description) {
        query = query.where('userId', new RegExp(description, 'i'));
      }
      if (active) {
        // query['active'] = active;
        query = query.where('active', active);
      }

      if (userDigitalSignature) {
        query = query.where(
          'digitalSignatureDocument.userDigitalSignature',
          userId,
        );
      }

      if (dateRange.startDate && dateRange.endDate) {
        query = query.where('createdAt', {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        });
      }

      //--filtrar documentos recividos
      if (
        dateRangeRecived.startDateRecived &&
        dateRangeRecived.endDateRecived
      ) {
        // Filtrar por el campo 'userReceivedDocument.dateRecived' dentro del array
        query = query.elemMatch('userReceivedDocument', {
          dateRecived: {
            $gte: dateRangeRecived.startDateRecived,
            $lte: dateRangeRecived.endDateRecived,
          },
        });
      }

      const offset = (page - 1) * limit;

      const filteredDocuments = await this.documentModel
        .find(query)
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });

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

        if (numberDocument) {
          query = query.where(
            'numberDocument',
            new RegExp(numberDocument, 'i'),
          );
        }
        if (userId) {
          query = query.where('userId', new RegExp(userId, 'i'));
        }
        if (title) {
          query = query.where('title', new RegExp(title, 'i'));
        }
        if (typeName) {
          query['documentationType'] = {
            $elemMatch: { documentationType: typeName },
          };
        }
        if (stateDocumentUserSend) {
          query['stateDocumentUserSend'] = stateDocumentUserSend;
        }
        if (nombre) {
          query['workflow'] = {
            $elemMatch: { nombre: nombre },
          };
        }
        if (descriptionWorkflow) {
          query['workflow'] = {
            $elemMatch: { descriptionWorkflow: descriptionWorkflow },
          };
        }
        if (oficinaActual) {
          query['workflow'] = {
            $elemMatch: { oficinaActual: oficinaActual },
          };
        }
        if (description) {
          query = query.where('userId', new RegExp(description, 'i'));
        }
        if (active) {
          // query['active'] = active;
          query = query.where('active', active);
        }

        if (userDigitalSignature) {
          query = query.where(
            'digitalSignatureDocument.userDigitalSignature',
            userId,
          );
        }
        if (dateRange.startDate && dateRange.endDate) {
          query = query.where('createdAt', {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          });
        }

        //--filtrar documentos recividos
        if (
          dateRangeRecived.startDateRecived &&
          dateRangeRecived.endDateRecived
        ) {
          // Filtrar por el campo 'userReceivedDocument.dateRecived' dentro del array
          query = query.elemMatch('userReceivedDocument', {
            dateRecived: {
              $gte: dateRangeRecived.startDateRecived,
              $lte: dateRangeRecived.endDateRecived,
            },
          });
        }

        const offset = (page - 1) * limit;

        const filteredDocuments = await this.documentModel
          .find(query)
          .limit(limit)
          .skip(offset)
          .sort({ createdAt: -1 });

        // filteredDocuments.sort((a, b) => {
        //   return (
        //     new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        //   );
        // });

        const total = await this.documentModel.countDocuments(query).exec();

        return {
          data: filteredDocuments,
          total: total,
          totalPages: Math.ceil(total / limit),
        };
      }
      if (withWorkflow && withWorkflow === 'true') {
        let query = this.documentModel.find({
          userId: userId,
          stateDocumentUserSend: 'INICIADO',
        });
        if (numberDocument) {
          query = query.where(
            'numberDocument',
            new RegExp(numberDocument, 'i'),
          );
        }
        if (userId) {
          query = query.where('userId', new RegExp(userId, 'i'));
        }
        if (title) {
          query = query.where('title', new RegExp(title, 'i'));
        }
        if (typeName) {
          query['documentationType'] = {
            $elemMatch: { documentationType: typeName },
          };
        }
        if (stateDocumentUserSend) {
          query['stateDocumentUserSend'] = stateDocumentUserSend;
        }
        if (nombre) {
          query['workflow'] = {
            $elemMatch: { nombre: nombre },
          };
        }
        if (descriptionWorkflow) {
          query['workflow'] = {
            $elemMatch: { descriptionWorkflow: descriptionWorkflow },
          };
        }
        if (oficinaActual) {
          query['workflow'] = {
            $elemMatch: { oficinaActual: oficinaActual },
          };
        }
        if (description) {
          query = query.where('userId', new RegExp(description, 'i'));
        }
        if (active) {
          // query['active'] = active;
          query = query.where('active', active);
        }

        if (userDigitalSignature) {
          query = query.where(
            'digitalSignatureDocument.userDigitalSignature',
            userId,
          );
        }

        if (dateRange.startDate && dateRange.endDate) {
          query = query.where('createdAt', {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          });
        }

        //--filtrar documentos recividos
        if (
          dateRangeRecived.startDateRecived &&
          dateRangeRecived.endDateRecived
        ) {
          // Filtrar por el campo 'userReceivedDocument.dateRecived' dentro del array
          query = query.elemMatch('userReceivedDocument', {
            dateRecived: {
              $gte: dateRangeRecived.startDateRecived,
              $lte: dateRangeRecived.endDateRecived,
            },
          });
        }

        const offset = (page - 1) * limit;

        const filteredDocuments = await this.documentModel
          .find(query)
          .limit(limit)
          .skip(offset)
          .sort({ createdAt: -1 });

        const total = await this.documentModel.countDocuments(query).exec();

        return {
          data: filteredDocuments,
          total: total,
          totalPages: Math.ceil(total / limit),
        };
      }
      if (withWorkflow && withWorkflow === 'false') {
        let query = this.documentModel.find({
          userId: userId,
          stateDocumentUserSend: 'ENVIADO DIRECTO',
        });
        if (numberDocument) {
          query = query.where(
            'numberDocument',
            new RegExp(numberDocument, 'i'),
          );
        }
        if (userId) {
          query = query.where('userId', new RegExp(userId, 'i'));
        }
        if (title) {
          query = query.where('title', new RegExp(title, 'i'));
        }
        if (typeName) {
          query['documentationType'] = {
            $elemMatch: { documentationType: typeName },
          };
        }
        if (stateDocumentUserSend) {
          query['stateDocumentUserSend'] = stateDocumentUserSend;
        }
        if (nombre) {
          query['workflow'] = {
            $elemMatch: { nombre: nombre },
          };
        }
        if (descriptionWorkflow) {
          query['workflow'] = {
            $elemMatch: { descriptionWorkflow: descriptionWorkflow },
          };
        }
        if (oficinaActual) {
          query['workflow'] = {
            $elemMatch: { oficinaActual: oficinaActual },
          };
        }
        if (description) {
          query = query.where('userId', new RegExp(description, 'i'));
        }
        if (active) {
          // query['active'] = active;
          query = query.where('active', active);
        }

        if (userDigitalSignature) {
          query = query.where(
            'digitalSignatureDocument.userDigitalSignature',
            userId,
          );
        }

        if (dateRange.startDate && dateRange.endDate) {
          query = query.where('createdAt', {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          });
        }

        //--filtrar documentos recividos
        if (
          dateRangeRecived.startDateRecived &&
          dateRangeRecived.endDateRecived
        ) {
          // Filtrar por el campo 'userReceivedDocument.dateRecived' dentro del array
          query = query.elemMatch('userReceivedDocument', {
            dateRecived: {
              $gte: dateRangeRecived.startDateRecived,
              $lte: dateRangeRecived.endDateRecived,
            },
          });
        }

        const offset = (page - 1) * limit;

        const filteredDocuments = await this.documentModel
          .find(query)
          .limit(limit)
          .skip(offset)
          .sort({ createdAt: -1 });

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
      if (numberDocument) {
        query = query.where('numberDocument', new RegExp(numberDocument, 'i'));
      }
      if (userId) {
        query = query.where('userId', new RegExp(userId, 'i'));
      }
      if (title) {
        query = query.where('title', new RegExp(title, 'i'));
      }
      if (typeName) {
        query['documentationType'] = {
          $elemMatch: { documentationType: typeName },
        };
      }
      if (stateDocumentUserSend) {
        query['stateDocumentUserSend'] = stateDocumentUserSend;
      }
      if (nombre) {
        query['workflow'] = {
          $elemMatch: { nombre: nombre },
        };
      }
      if (descriptionWorkflow) {
        query['workflow'] = {
          $elemMatch: { descriptionWorkflow: descriptionWorkflow },
        };
      }
      if (oficinaActual) {
        query['workflow'] = {
          $elemMatch: { oficinaActual: oficinaActual },
        };
      }
      if (description) {
        query = query.where('userId', new RegExp(description, 'i'));
      }
      if (active) {
        // query['active'] = active;
        query = query.where('active', active);
      }

      if (userDigitalSignature) {
        query = query.where(
          'digitalSignatureDocument.userDigitalSignature',
          userId,
        );
      }

      if (dateRange.startDate && dateRange.endDate) {
        query = query.where('createdAt', {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        });
      }

      //--filtrar documentos recividos
      if (
        dateRangeRecived.startDateRecived &&
        dateRangeRecived.endDateRecived
      ) {
        // Filtrar por el campo 'userReceivedDocument.dateRecived' dentro del array
        query = query.elemMatch('userReceivedDocument', {
          dateRecived: {
            $gte: dateRangeRecived.startDateRecived,
            $lte: dateRangeRecived.endDateRecived,
          },
        });
      }

      const offset = (page - 1) * limit;

      const filteredDocuments = await this.documentModel
        .find(query)
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });

      const total = await this.documentModel.countDocuments(query).exec();

      return {
        data: filteredDocuments,
        total: total,
        totalPages: Math.ceil(total / limit),
      };
    } else if (view === 'OBSERVADO') {
      let query = this.documentModel.find({
        'userReceivedDocument.stateDocumentUser': 'OBSERVADO',
      });
      if (numberDocument) {
        query = query.where('numberDocument', new RegExp(numberDocument, 'i'));
      }
      if (userId) {
        query = query.where('userId', new RegExp(userId, 'i'));
      }
      if (title) {
        query = query.where('title', new RegExp(title, 'i'));
      }
      if (typeName) {
        query['documentationType'] = {
          $elemMatch: { documentationType: typeName },
        };
      }
      if (stateDocumentUserSend) {
        query['stateDocumentUserSend'] = stateDocumentUserSend;
      }
      if (nombre) {
        query['workflow'] = {
          $elemMatch: { nombre: nombre },
        };
      }
      if (descriptionWorkflow) {
        query['workflow'] = {
          $elemMatch: { descriptionWorkflow: descriptionWorkflow },
        };
      }
      if (oficinaActual) {
        query['workflow'] = {
          $elemMatch: { oficinaActual: oficinaActual },
        };
      }
      if (description) {
        query = query.where('userId', new RegExp(description, 'i'));
      }
      if (active) {
        // query['active'] = active;
        query = query.where('active', active);
      }

      if (userDigitalSignature) {
        query = query.where(
          'digitalSignatureDocument.userDigitalSignature',
          userId,
        );
      }

      if (dateRange.startDate && dateRange.endDate) {
        query = query.where('createdAt', {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        });
      }

      //--filtrar documentos recividos
      if (
        dateRangeRecived.startDateRecived &&
        dateRangeRecived.endDateRecived
      ) {
        // Filtrar por el campo 'userReceivedDocument.dateRecived' dentro del array
        query = query.elemMatch('userReceivedDocument', {
          dateRecived: {
            $gte: dateRangeRecived.startDateRecived,
            $lte: dateRangeRecived.endDateRecived,
          },
        });
      }

      const offset = (page - 1) * limit;

      const filteredDocuments = await this.documentModel
        .find(query)
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });

      const total = await this.documentModel.countDocuments(query).exec();

      return {
        data: filteredDocuments,
        total: total,
        totalPages: Math.ceil(total / limit),
      };
    } else if (view === 'EN ESPERA') {
      try {
        let query = this.documentModel.find({
          userId: userId,
          stateDocumentUserSend: 'EN ESPERA',
        });
        if (numberDocument) {
          query = query.where(
            'numberDocument',
            new RegExp(numberDocument, 'i'),
          );
        }
        if (userId) {
          query = query.where('userId', new RegExp(userId, 'i'));
        }
        if (title) {
          query = query.where('title', new RegExp(title, 'i'));
        }
        if (typeName) {
          query['documentationType'] = {
            $elemMatch: { documentationType: typeName },
          };
        }
        if (stateDocumentUserSend) {
          query['stateDocumentUserSend'] = stateDocumentUserSend;
        }
        if (nombre) {
          query['workflow'] = {
            $elemMatch: { nombre: nombre },
          };
        }
        if (descriptionWorkflow) {
          query['workflow'] = {
            $elemMatch: { descriptionWorkflow: descriptionWorkflow },
          };
        }
        if (oficinaActual) {
          query['workflow'] = {
            $elemMatch: { oficinaActual: oficinaActual },
          };
        }
        if (description) {
          query = query.where('userId', new RegExp(description, 'i'));
        }
        if (active) {
          // query['active'] = active;
          query = query.where('active', active);
        }

        if (userDigitalSignature) {
          query = query.where(
            'digitalSignatureDocument.userDigitalSignature',
            userId,
          );
        }

        if (dateRange.startDate && dateRange.endDate) {
          query = query.where('createdAt', {
            $gte: dateRange.startDate,
            $lte: dateRange.endDate,
          });
        }

        //--filtrar documentos recividos
        if (
          dateRangeRecived.startDateRecived &&
          dateRangeRecived.endDateRecived
        ) {
          // Filtrar por el campo 'userReceivedDocument.dateRecived' dentro del array
          query = query.elemMatch('userReceivedDocument', {
            dateRecived: {
              $gte: dateRangeRecived.startDateRecived,
              $lte: dateRangeRecived.endDateRecived,
            },
          });
        }

        const offset = (page - 1) * limit;

        const filteredDocuments = await this.documentModel
          .find(query)
          .limit(limit)
          .skip(offset)
          .sort({ createdAt: -1 });

        const total = await this.documentModel.countDocuments(query).exec();

        return {
          data: filteredDocuments,
          total: total,
          totalPages: Math.ceil(total / limit),
        };
      } catch (error) {
        throw new HttpException(`Ocurio algo: ${error}`, 500);
      }
    } else if (view === 'ARCHIVADOS') {
      let query = this.documentModel.find({
        userId: userId,
        stateDocumentUserSend: 'ARCHIVADO',
      });
      if (numberDocument) {
        query = query.where('numberDocument', new RegExp(numberDocument, 'i'));
      }
      if (userId) {
        query = query.where('userId', new RegExp(userId, 'i'));
      }
      if (title) {
        query = query.where('title', new RegExp(title, 'i'));
      }
      if (typeName) {
        query['documentationType'] = {
          $elemMatch: { documentationType: typeName },
        };
      }
      if (stateDocumentUserSend) {
        query['stateDocumentUserSend'] = stateDocumentUserSend;
      }
      if (nombre) {
        query['workflow'] = {
          $elemMatch: { nombre: nombre },
        };
      }
      if (descriptionWorkflow) {
        query['workflow'] = {
          $elemMatch: { descriptionWorkflow: descriptionWorkflow },
        };
      }
      if (oficinaActual) {
        query['workflow'] = {
          $elemMatch: { oficinaActual: oficinaActual },
        };
      }
      if (description) {
        query = query.where('userId', new RegExp(description, 'i'));
      }
      if (active) {
        // query['active'] = active;
        query = query.where('active', active);
      }

      if (userDigitalSignature) {
        query = query.where(
          'digitalSignatureDocument.userDigitalSignature',
          userId,
        );
      }

      if (dateRange.startDate && dateRange.endDate) {
        query = query.where('createdAt', {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        });
      }

      //--filtrar documentos recividos
      if (
        dateRangeRecived.startDateRecived &&
        dateRangeRecived.endDateRecived
      ) {
        // Filtrar por el campo 'userReceivedDocument.dateRecived' dentro del array
        query = query.elemMatch('userReceivedDocument', {
          dateRecived: {
            $gte: dateRangeRecived.startDateRecived,
            $lte: dateRangeRecived.endDateRecived,
          },
        });
      }

      const offset = (page - 1) * limit;

      const filteredDocuments = await this.documentModel
        .find(query)
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });

      const total = await this.documentModel.countDocuments(query).exec();

      return {
        data: filteredDocuments,
        total: total,
        totalPages: Math.ceil(total / limit),
      };
    }
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
