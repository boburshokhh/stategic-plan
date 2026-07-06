import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentParticipationService } from './department-participation.service';
import { DepartmentsController } from './departments.controller';

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService, DepartmentParticipationService],
  exports: [DepartmentsService, DepartmentParticipationService],
})
export class DepartmentsModule {}
