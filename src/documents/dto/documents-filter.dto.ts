import { ApiProperty } from '@nestjs/swagger';

export class DocumentsFilter {
  @ApiProperty({
    example: 'DOC-0000020-2023',
    description: 'search document by number document',
    required: false,
  })
  numberDocument: string;

  @ApiProperty({
    example: '64e84144561052a834987264',
    description: 'search document by id user',
    required: false,
  })
  userId: string;

  @ApiProperty({
    example: 'Gastos',
    description: 'search document by title',
    required: false,
  })
  title: string;

  @ApiProperty({
    example: 'Costos',
    description: 'search document by documentation type',
    required: false,
  })
  typeName: string;

  @ApiProperty({
    example: 'INICIADO',
    description: 'search document by state document user send',
    required: false,
  })
  stateDocumentUserSend: string;

  @ApiProperty({
    example: 'workflow_A',
    description: 'search document by workflow name',
    required: false,
  })
  nombre: string;

  @ApiProperty({
    example: 'this is description',
    description: 'search document by description workflow',
    required: false,
  })
  descriptionWorkflow: string;

  @ApiProperty({
    example: 'STEP B',
    description: 'search document by step name',
    required: false,
  })
  step: string;

  @ApiProperty({
    example: 'this step is ...',
    description: 'search document by description step',
    required: false,
  })
  descriptionStep: string;

  @ApiProperty({
    example: 1,
    description: 'search number paso in step pasos',
    required: false,
  })
  paso: number;

  @ApiProperty({
    example: 'RECTORADO',
    description: 'search name office in step',
    required: false,
  })
  oficina: string;

  @ApiProperty({
    example: true,
    description: 'search if a paso was completed',
    required: false,
  })
  completado: boolean;

  @ApiProperty({
    example: 2,
    description: 'search paso actual worflow',
    required: false,
  })
  pasoActual: number;

  @ApiProperty({
    example: 'VICERECTORADO',
    description: 'search paso actual worflow',
    required: false,
  })
  oficinaActual: string;

  @ApiProperty({
    example: 'VICERECTORADO',
    description: 'search document from description',
    required: false,
  })
  description: string;

  @ApiProperty({
    example: true,
    description: 'search document is active or not',
    required: false,
  })
  active: boolean;

  @ApiProperty({
    example: '2023',
    description: 'search document for year',
    required: false,
  })
  year: string;
}
