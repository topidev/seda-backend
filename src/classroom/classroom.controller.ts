import { Body, Controller, Get, Param, Post, Req, UseGuards, Delete, Patch } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ClassroomService } from './classroom.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { GradeActivityDto } from './dto/grade-activity.dto';

@Controller('classroom')
@UseGuards(JwtAuthGuard)
export class ClassroomController {
    constructor(private readonly classroomService: ClassroomService) { }

    // ---------> Las clases
    @Get()
    findMyClasses(@Req() req: any) {
        return this.classroomService.findMyClasses(req.user.id)
    }

    @Get(':id')
    findOneClass(@Req() req: any, @Param('id') subjectTermGroupId: string) {
        return this.classroomService.findOneClass(req.user.id, subjectTermGroupId)
    }

    //-----------> Actividades

    @Get(':id/periods/:periodId/activities')
    findActivites(
        @Req() req: any,
        @Param('id') subjectTermGroupId: string,
        @Param('periodId') periodId: string
    ) {
        return this.classroomService.findActivitiesByPeriod(
            req.user.id,
            subjectTermGroupId,
            periodId
        )
    }

    @Post(':id/periods/:periodId/activities')
    createActivity(
        @Req() req: any,
        @Param('id') subjecTermGroupId: string,
        @Param('periodId') periodId: string,
        @Body() dto: CreateActivityDto
    ) {
        return this.classroomService.createActivity(
            req.user.id,
            subjecTermGroupId,
            periodId,
            dto
        )
    }

    @Delete('activities/:activityId')
    deleteActivity(
        @Req() req: any,
        @Param('activityId') activityId: string
    ) {
        return this.classroomService.deleteActivity(req.user.id, activityId)
    }

    // ------------> Calificaciones

    @Post('activities/:activityId/grades')
    gradeActivity(
        @Req() req: any,
        @Param('activityId') activityId: string,
        @Body() dto: GradeActivityDto
    ) {
        return this.classroomService.gradeActivity(req.user.id, activityId, dto)
    }

    @Get(':id/periods/:periodId/grades')
    getPeriodGrades(
        @Req() req: any,
        @Param('id') subjectTermGroupId: string,
        @Param('periodId') periodId: string,
    ) {
        return this.classroomService.getPeriodGrades(
            req.user.id,
            subjectTermGroupId,
            periodId
        )
    }

    @Patch('grades/:finalGradeId/override')
    overrideFinalGrade(
        @Req() req: any,
        @Param('finalGradeId') finalGradeId: string,
        @Body() body: {
            finalScore: number;
            overrideReason?: string
        }
    ){
        return this.classroomService.overrideFinalGrade(
            req.user.id,
            finalGradeId,
            body.finalScore,
            body.overrideReason
        )
    }
}
