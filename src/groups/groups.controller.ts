import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common'
import { GroupsService } from './groups.service'
import { CreateGroupDto } from './dto/create-group.dto'
import { UpdateGroupDto } from './dto/update-group.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(req.user.id, dto)
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('schoolId') schoolId: string,
    @Query('academicTermId') academicTermId: string,
  ) {
    return this.groupsService.findAll(req.user.id, schoolId, academicTermId)
  }

  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id') groupId: string,
    @Query('academicTermId') academicTermId: string,
  ) {
    return this.groupsService.findOne(req.user.id, groupId, academicTermId)
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(req.user.id, groupId, dto)
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') groupId: string) {
    return this.groupsService.remove(req.user.id, groupId)
  }

  @Post(':id/subjects')
  assignSubject(
    @Req() req: any,
    @Param('id') groupId: string,
    @Body() body: { subjectId: string; academicTermId: string },
  ) {
    return this.groupsService.assignSubject(
      req.user.id,
      groupId,
      body.subjectId,
      body.academicTermId,
    )
  }
}