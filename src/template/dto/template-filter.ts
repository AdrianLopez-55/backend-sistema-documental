import { ApiProperty } from '@nestjs/swagger';

export class TemplateFilter {
  @ApiProperty({
    example: 'LICENCIA',
    description: 'search template',
    required: false,
  })
  nameTemplate: string;
}
