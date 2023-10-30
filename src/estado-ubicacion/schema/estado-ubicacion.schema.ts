import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type EstadoUbiacionDocument = EstadoUbiacion & Document;

@Schema()
export class EstadoUbiacion {
  @Prop()
  idDocument: string;

  @Prop({
    type: [
      {
        nameOffices: [
          {
            office: String,
          },
        ],
        stateOffice: String,
        numberPasoOffice: Number,
        receivedUsers: [
          {
            ciUser: String,
            idOfUser: String,
            nameOfficeUserRecieved: String,
            dateRecived: Date,
            stateDocumentUser: String,
          },
        ],
        activo: Boolean,
      },
    ],
  })
  estado_ubi: {
    nameOffices: {
      office: string;
    }[];
    stateOffice: string;
    numberPasoOffice: number;
    receivedUsers: {
      ciUser: string;
      idOfUser: string;
      nameOfficeUserRecieved: string;
      dateRecived: Date;
      stateDocumentUser: string;
      observado: boolean;
    }[];
    activo: boolean;
  }[];

  @Prop({ default: Date.now(), immutable: true })
  createdAt: Date;

  @Prop({ default: Date.now() })
  updateAt: Date;

  // @Prop()
  // nameOffice: string;

  // @Prop()
  // stateOffice: string;

  // @Prop({
  //   type: [
  //     {
  //       ciUser: String,
  //       idOfUser: String,
  //       nameOfficeUserRecieved: String,
  //       dateRecieved: Date,
  //       stateDocumentUser: String,
  //       observado: Boolean,
  //     },
  //   ],
  // })
  // receivedUsers: {
  //   ciUser: string;
  //   idOfUser: String;
  //   nameOfficeUserRecieved: string;
  //   dateRecieved: Date;
  //   stateDocumentUser: string;
  //   observado: boolean;
  // };

  // @Prop()
  // activo: boolean;
}
export const EstadoUbiacionSchema =
  SchemaFactory.createForClass(EstadoUbiacion);
export type EstadoUbiacionModel = Model<EstadoUbiacion>;
