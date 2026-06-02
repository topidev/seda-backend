import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CreateGradeCategoryDto } from './dto/create-grade-category.dto';

@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
    constructor(private readonly subjectsService: SubjectsService) {}

    @Post()
    create(@Req() req: any, @Body() dto: CreateSubjectDto) {
        return this.subjectsService.create(req.user.id, dto)
    }

    @Get(':id')
    findOne(@Req() req: any, @Param('id') subjectId: string) {
        return this.subjectsService.findOne(req.user.id, subjectId)
    }

    @Get()
    findAll(@Req() req: any) {
        return this.subjectsService.findAll(req.user.id)
    }

    @Patch(':id')
    update(
        @Req() req: any,
        @Param('id') subjectId: string,
        @Body() dto: UpdateSubjectDto,
    ) {
        return this.subjectsService.update(req.user.id, subjectId, dto)
    }

    @Delete(':id')
    remove(@Req() req: any, @Param('id') subjectId: string) {
        return this.subjectsService.remove(req.user.id, subjectId)
    }

    // --------> Categorias

    @Post(':id/categories')
    createCategory(
        @Req() req: any,
        @Param('id') subjectId: string,
        @Body() dto: CreateGradeCategoryDto,
    ) {
        return this.subjectsService.createCategory(req.user.id, subjectId, dto)
    }

    @Delete(':id/categories/:category')
    removeCategory(
        @Req() req: any,
        @Param('categoryId') categoryId: string,
    ) {
        return this.subjectsService.removeCategory(req.user.id, categoryId)
    }

    // ------------> Grupos

    @Post(':id/assing-groups')
    assignGroups(
        @Req() req: any,
        @Param(':id') subjectId: string,
        @Body() body: {
            groupIds: string[];
            academicTermId: string
        },
    ) {
        return this.subjectsService.assignGroups(
            req.user.id,
            subjectId,
            body.groupIds,
            body.academicTermId,
        )
    }
}
