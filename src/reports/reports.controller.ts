import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'
import { ReportsService } from './reports.service'
import { CreateReportDto } from './dto/create-report.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateReportDto) {
    return this.reportsService.create(user.id, dto)
  }

  @Get('students/:studentId')
  findByStudent(
    @CurrentUser() user: { id: string },
    @Param('studentId') studentId: string,
  ) {
    return this.reportsService.findByStudent(user.id, studentId)
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: string }, @Param('id') reportId: string) {
    return this.reportsService.remove(user.id, reportId)
  }
}