import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';

export type FileDocument = File & Document;

@Schema()
export class File {
  @Prop()
  idDocument: string;

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
}

export const FileSchema = SchemaFactory.createForClass(File);
export type FileModel = Model<File>;
