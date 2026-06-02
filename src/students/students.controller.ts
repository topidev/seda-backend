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

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateStudentDto) {
    return this.studentsService.create(req.user.id, dto)
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('groupId') groupId?: string,
    @Query('academicTermId') academicTermId?: string,
    @Query('search') search?: string,
    @Query('inactive') inactive?: string,
  ) {
    return this.studentsService.findAll(req.user.id, {
      groupId,
      academicTermId,
      search,
      inactive: inactive === 'true',
    })
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') studentId: string) {
    return this.studentsService.findOne(req.user.id, studentId)
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') studentId: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.update(req.user.id, studentId, dto)
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') studentId: string) {
    return this.studentsService.remove(req.user.id, studentId)
  }

  @Post(':id/assign')
  assignToGroup(
    @Req() req: any,
    @Param('id') studentId: string,
    @Body() body: { groupId: string; academicTermId: string },
  ) {
    return this.studentsService.assignToGroup(
      req.user.id,
      studentId,
      body.groupId,
      body.academicTermId,
    )
  }
}