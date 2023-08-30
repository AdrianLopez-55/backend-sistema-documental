import { IsArray, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendOptionsDto {
  @IsArray()
  @IsNotEmpty()
  employeeCIs: string[];

  @IsString()
  @IsOptional()
  roleName?: string;
}
