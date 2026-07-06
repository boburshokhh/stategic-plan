import { ArrayMinSize, IsUUID } from 'class-validator';

/** Новый порядок этапов внутри отчёта — полный список id по возрастанию sortOrder. */
export class ReorderReportItemsDto {
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  itemIds: string[];
}
