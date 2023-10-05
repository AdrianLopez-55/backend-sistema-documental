import { ApiProperty } from '@nestjs/swagger';

export class WorkflowFilter {
  @ApiProperty({
    example: 'workflow A',
    description: 'search workflow by name',
    required: false,
  })
  nombre: string;

  @ApiProperty({
    example: 'workflow para ...',
    description: 'search workflow by description',
    required: false,
  })
  descriptionWorkflow: string;

  @ApiProperty({
    example: 'step A',
    description: 'search workflow by step name',
    required: false,
  })
  step: string;

  @ApiProperty({
    example: 'step para ...',
    description: 'search workflow by description step',
    required: false,
  })
  descriptionStep: string;

  @ApiProperty({
    example: 1,
    description: 'search step by number paso',
    required: false,
  })
  paso: number;

  @ApiProperty({
    example: 'RECTORADO',
    description: 'search step by oficina',
    required: false,
  })
  oficina: string;
}
