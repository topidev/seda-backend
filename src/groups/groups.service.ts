import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateGroupDto } from './dto/create-group.dto'
import { UpdateGroupDto } from './dto/update-group.dto'

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(teacherId: string, dto: CreateGroupDto) {
    // Verifica que la escuela pertenece al maestro
    const school = await this.prisma.school.findFirst({
      where: {
        id: dto.schoolId,
        active: true,
        teachers: {
          some: { teacherId, active: true },
        },
      },
    })

    if (!school) throw new NotFoundException('Escuela no encontrada')

    // Crea el grupo y sus SubjectTermGroups en una sola transacción
    return this.prisma.$transaction(async (tx) => {
      // Crea o recupera el grupo
      // upsert porque el grupo 2°A puede ya existir de ciclos anteriores
      const group = await tx.group.upsert({
        where: {
          schoolId_grade_letter: {
            schoolId: dto.schoolId,
            grade: dto.grade,
            letter: dto.letter,
          },
        },
        update: { active: true },
        create: {
          schoolId: dto.schoolId,
          grade: dto.grade,
          letter: dto.letter,
        },
      })

      // Si vienen materias, crea los SubjectTermGroups
      if (dto.subjectIds && dto.subjectIds.length > 0) {
        await tx.subjectTermGroup.createMany({
          data: dto.subjectIds.map((subjectId) => ({
            subjectId,
            groupId: group.id,
            academicTermId: dto.academicTermId,
          })),
          skipDuplicates: true,
        })
      }

      return tx.group.findUnique({
        where: { id: group.id },
        include: {
          subjectTermGroups: {
            where: {
              academicTermId: dto.academicTermId,
              active: true,
            },
            include: {
              subject: true,
            },
          },
        },
      })
    })
  }

  async findAll(teacherId: string, schoolId: string, academicTermId: string) {
    // Verifica acceso a la escuela
    const school = await this.prisma.school.findFirst({
      where: {
        id: schoolId,
        teachers: { some: { teacherId, active: true } },
      },
    })

    if (!school) throw new NotFoundException('Escuela no encontrada')

    return this.prisma.group.findMany({
      where: {
        schoolId,
        active: true,
      },
      include: {
        subjectTermGroups: {
          where: { academicTermId, active: true },
          include: { subject: true },
        },
        studentGroupTerms: {
          where: { academicTermId, active: true },
        },
      },
      orderBy: [{ grade: 'asc' }, { letter: 'asc' }],
    })
  }

  async findOne(teacherId: string, groupId: string, academicTermId: string) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        active: true,
        school: {
          teachers: { some: { teacherId, active: true } },
        },
      },
      include: {
        school: true,
        subjectTermGroups: {
          where: { academicTermId, active: true },
          include: { subject: true },
        },
        studentGroupTerms: {
          where: { academicTermId, active: true },
          include: { student: true },
        },
      },
    })

    if (!group) throw new NotFoundException('Grupo no encontrado')

    return group
  }

  async update(teacherId: string, groupId: string, dto: UpdateGroupDto) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        school: {
          teachers: { some: { teacherId, active: true } },
        },
      },
    })

    if (!group) throw new NotFoundException('Grupo no encontrado')

    return this.prisma.group.update({
      where: { id: groupId },
      data: dto,
    })
  }

  async remove(teacherId: string, groupId: string) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        school: {
          teachers: { some: { teacherId, active: true } },
        },
      },
    })

    if (!group) throw new NotFoundException('Grupo no encontrado')

    return this.prisma.group.update({
      where: { id: groupId },
      data: { active: false },
    })
  }


  async assignSubject(
    teacherId: string,
    groupId: string,
    subjectId: string,
    academicTermId: string,
  ) {
    // Verifica que el grupo pertenece al maestro
    await this.findOne(teacherId, groupId, academicTermId)

    // Verifica que la materia pertenece al maestro
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, teacherId, active: true },
    })

    if (!subject) throw new NotFoundException('Materia no encontrada')

    return this.prisma.subjectTermGroup.upsert({
      where: {
        subjectId_groupId_academicTermId: {
          subjectId,
          groupId,
          academicTermId,
        },
      },
      update: { active: true },
      create: { subjectId, groupId, academicTermId },
    })
  }

  async removeSubjectFromGroup(
    teacherId: string,
    groupId: string,
    subjectTermGroupId: string,
  ) {
    const stg = await this.prisma.subjectTermGroup.findFirst({
      where: {
        id: subjectTermGroupId,
        groupId,
        subject: { teacherId },
      },
    })

    if (!stg) throw new NotFoundException('Asignación no encontrada')

    return this.prisma.subjectTermGroup.update({
      where: { id: subjectTermGroupId },
      data: { active: false },
    })
  }

  async removeStudentFromGroup(
    teacherId: string,
    groupId: string,
    studentGroupTermId: string,
  ) {
    const sgt = await this.prisma.studentGroupTerm.findFirst({
      where: {
        id: studentGroupTermId,
        groupId,
        student: { teacherId },
      },
    })

    if (!sgt) throw new NotFoundException('Asignación no encontrada')

    return this.prisma.studentGroupTerm.update({
      where: { id: studentGroupTermId },
      data: { active: false },
    })
  }
}