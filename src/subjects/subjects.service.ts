import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateSubjectDto } from './dto/create-subject.dto'
import { UpdateSubjectDto } from './dto/update-subject.dto'
import { CreateGradeCategoryDto } from './dto/create-grade-category.dto'

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────
  // SUBJECTS
  // ─────────────────────────────────────────

  async create(teacherId: string, dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        teacherId,
        name: dto.name,
      },
    })
  }

  async findAll(teacherId: string) {
    return this.prisma.subject.findMany({
      where: { teacherId, active: true },
      include: {
        gradeCategories: true,
        _count: {
          select: { subjectTermGroups: true },
        },
      },
      orderBy: { name: 'asc' },
    })
  }

  async findOne(teacherId: string, subjectId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, teacherId, active: true },
      include: {
        gradeCategories: true,
        _count: {
          select: { subjectTermGroups: true },
        },
        subjectTermGroups: {
          where: { active: true },
          include: {
            group: true,
            academicTerm: true,
          },
        },
      },
    })

    if (!subject) throw new NotFoundException('Materia no encontrada')

    return subject
  }

  async update(teacherId: string, subjectId: string, dto: UpdateSubjectDto) {
    await this.findOne(teacherId, subjectId)

    return this.prisma.subject.update({
      where: { id: subjectId },
      data: dto,
    })
  }

  async remove(teacherId: string, subjectId: string) {
    await this.findOne(teacherId, subjectId)

    return this.prisma.subject.update({
      where: { id: subjectId },
      data: { active: false },
    })
  }

  // ─────────────────────────────────────────
  // GRADE CATEGORIES
  // ─────────────────────────────────────────

  async createCategory(
    teacherId: string,
    subjectId: string,
    dto: CreateGradeCategoryDto,
  ) {
    await this.findOne(teacherId, subjectId)

    // Verifica que la suma de porcentajes no supere 100
    const categories = await this.prisma.gradeCategory.findMany({
      where: { subjectId },
    })

    const currentTotal = categories.reduce((sum, c) => sum + c.percentage, 0)

    if (currentTotal + dto.percentage > 100) {
      throw new BadRequestException(
        `La suma de porcentajes supera 100%. Disponible: ${100 - currentTotal}%`,
      )
    }

    return this.prisma.gradeCategory.create({
      data: {
        subjectId,
        name: dto.name,
        percentage: dto.percentage,
      },
    })
  }

  async removeCategory(teacherId: string, categoryId: string) {
    const category = await this.prisma.gradeCategory.findFirst({
      where: {
        id: categoryId,
        subject: { teacherId },
      },
    })

    if (!category) throw new NotFoundException('Categoría no encontrada')

    return this.prisma.gradeCategory.delete({
      where: { id: categoryId },
    })
  }

  // ─────────────────────────────────────────
  // SUBJECT TERM GROUPS (asignación a grupos)
  // ─────────────────────────────────────────

  async assignGroups(
    teacherId: string,
    subjectId: string,
    groupIds: string[],
    academicTermId: string,
  ) {
    await this.findOne(teacherId, subjectId)

    // Crea los SubjectTermGroup para cada grupo seleccionado
    // skipDuplicates evita error si ya existe la asignación
    await this.prisma.subjectTermGroup.createMany({
      data: groupIds.map((groupId) => ({
        subjectId,
        groupId,
        academicTermId,
      })),
      skipDuplicates: true,
    })

    return this.findOne(teacherId, subjectId)
  }
}