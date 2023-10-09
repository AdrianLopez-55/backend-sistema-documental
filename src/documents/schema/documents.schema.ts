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
  @Prop()
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
  stateDocumentUserSend: string;

  @Prop({ uppercase: true })
  stateDocumetUser: string;

  //dato de seguimiento mas detallado para la persona que envio un documento
  @Prop({
    type: [
      {
        ciUser: String,
        idOfUser: String,
        nameOfficeUserRecieved: String,
        dateRecived: Date,
        stateDocumentUser: String,
        observado: Boolean,
      },
    ],
  })
  userReceivedDocument: {
    ciUser: string;
    idOfUser: string;
    nameOfficeUserRecieved: string;
    dateRecived: Date;
    stateDocumentUser: string;
    observado: boolean;
  }[];

  @Prop({
    type: [
      {
        ciUser: String,
        idOfUser: String,
        nameOfficeUserRecieved: String,
        dateRecived: Date,
        stateDocumentUser: String,
      },
    ],
  })
  userReceivedDocumentWithoutWorkflow: {
    ciUser: string;
    idOfUser: string;
    nameOfficeUserRecieved: string;
    dateRecived: Date;
    stateDocumentUser: string;
  }[];

  @Prop()
  oficinaActual: string;

  @Prop()
  oficinaPorPasar: string;

  @Prop({ type: WorkflowSchema, ref: 'Workflow', default: null })
  workflow: Workflow;

  @Prop({ uppercase: true })
  description: string;

  @Prop({ default: null })
  fileRegister: mongoose.Schema.Types.Mixed;

  @Prop()
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

  // @Prop({ default: Date.now(), immutable: true })
  // createdAt: Date;

  // @Prop({ default: Date.now() })
  // updateAt: Date;

  @Prop()
  year: string;

  @Prop({ default: 'create' })
  state: string;

  @Prop()
  counter: number;

  @Prop({
    type: [
      {
        oficinaActual: String,
        nameOficinaActual: String,
        userSend: String,
        dateSend: Date,
        userDerived: String,
        datedDerived: Date,
        receivedUsers: [
          {
            ciUser: String,
            idOfUser: String,
            nameOfficeUserRecieved: String,
            dateRecived: Date,
            stateDocumentUser: String,
            observado: { type: Boolean, default: false },
          },
        ],
        oficinasPorPasar: [
          {
            paso: Number,
            idOffice: String,
            oficina: String,
            completado: Boolean,
          },
        ],
        motivoBack: String,
      },
    ],
  })
  bitacoraWorkflow: {
    oficinaActual: string;
    nameOficinaActual: string;
    userSend: string;
    dateSend: Date;
    userDerived: string;
    datedDerived: Date;
    receivedUsers: {
      ciUser: string;
      idOfUser: string;
      nameOfficeUserRecieved: string;
      dateRecived: Date;
      stateDocumentUser: string;
      observado: boolean;
    }[];
    motivoBack: string;
    oficinasPorPasar: {
      paso: number;
      idOffice: string;
      oficina: string;
      completado: boolean;
    }[];
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

  @Prop({
    type: [
      {
        idUserSend: String,
        idOfficeUserSend: String,
        nameOficeUserSend: String,
        send: [
          {
            nameUnity: String,
            idUnity: String,
            receivedUsers: [
              {
                ciUser: String,
                idOfUser: String,
              },
            ],
          },
        ],
      },
    ],
  })
  sendMultiUnitysWithoutWorkflow: {
    idUserSend: string;
    idOfficeUserSend: string;
    nameOficeUserSend: string;
    send: {
      nameUnity: string;
      idUnity: string;
      receivedUsers: {
        ciUser: string;
        idOfUser: string;
      }[];
    }[];
  }[];

  @Prop({
    default: [],
    type: [
      {
        digitalSignature: String,
        userDigitalSignature: String,
      },
    ],
  })
  digitalSignatureDocument: {
    digitalSignature: string;
    userDigitalSignature: string;
  }[];
}

export const DocumentsSchema = SchemaFactory.createForClass(Documents);
export type DocumentsModel = Model<Documents>;

function incrementalValue(count: number): string {
  const nextValue = count + 1;
  const paddedValue = String(nextValue).padStart(7, '0');
  return `DOC-${paddedValue}`;
}
