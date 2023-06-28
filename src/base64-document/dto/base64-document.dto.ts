import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsObject, IsString, ValidateNested } from "class-validator";


export class Base64DocumentFileDataDTO {
	@ApiProperty({example: 'djfieona343hdohfnajdsjf', description: 'upload the base64 archive'})
	@IsString()
	readonly base64: string

	@ApiProperty({example: 'image/jpg', description: 'must be the type of the file'})
	@IsString()
	readonly mime: string
}

export class Base64DocumentDto {
	@ApiProperty({
		example: {
		  mime: 'image/jpeg',
		  base64: 'jfsdajfdsjr3rephfa9e8h49'
		},
	})
	
	@Type(() => Base64DocumentFileDataDTO)
	readonly file: Base64DocumentFileDataDTO

}
