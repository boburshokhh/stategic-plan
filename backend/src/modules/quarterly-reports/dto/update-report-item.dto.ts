import { PartialType } from '@nestjs/swagger';
import { CreateReportItemDto } from './create-report-item.dto';

export class UpdateReportItemDto extends PartialType(CreateReportItemDto) {}
