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
import { EventsService } from './events.service'
import { CreateEventDto } from './dto/create-event.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.create(user.id, dto)
  }

  @Get('upcoming')
  findUpcoming(
    @CurrentUser() user: { id: string },
    @Query('days') days?: string,
  ) {
    return this.eventsService.findUpcoming(
      user.id,
      days ? parseInt(days) : 30,
    )
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { id: string },
    @Param('id') eventId: string,
  ) {
    return this.eventsService.remove(user.id, eventId)
  }

  @Get()
  findAll(
    @CurrentUser() user: { id: string },
    @Query('schoolId') schoolId?: string,
  ) {
    return this.eventsService.findAll(user.id, schoolId)
  }

}