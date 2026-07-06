import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StrategicPlansService } from './strategic-plans.service';
import { CreateStrategicPlanDto } from './dto/create-strategic-plan.dto';

@ApiTags('strategic-plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plans')
export class StrategicPlansController {
  constructor(private readonly plansService: StrategicPlansService) {}

  @Post()
  @Roles(UserRole.admin)
  create(@Body() dto: CreateStrategicPlanDto) {
    return this.plansService.create(dto);
  }

  @Get()
  findAll() {
    return this.plansService.findAll();
  }

  @Get('active')
  findActive() {
    return this.plansService.findActiveWithTree();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }
}
