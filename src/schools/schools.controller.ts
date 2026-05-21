import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { CreateTermDto } from './dto/create-term.dto';

@Controller('schools')
@UseGuards(JwtAuthGuard)
export class SchoolsController {
    constructor(private readonly schoolsService: SchoolsService) {}

    // --------- Schools ---------------

    @Post()
    create(@Req() req: any, @Body() dto: CreateSchoolDto) {
        const teacher = req.user as { id: string }
        return this.schoolsService.create(teacher.id, dto)
    }

    @Get()
    findAll(@Req() req: any) {
        const teacher = req.user as { id: string }
        return this.schoolsService.findAll(teacher.id)
    }

    @Get(':id')
    findOne(@Req() req: any, @Param('id') schoolId: string) {
        const teacher = req.user as { id: string }
        return this.schoolsService.findOne(teacher.id, schoolId)
    }

    @Patch(':id')
    update(
        @Req() req: any,
        @Param('id') schoolId: string,
        @Body() dto: UpdateSchoolDto,
    ) {
        const teacher = req.user as { id: string }
        return this.schoolsService.update(teacher.id, schoolId, dto)
    }

    @Delete(':id')
    remove(
        @Req() req: any,
        @Param('id') schoolId: string
    ) {
        const teacher = req.user as { id: string }
        return this.schoolsService.remove(teacher.id, schoolId)
    }


    // -------------------- Terms -------------------------

    @Post(':id/terms')
    createTerm(
        @Req() req: any,
        @Param('id') schoolId: string,
        @Body() dto: CreateTermDto
    ) {
        const teacher = req.user as { id: string }
        console.log('req.user: ', req.user)
        console.log('SchoolId del param: ', schoolId)
        return this.schoolsService.createTerm(teacher.id, schoolId, dto)
    }

    @Get(':id/terms')
    findTerms(
        @Req() req: any,
        @Param('id') schoolId: string
    ) {
        const teacher = req.user as { id: string }
        return this.schoolsService.findTerms(teacher.id, schoolId)
    }

    
}
