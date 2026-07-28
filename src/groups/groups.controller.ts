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
import { AcademicTermGuard } from 'src/common/guards/academic-term.guard'
import { CurrentUser } from 'src/common/decorators/current-user.decorator'

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AcademicTermGuard)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.id, dto)
  }

  @Get()
  @UseGuards(JwtAuthGuard, AcademicTermGuard)
  findAll(
    @CurrentUser() user: { id: string },
    @Query('schoolId') schoolId: string,
    @Query('academicTermId') academicTermId: string,
  ) {
    return this.groupsService.findAll(user.id, schoolId, academicTermId)
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { id: string },
    @Param('id') groupId: string,
    @Query('academicTermId') academicTermId: string,
  ) {
    return this.groupsService.findOne(user.id, groupId, academicTermId)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(user.id, groupId, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: string }, @Param('id') groupId: string) {
    return this.groupsService.remove(user.id, groupId)
  }

  @Post(':id/subjects')
  assignSubject(
    @CurrentUser() user: { id: string },
    @Param('id') groupId: string,
    @Body() body: { subjectId: string; academicTermId: string },
  ) {
    return this.groupsService.assignSubject(
      user.id,
      groupId,
      body.subjectId,
      body.academicTermId,
    )
  }

  @Delete(':id/subjects/:subjectTermGroupId')
  removeSubject(
    @CurrentUser() user: { id: string },
    @Param('id') groupId: string,
    @Param('subjectTermGroupId') subjectTermGroupId: string,
  ) {
    return this.groupsService.removeSubjectFromGroup(user.id, groupId, subjectTermGroupId)
  }

  @Delete(':id/students/:studentGroupTermId')
  removeStudent(
    @CurrentUser() user: { id: string },
    @Param('id') groupId: string,
    @Param('studentGroupTermId') studentGroupTermId: string,
  ) {
    return this.groupsService.removeStudentFromGroup(user.id, groupId, studentGroupTermId)
  }
}