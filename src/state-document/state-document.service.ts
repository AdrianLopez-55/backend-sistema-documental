// import { HttpException, Injectable } from '@nestjs/common';
// import { CreateStateDocumentDto } from './dto/create-state-document.dto';
// import { UpdateStateDocumentDto } from './dto/update-state-document.dto';
// import { InjectModel } from '@nestjs/mongoose';
// import {
//   StateDocument,
//   StateDocumentDocuments,
// } from './schemas/state-document.schema';
// import { Model } from 'mongoose';
// import { StateDocumentFilter } from './dto/state-documentFilter.dto';

// @Injectable()
// export class StateDocumentService {
//   constructor(
//     @InjectModel(StateDocument.name)
//     private stateDocumentModel: Model<StateDocumentDocuments>,
//   ) {}

//   async create(
//     createStateDocumentDto: CreateStateDocumentDto,
//   ): Promise<StateDocument> {
//     try {
//       const { stateDocumentName } = createStateDocumentDto;
//       const existingStateDocument = await this.stateDocumentModel
//         .findOne({ stateDocumentName: stateDocumentName })
//         .exec();
//       if (!existingStateDocument) {
//         throw new HttpException(
//           `el nombre para el estado del documento: ${stateDocumentName} ya existe`,
//           400,
//         );
//       }
//       const newStateDocument = new this.stateDocumentModel({
//         stateDocumentName: stateDocumentName,
//       });
//       return newStateDocument.save();
//     } catch (error) {
//       throw new Error(`algo ocurrio: ${error}`);
//     }
//   }

//   findAll(): Promise<StateDocument[]> {
//     return this.stateDocumentModel
//       .find({ active: true })
//       .sort({ stateDocumentName: 1 })
//       .exec();
//   }

//   findAllInactive(): Promise<StateDocument[]> {
//     return this.stateDocumentModel
//       .find({ active: false })
//       .sort({ stateDocumentName: 1 })
//       .exec();
//   }

//   async findOne(id: string): Promise<StateDocument> {
//     const stateDocument = await this.stateDocumentModel
//       .findById({ _id: id })
//       .exec();
//     if (!stateDocument) {
//       throw new HttpException(
//         `el estado del documento con id: ${id} no fue encontrado`,
//         404,
//       );
//     }
//     if (stateDocument.active === false) {
//       throw new HttpException(
//         `el estado del documento con id: ${id} fue eliminado`,
//         400,
//       );
//     }
//     return stateDocument;
//   }

//   async update(id: string, updateStateDocumentDto: UpdateStateDocumentDto) {
//     const stateDocument = await this.stateDocumentModel.findById(id).exec();
//     if (!stateDocument) {
//       throw new HttpException(
//         `el estado del documento con id: ${id} no puede ser encntrado`,
//         404,
//       );
//     }
//     if (stateDocument.active === false) {
//       throw new HttpException(
//         `el estado del documento con id: ${id} fue eliminado`,
//         400,
//       );
//     }
//     stateDocument.stateDocumentName = updateStateDocumentDto.stateDocumentName;
//     const updateSteDocument = stateDocument.save();
//     return updateSteDocument;
//   }

//   async remove(id: string) {
//     const stateDocument: StateDocumentDocuments =
//       await this.stateDocumentModel.findById(id);
//     if (stateDocument.active === false) {
//       throw new HttpException(
//         `el estado del documento con id: ${id} ya fue eliminado`,
//         400,
//       );
//     }
//     stateDocument.active = false;
//     await stateDocument.save();
//     return stateDocument;
//   }

//   async activerStateDocument(id: string) {
//     const stateDocument: StateDocumentDocuments =
//       await this.stateDocumentModel.findById(id);
//     if (stateDocument.active === true) {
//       throw new HttpException(
//         `el estado del documento con id: ${id} ya esta activado`,
//         400,
//       );
//     }
//     stateDocument.active = true;
//     await stateDocument.save();
//     return stateDocument;
//   }

//   async filterParams(filter: StateDocumentFilter) {
//     const query = {};
//     if (filter.stateDocumentName) {
//       query['stateDocumentName'] = filter.stateDocumentName;
//     }
//     const filteredStateDocument = await this.stateDocumentModel
//       .find(query)
//       .exec();
//     return filteredStateDocument;
//   }
// }
