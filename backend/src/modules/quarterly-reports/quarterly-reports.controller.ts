import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { QuarterlyReportsService } from './quarterly-reports.service';
import { UpsertReportDto } from './dto/upsert-report.dto';
import { CreateReportItemDto } from './dto/create-report-item.dto';
import { UpdateReportItemDto } from './dto/update-report-item.dto';
import { ReorderReportItemsDto } from './dto/reorder-report-items.dto';
import { AssignReportItemMembersDto } from './dto/assign-report-item-members.dto';
import { attachmentFileFilter, MAX_ATTACHMENT_SIZE_BYTES } from './attachment-file-filter.util';

const attachmentInterceptorOptions = {
  limits: { fileSize: MAX_ATTACHMENT_SIZE_BYTES },
  fileFilter: attachmentFileFilter,
};

@ApiTags('quarterly-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class QuarterlyReportsController {
  constructor(private readonly reportsService: QuarterlyReportsService) {}

  @Get('my')
  findMy(@CurrentUser() user: AuthenticatedUser, @Query('periodId') periodId?: string) {
    return this.reportsService.findMyReports(user, periodId);
  }

  @Get('by-subtask/:subtaskId')
  findBySubtask(@Param('subtaskId') subtaskId: string, @Query('periodId') periodId?: string) {
    return this.reportsService.findBySubtask(subtaskId, periodId);
  }

  @Post('ensure')
  ensureMy(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { subtaskId: string; periodId: string },
  ) {
    return this.reportsService.ensureMyReport(user, body.subtaskId, body.periodId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpsertReportDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.update(id, dto, user);
  }

  @Post(':id/review')
  review(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.review(id, user);
  }

  // ---------------------------------------------------------------------
  // Этапы отчёта
  // ---------------------------------------------------------------------

  @Post(':id/items')
  createItem(
    @Param('id') id: string,
    @Body() dto: CreateReportItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.createItem(id, dto, user);
  }

  @Put(':id/items/reorder')
  reorderItems(
    @Param('id') id: string,
    @Body() dto: ReorderReportItemsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.reorderItems(id, dto, user);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateReportItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.updateItem(id, itemId, dto, user);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.removeItem(id, itemId, user);
  }

  @Put(':id/items/:itemId/assignees')
  assignItemMembers(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: AssignReportItemMembersDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.assignItemMembers(id, itemId, dto, user);
  }

  // ---------------------------------------------------------------------
  // Вложения
  // ---------------------------------------------------------------------

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file', attachmentInterceptorOptions))
  uploadReportAttachment(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('fileName') fileName: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.addAttachment(id, null, file, user, fileName);
  }

  @Post(':id/items/:itemId/attachments')
  @UseInterceptors(FileInterceptor('file', attachmentInterceptorOptions))
  uploadItemAttachment(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('fileName') fileName: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.addAttachment(id, itemId, file, user, fileName);
  }

  @Get(':id/attachments/:attachmentId')
  async downloadAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ) {
    const attachment = await this.reportsService.getAttachmentForDownload(id, attachmentId);
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`);
    const stream = createReadStream(attachment.storagePath);
    stream.on('error', () => {
      throw new NotFoundException('Файл вложения не найден на сервере');
    });
    stream.pipe(res);
  }

  @Delete(':id/attachments/:attachmentId')
  removeAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.removeAttachment(id, attachmentId, user);
  }
}
