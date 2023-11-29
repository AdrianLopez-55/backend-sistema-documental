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
        nameOffices: String,
        stateOffice: String,
        numberPasoOffice: Number,
        receivedUsers: [
          {
            ciUser: String,
            idOfUser: String,
            name: String,
            lastName: String,
            nameOfficeUserRecieved: String,
            // nameUser: String,
            dateRecived: Date,
            stateDocumentUser: String,
          },
        ],

        activo: Boolean,
      },
    ],
  })
  estado_ubi: {
    nameOffices: string;
    stateOffice: string;
    numberPasoOffice: number;
    receivedUsers: {
      ciUser: string;
      idOfUser: string;
      name: string;
      lastName: string;
      nameOfficeUserRecieved: string;
      dateRecived: Date;
      // nameUser: string;
      stateDocumentUser: string;
      observado: boolean;
    }[];
    // oficinas
    activo: boolean;
  }[];

  @Prop({ type: Date, default: () => new Date(), immutable: true })
  createdAt: Date;

  @Prop({ type: Date, default: () => new Date() })
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
