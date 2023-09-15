import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Model, Mongoose, mongo } from 'mongoose';
import { Comment, CommentSchema } from './comment.schema';
import { MIlestoneSchema, Milestone } from './milestone.schema';
import { Workflow, WorkflowSchema } from 'src/workflow/schemas/workflow.schema';
import {
  DocumentationType,
  DocumentationTypeSchema,
} from 'src/documentation-type/schema/documentation-type.schema';

export type DocumentDocument = Documents & Document;

@Schema({ versionKey: '__v', timestamps: true })
export class Documents {
  @Prop({ default: () => `DOC-${incrementalValue(0)}` })
  numberDocument: string;

  @Prop()
  userId: string;

  @Prop({ type: Object })
  userInfo: {
    name: string;
    lastName: string;
    ci: string;
    email: string;
    unity: string;
  };

  @Prop({ uppercase: true })
  title: string;

  @Prop({ type: DocumentationTypeSchema, ref: 'DocumentationType' })
  documentationType: DocumentationType;

  @Prop({ uppercase: true })
  stateDocumentWorkflow: string;

  // para hacer seguimiento del documento pero sin datos, solo saber si
  // el documento esta en espera, fue enviado, hubo alguna observacion, finalizo
  // 'INICIADO', 'CONCLUIDO', 'OBSERVADO', 'SIN INICIAR'
  // @Prop({ uppercase: true })
  // stateDocumentWorkflowUserSend: string;

  // este dato es solo para saber en que estado del documento esta la persona que
  //recibio el documento y lo derivara, no puede ver el dato stateDocumetWorkflowUserSend
  // 'RECIBIDO', 'REVISADO', 'DERIVADO', 'OBSERVADO', 'COMPLETADO'
  // @Prop({ uppercase: true })
  // steateDocumetUser: string;

  //solo para ver el estado de un documento que fue enviado a una persona
  //especifica pero sin workflow
  // 'ENVIADO SIN WORKFLOW'
  // @Prop({ uppercase: true })
  // stateDocumentSentWitoutworkflow: string;

  //dato de seguimiento mas detallado para la persona que envio un documento
  // @Prop({
  //   userRecieved: String,
  //   nameOfficeUserRecieved: String,
  //   stateDocumentUser: String,
  // })
  // infoStateDocument: {
  //   userRecieved: string;
  //   nameOfficeUserRecieved: string;
  //   stateDocumentUser: string;
  // };

  @Prop({ type: WorkflowSchema, ref: 'Workflow', default: null })
  workflow: Workflow;

  @Prop({ uppercase: true })
  description: string;

  @Prop({ default: null })
  fileRegister: mongoose.Schema.Types.Mixed;

  @Prop({ default: null })
  fileBase64: string;

  @Prop()
  idTemplate: string;

  @Prop()
  base64Template: string;

  @Prop([CommentSchema])
  comments: Comment[];

  @Prop([MIlestoneSchema])
  milestone: Milestone[];

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: Date.now(), immutable: true })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updateAt: Date;

  @Prop()
  year: string;

  @Prop({ default: 'create' })
  state: string;

  @Prop({
    type: [
      {
        oficinaActual: String,
        nameOficinaActual: String,
        receivedUsers: [
          { ciUser: String, idOfUser: String, nameOfficeUserRecieved: String },
        ],
        oficinasPorPasar: Array,
        motivoBack: String,
      },
    ],
  })
  bitacoraWorkflow: {
    oficinaActual: string;
    nameOficinaActual: string;
    receivedUsers: {
      ciUser: string;
      idOfUser: string;
      nameOfficeUserRecieved: string;
    }[];
    motivoBack: string;
    oficinasPorPasar: string[];
  }[];

  @Prop({
    type: [
      {
        idUserSendOrigin: String,
        idOfficeUserSend: String,
        nameOficeUser: String,
        recievedUsers: [
          {
            ciUser: String,
            idOfUser: String,
            idOffice: String,
            nameOficeUserRecieved: String,
          },
        ],
      },
    ],
  })
  bitacoraWithoutWorkflow: {
    idUserSendOrigin: string;
    idOfficeUserSend: string;
    nameOficeUser: string;
    recievedUsers: {
      ciUser: string;
      idOfUser: string;
      idOffice: string;
      nameOficeUserRecieved: string;
    }[];
  }[];
}

export const DocumentsSchema = SchemaFactory.createForClass(Documents);
export type DocumentsModel = Model<Documents>;

function incrementalValue(count: number): string {
  const nextValue = count + 1;
  const paddedValue = String(nextValue).padStart(3, '0');
  return `DOC-${paddedValue}`;
}
