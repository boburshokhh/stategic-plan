import { Controller, Get, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ImportService } from './import.service';
import { normalizeUploadedFileName } from '../quarterly-reports/normalize-uploaded-file-name.util';

@ApiTags('import')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Get('status')
  @Roles(UserRole.admin)
  getStatus() {
    return this.importService.getStatus();
  }

  @Post('excel')
  @Roles(UserRole.admin)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  importExcel(@UploadedFile() file: Express.Multer.File) {
    return this.importService.importFromBuffer(file.buffer, normalizeUploadedFileName(file.originalname));
  }
}
