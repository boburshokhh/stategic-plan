import { Module } from '@nestjs/common';
import { QuarterlyReportsService } from './quarterly-reports.service';
import { QuarterlyReportsController } from './quarterly-reports.controller';

@Module({
  controllers: [QuarterlyReportsController],
  providers: [QuarterlyReportsService],
  exports: [QuarterlyReportsService],
})
export class QuarterlyReportsModule {}
