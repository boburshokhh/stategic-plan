import { Module } from '@nestjs/common';
import { ReportingPeriodsService } from './reporting-periods.service';
import { ReportingPeriodsController } from './reporting-periods.controller';

@Module({
  controllers: [ReportingPeriodsController],
  providers: [ReportingPeriodsService],
  exports: [ReportingPeriodsService],
})
export class ReportingPeriodsModule {}
