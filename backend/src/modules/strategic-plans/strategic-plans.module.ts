import { Module } from '@nestjs/common';
import { StrategicPlansService } from './strategic-plans.service';
import { StrategicPlansController } from './strategic-plans.controller';

@Module({
  controllers: [StrategicPlansController],
  providers: [StrategicPlansService],
  exports: [StrategicPlansService],
})
export class StrategicPlansModule {}
