// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Model } from 'mongoose';

// export type DigitalSignatureDocument = DigitalSignature & Document;

// @Schema()
// export class DigitalSignature {
//   @Prop()
//   userId: string;

//   @Prop()
//   publicKey: string;

//   @Prop({ unique: true })
//   hasPin: string;

//   @Prop()
//   privateKey: string;

//   @Prop({ default: Date.now() })
//   createdAt: Date;
// }

// export const DigitalSignatureSchema =
//   SchemaFactory.createForClass(DigitalSignature);
// export type DigitalSignatureModel = Model<DigitalSignature>;
