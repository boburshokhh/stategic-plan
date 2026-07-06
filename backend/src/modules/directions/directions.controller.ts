import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DirectionsService } from './directions.service';
import { CreateDirectionDto } from './dto/create-direction.dto';

@ApiTags('directions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('directions')
export class DirectionsController {
  constructor(private readonly directionsService: DirectionsService) {}

  @Post()
  @Roles(UserRole.admin)
  create(@Body() dto: CreateDirectionDto) {
    return this.directionsService.create(dto);
  }

  @Get()
  findAll(@Query('planId') planId?: string) {
    return this.directionsService.findAll(planId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.directionsService.findOne(id);
  }

  @Get(':id/tree')
  findTree(@Param('id') id: string, @Query('year') year?: string) {
    return this.directionsService.findTree(id, year ? Number(year) : undefined);
  }
}
