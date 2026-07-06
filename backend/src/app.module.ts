import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { StrategicPlansModule } from './modules/strategic-plans/strategic-plans.module';
import { DirectionsModule } from './modules/directions/directions.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { SubtasksModule } from './modules/subtasks/subtasks.module';
import { ReportingPeriodsModule } from './modules/reporting-periods/reporting-periods.module';
import { QuarterlyReportsModule } from './modules/quarterly-reports/quarterly-reports.module';
import { AggregationModule } from './modules/aggregation/aggregation.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ImportModule } from './modules/import/import.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    StrategicPlansModule,
    DirectionsModule,
    TasksModule,
    SubtasksModule,
    ReportingPeriodsModule,
    QuarterlyReportsModule,
    AggregationModule,
    DashboardModule,
    ImportModule,
  ],
})
export class AppModule {}
