import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CreateGradeCategoryDto } from './dto/create-grade-category.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
    constructor(private readonly subjectsService: SubjectsService) {}

    @Post()
    create(@CurrentUser() user: { id: string }, @Body() dto: CreateSubjectDto) {
        return this.subjectsService.create(user.id, dto)
    }

    @Get(':id')
    findOne(@CurrentUser() user: { id: string }, @Param('id') subjectId: string) {
        return this.subjectsService.findOne(user.id, subjectId)
    }

    @Get()
    findAll(@CurrentUser() user: { id: string }) {
        return this.subjectsService.findAll(user.id)
    }

    @Patch(':id')
    update(
        @CurrentUser() user: { id: string },
        @Param('id') subjectId: string,
        @Body() dto: UpdateSubjectDto,
    ) {
        return this.subjectsService.update(user.id, subjectId, dto)
    }

    @Delete(':id')
    remove(@CurrentUser() user: { id: string }, @Param('id') subjectId: string) {
        return this.subjectsService.remove(user.id, subjectId)
    }

    // --------> Categorias

    @Post(':id/categories')
    createCategory(
        @CurrentUser() user: { id: string },
        @Param('id') subjectId: string,
        @Body() dto: CreateGradeCategoryDto,
    ) {
        return this.subjectsService.createCategory(user.id, subjectId, dto)
    }

    @Delete(':id/categories/:categoryId')
    removeCategory(
        @CurrentUser() user: { id: string },
        @Param('categoryId') categoryId: string,
    ) {
        return this.subjectsService.removeCategory(user.id, categoryId)
    }

    // ------------> Grupos

    @Post(':id/assing-groups')
    assignGroups(
        @CurrentUser() user: { id: string },
        @Param(':id') subjectId: string,
        @Body() body: {
            groupIds: string[];
            academicTermId: string
        },
    ) {
        return this.subjectsService.assignGroups(
            user.id,
            subjectId,
            body.groupIds,
            body.academicTermId,
        )
    }
}
