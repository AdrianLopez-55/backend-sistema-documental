import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Model, Mongoose, mongo } from 'mongoose';
import { Comment, CommentSchema } from './comment.schema';
import { MIlestoneSchema, Milestone } from './milestone.schema';
import { Workflow, WorkflowSchema } from 'src/workflow/schemas/workflow.schema';
import {
  DocumentationType,
  DocumentationTypeSchema,
} from 'src/documentation-type/schema/documentation-type.schema';
import { Template, TemplateSchema } from 'src/template/schemas/template.schema';
import {
  EstadoUbiacion,
  EstadoUbiacionSchema,
} from 'src/estado-ubicacion/schema/estado-ubicacion.schema';

export type DocumentDocument = Documents & Document;

@Schema({ versionKey: '__v', timestamps: true })
export class Documents {
  @Prop()
  numberDocument: string;

  @Prop()
  userId: string;

  // @Prop({ type: Object })
  // userInfo: {
  //   name: string;
  //   lastName: string;
  //   ci: string;
  //   email: string;
  //   unity: string;
  // };

  @Prop({ uppercase: true })
  title: string;

  @Prop({ uppercase: true })
  description: string;

  @Prop({ type: DocumentationTypeSchema, ref: 'DocumentationType' })
  documentationType: DocumentationType;

  @Prop({ type: EstadoUbiacionSchema, ref: 'EstadoUbiacion' })
  estado_Ubicacion: EstadoUbiacion;

  @Prop({ uppercase: true })
  stateDocumentUserSend: string;

  @Prop({
    type: [
      {
        ciUser: String,
        idOfUser: String,
        nameOfficeUserRecieved: String,
        dateRecived: Date,
        stateDocumentUser: String,
        nameUser: String,
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
    nameUser: string;
    observado: boolean;
  }[];

  @Prop()
  oficinaActual: string;

  @Prop()
  oficinaPorPasar: string;

  @Prop({ type: WorkflowSchema, ref: 'Workflow', default: null })
  workflow: Workflow;

  @Prop({
    type: [
      {
        idFile: String,
      },
    ],
  })
  fileRegister: {
    idFile: string;
  }[];

  @Prop()
  idTemplate: string;

  @Prop([CommentSchema])
  comments: Comment[];

  @Prop([MIlestoneSchema])
  milestone: Milestone[];

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: Date, default: () => new Date(), immutable: true })
  createdAt: Date;

  @Prop({ type: Date, default: () => new Date() })
  updateAt: Date;

  //---------- NUEVO -------------
  @Prop({ default: new Date().getFullYear().toString() })
  year: string;

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
            nameUser: String,
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
      nameUser: string;
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
            stateDocumentUser: String,
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
      stateDocumentUser: string;
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
