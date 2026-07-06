import { Module } from '@nestjs/common';
import { AggregationModule } from '../aggregation/aggregation.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [AggregationModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
