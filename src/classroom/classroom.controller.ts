import { Body, Controller, Get, Param, Post, Req, UseGuards, Delete, Patch, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ClassroomService } from './classroom.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { GradeActivityDto } from './dto/grade-activity.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('classroom')
@UseGuards(JwtAuthGuard)
export class ClassroomController {
    constructor(private readonly classroomService: ClassroomService) { }

    // ---------> Las clases
    @Get()
    findMyClasses(@CurrentUser() user: { id: string }) {
        return this.classroomService.findMyClasses(user.id)
    }

    @Get('dashboard/summary')
    getDashboardSummary(@CurrentUser() user: { id: string }) {
        return this.classroomService.getDashboardSummary(user.id)
    }

    @Get(':id')
    findOneClass(@CurrentUser() user: { id: string }, @Param('id') subjectTermGroupId: string) {
        return this.classroomService.findOneClass(user.id, subjectTermGroupId)
    }

    //-----------> Actividades

    @Get(':id/periods/:periodId/activities')
    findActivites(
        @CurrentUser() user: { id: string },
        @Param('id') subjectTermGroupId: string,
        @Param('periodId') periodId: string
    ) {
        return this.classroomService.findActivitiesByPeriod(
            user.id,
            subjectTermGroupId,
            periodId
        )
    }

    @Post(':id/periods/:periodId/activities')
    createActivity(
        @CurrentUser() user: { id: string },
        @Param('id') subjecTermGroupId: string,
        @Param('periodId') periodId: string,
        @Body() dto: CreateActivityDto
    ) {
        return this.classroomService.createActivity(
            user.id,
            subjecTermGroupId,
            periodId,
            dto
        )
    }

    @Delete('activities/:activityId')
    deleteActivity(
        @CurrentUser() user: { id: string },
        @Param('activityId') activityId: string
    ) {
        return this.classroomService.deleteActivity(user.id, activityId)
    }

    // ------------> Calificaciones

    @Post('activities/:activityId/grades')
    gradeActivity(
        @CurrentUser() user: { id: string },
        @Param('activityId') activityId: string,
        @Body() dto: GradeActivityDto
    ) {
        return this.classroomService.gradeActivity(user.id, activityId, dto)
    }

    @Get(':id/periods/:periodId/grades')
    getPeriodGrades(
        @CurrentUser() user: { id: string },
        @Param('id') subjectTermGroupId: string,
        @Param('periodId') periodId: string,
    ) {
        return this.classroomService.getPeriodGrades(
            user.id,
            subjectTermGroupId,
            periodId
        )
    }

    @Patch('grades/:finalGradeId/override')
    overrideFinalGrade(
        @CurrentUser() user: { id: string },
        @Param('finalGradeId') finalGradeId: string,
        @Body() body: {
            finalScore: number;
            overrideReason?: string
        }
    ){
        return this.classroomService.overrideFinalGrade(
            user.id,
            finalGradeId,
            body.finalScore,
            body.overrideReason
        )
    }

    // ---------------> Asistencia

    @Post(':id/attendance')
        saveAttendance(
        @CurrentUser() user: { id: string },
        @Param('id') subjectTermGroupId: string,
        @Body() body: { date: string; records: { studentId: string; status: string }[] },
    ) {
        return this.classroomService.saveAttendance(
            user.id,
            subjectTermGroupId,
            body.date,
            body.records,
        )
    }

    @Get(':id/attendance')
        getAttendanceByDate(
        @CurrentUser() user: { id: string },
        @Param('id') subjectTermGroupId: string,
        @Query('date') date: string,
    ) {
        return this.classroomService.getAttendanceByDate(
            user.id,
            subjectTermGroupId,
            date,
        )
    }

    @Get(':id/attendance/history')
        getAttendanceHistory(
        @CurrentUser() user: { id: string },
        @Param('id') subjectTermGroupId: string,
    ) {
        return this.classroomService.getAttendanceHistory(
            user.id,
            subjectTermGroupId,
        )
    }
}
