import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { AggregationService } from './aggregation.service';
import { CreateSummaryDto } from './dto/create-summary.dto';

@ApiTags('aggregation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('aggregation/directions/:directionId')
export class AggregationController {
  constructor(private readonly aggregationService: AggregationService) {}

  @Get('completeness')
  getCompleteness(@Param('directionId') directionId: string, @Query('periodId') periodId: string) {
    return this.aggregationService.getCompleteness(directionId, periodId);
  }

  @Post('summary')
  @Roles(UserRole.admin, UserRole.direction_head)
  upsertSummary(@Param('directionId') directionId: string, @Body() dto: CreateSummaryDto) {
    return this.aggregationService.upsertSummary(directionId, dto);
  }

  @Get('summary')
  getSummary(@Param('directionId') directionId: string, @Query('periodId') periodId: string) {
    return this.aggregationService.getSummary(directionId, periodId);
  }

  @Post('summary/:id/approve')
  @Roles(UserRole.admin, UserRole.direction_head)
  approveSummary(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.aggregationService.approveSummary(id, user);
  }
}
