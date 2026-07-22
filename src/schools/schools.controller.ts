import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { CreateTermDto } from './dto/create-term.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('schools')
@UseGuards(JwtAuthGuard)
export class SchoolsController {
    constructor(private readonly schoolsService: SchoolsService) {}

    // --------- Schools ---------------

    @Post()
    create(@CurrentUser() user: { id: string }, @Body() dto: CreateSchoolDto) {
        // const teacher = req.user as { id: string }
        return this.schoolsService.create(user.id, dto)
    }

    @Get()
    findAll(@CurrentUser() user: { id: string }) {
        // const teacher = req.user as { id: string }
        return this.schoolsService.findAll(user.id)
    }

    @Get(':id')
    findOne(@CurrentUser() user: { id: string }, @Param('id') schoolId: string) {
        // const teacher = req.user as { id: string }
        return this.schoolsService.findOne(user.id, schoolId)
    }

    @Patch(':id')
    update(
        @CurrentUser() user: { id: string },
        @Param('id') schoolId: string,
        @Body() dto: UpdateSchoolDto,
    ) {
        // const teacher = req.user as { id: string }
        return this.schoolsService.update(user.id, schoolId, dto)
    }

    @Delete(':id')
    remove(
        @CurrentUser() user: { id: string },
        @Param('id') schoolId: string
    ) {
        // const teacher = req.user as { id: string }
        return this.schoolsService.remove(user.id, schoolId)
    }


    // -------------------- Terms -------------------------

    @Post(':id/terms')
    createTerm(
        @CurrentUser() user: { id: string },
        @Param('id') schoolId: string,
        @Body() dto: CreateTermDto
    ) {
        // const teacher = req.user as { id: string }
        return this.schoolsService.createTerm(user.id, schoolId, dto)
    }

    @Get(':id/terms')
    findTerms(
        @CurrentUser() user: { id: string },
        @Param('id') schoolId: string
    ) {
        // const teacher = req.user as { id: string }
        return this.schoolsService.findTerms(user.id, schoolId)
    }

    @Patch(':id/terms/:termId/toggle-close')
    toggleTermClose(
        @CurrentUser() user: { id: string },
        @Param('id') schoolId: string,
        @Param('termId') termId: string,
        @Body() body: { active: boolean },
    ) {
        return this.schoolsService.toggleTermClose(
            user.id,
            schoolId,
            termId,
            body.active
        )
    }

    
}
