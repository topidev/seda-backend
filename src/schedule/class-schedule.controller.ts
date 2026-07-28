import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ClassScheduleService } from './class-schedule.service'
import { CreateScheduleDto } from './dto/create-schedule.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ClassScheduleController {
  constructor(private readonly scheduleService: ClassScheduleService) {}

  @Post('classes/:subjectTermGroupId')
  create(
    @CurrentUser() user: { id: string },
    @Param('subjectTermGroupId') subjectTermGroupId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.scheduleService.create(user.id, subjectTermGroupId, dto)
  }

  @Get('classes/:subjectTermGroupId')
  findByClass(
    @CurrentUser() user: { id: string },
    @Param('subjectTermGroupId') subjectTermGroupId: string,
  ) {
    return this.scheduleService.findByClass(user.id, subjectTermGroupId)
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: string }, @Param('id') scheduleId: string) {
    return this.scheduleService.remove(user.id, scheduleId)
  }

  @Get('weekly')
  getWeeklyActivities(
    @CurrentUser() user: { id: string },
    @Query('weekOffset') weekOffset?: string,
  ) {
    return this.scheduleService.getWeeklyActivities(
      user.id,
      weekOffset ? parseInt(weekOffset) : 0,
    )
  }

  @Get('today')
  getTodayActivities(@CurrentUser() user: { id: string }) {
    return this.scheduleService.getTodayActivities(user.id)
  }
}