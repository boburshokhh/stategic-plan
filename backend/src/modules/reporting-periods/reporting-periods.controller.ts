import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReportingPeriodsService } from './reporting-periods.service';
import { CreateReportingPeriodDto } from './dto/create-reporting-period.dto';

@ApiTags('reporting-periods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reporting-periods')
export class ReportingPeriodsController {
  constructor(private readonly periodsService: ReportingPeriodsService) {}

  @Post()
  @Roles(UserRole.admin)
  create(@Body() dto: CreateReportingPeriodDto) {
    return this.periodsService.create(dto);
  }

  @Get()
  findAll(@Query('year') year?: string) {
    return this.periodsService.findAll(year ? Number(year) : undefined);
  }

  @Get('current')
  findCurrent() {
    return this.periodsService.findCurrent();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.periodsService.findOne(id);
  }

  @Post(':id/open-collection')
  @Roles(UserRole.admin)
  openCollection(@Param('id') id: string) {
    return this.periodsService.openCollectionWindow(id);
  }
}
