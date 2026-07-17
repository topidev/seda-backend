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
import { StudentsService } from './students.service'
import { CreateStudentDto } from './dto/create-student.dto'
import { UpdateStudentDto } from './dto/update-student.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AcademicTermGuard } from 'src/common/guards/academic-term.guard'
import { CurrentUser } from 'src/common/decorators/current-user.decorator'

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AcademicTermGuard)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateStudentDto) {
    return this.studentsService.create(user.id, dto)
  }

  @Get()
  findAll(
    @CurrentUser() user: { id: string },
    @Query('groupId') groupId?: string,
    @Query('academicTermId') academicTermId?: string,
    @Query('search') search?: string,
    @Query('inactive') inactive?: string,
  ) {
    return this.studentsService.findAll(user.id, {
      groupId,
      academicTermId,
      search,
      inactive: inactive === 'true',
    })
  }

  @Get(':id')
  findOne(@CurrentUser() user: { id: string }, @Param('id') studentId: string) {
    return this.studentsService.findOne(user.id, studentId)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') studentId: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(user.id, studentId, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: { id: string }, @Param('id') studentId: string) {
    return this.studentsService.remove(user.id, studentId)
  }

  @Post(':id/assign')
  assignToGroup(
    @CurrentUser() user: { id: string },
    @Param('id') studentId: string,
    @Body() body: { groupId: string; academicTermId: string },
  ) {
    return this.studentsService.assignToGroup(
      user.id,
      studentId,
      body.groupId,
      body.academicTermId,
    )
  }

  @Get(':id/subjects/:subjectTermGroupId/summary')
  getSubjectSummary(
    @CurrentUser() user: { id: string },
    @Param('id') studentId: string,
    @Param('subjectTermGroupId') subjectTermGroupId: string,
    @Query('periodId') periodId: string,
  ) {
    return this.studentsService.getSubjectSummary(
      user.id,
      studentId,
      subjectTermGroupId,
      periodId,
    )
  }

  @Get(':id/subjects/:subjectTermGroupId/full-summary')
  getFullSubjectSummary(
    @CurrentUser() user: { id: string },
    @Param('id') studentId: string,
    @Param('subjectTermGroupId') subjectTermGroupId: string,
  ) {
    return this.studentsService.getFullSubjectSummary(
      user.id,
      studentId,
      subjectTermGroupId
    )
  }

}