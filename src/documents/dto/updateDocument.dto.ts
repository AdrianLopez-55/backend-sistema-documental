import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreateDocumentDTO } from './createDocument.dto';

export class UpdateDocumentDTO extends PartialType(CreateDocumentDTO){}


// export class UpdateDocumentDTO {
//   @ApiProperty({ example: 'Resources from DataCenter' })
//   @IsString()
//   readonly title: string;

//   @ApiProperty({ example: 'Costos' })
//   @IsString()
//   documentType: string;

//   @ApiProperty({ example: 'Revision' })
//   @IsString()
//   readonly stateDocument: string;

//   @ApiProperty({ example: 'derecho' })
//   @IsString()
//   documentDestinations: string;

//   @ApiProperty({
//     example: 'contract document registration for new staff. It is on revision',
//   })
//   @IsString()
//   readonly description: string;

//   @ApiProperty({ example: 'data:@file/jpeg;base64,/9jq' })
//   file: string;
// }
