import { ArrayMinSize, IsUUID } from 'class-validator';

export class ParticipateSubtasksDto {
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  subtaskIds: string[];
}
