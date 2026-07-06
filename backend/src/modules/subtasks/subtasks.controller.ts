import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SubtasksService } from './subtasks.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { AssignDepartmentsDto } from './dto/assign-departments.dto';

@ApiTags('subtasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subtasks')
export class SubtasksController {
  constructor(private readonly subtasksService: SubtasksService) {}

  @Post()
  @Roles(UserRole.admin, UserRole.direction_head)
  create(@Body() dto: CreateSubtaskDto) {
    return this.subtasksService.create(dto);
  }

  @Get()
  findAll(@Query('taskId') taskId?: string, @Query('year') year?: string) {
    return this.subtasksService.findAll(taskId, year ? Number(year) : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subtasksService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin, UserRole.direction_head)
  update(@Param('id') id: string, @Body() dto: UpdateSubtaskDto) {
    return this.subtasksService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.admin)
  remove(@Param('id') id: string) {
    return this.subtasksService.remove(id);
  }

  @Put(':id/departments')
  @Roles(UserRole.admin, UserRole.direction_head)
  assignDepartments(@Param('id') id: string, @Body() dto: AssignDepartmentsDto) {
    return this.subtasksService.assignDepartments(id, dto);
  }
}
