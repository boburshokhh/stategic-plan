import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { DepartmentsService } from './departments.service';
import { DepartmentParticipationService } from './department-participation.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ParticipationQueryDto } from './dto/participation-query.dto';
import { ParticipateSubtasksDto } from './dto/participate-subtasks.dto';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
    private readonly participationService: DepartmentParticipationService,
  ) {}

  @Post()
  @Roles(UserRole.admin)
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get('me/subtasks')
  findMySubtasks(@CurrentUser() user: AuthenticatedUser, @Query() query: ParticipationQueryDto) {
    return this.participationService.findMySubtasks(user, query.year);
  }

  @Post('me/subtasks/participate')
  participate(@CurrentUser() user: AuthenticatedUser, @Body() dto: ParticipateSubtasksDto) {
    return this.participationService.participate(user, dto);
  }

  @Delete('me/subtasks/:subtaskId/participate')
  unparticipate(@CurrentUser() user: AuthenticatedUser, @Param('subtaskId') subtaskId: string) {
    return this.participationService.unparticipate(user, subtaskId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Get(':id/members')
  findMembers(@Param('id') id: string) {
    return this.departmentsService.findMembers(id);
  }

  @Patch(':id')
  @Roles(UserRole.admin)
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.admin)
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
