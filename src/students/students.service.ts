import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateStudentDto } from './dto/create-student.dto'
import { UpdateStudentDto } from './dto/update-student.dto'

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  // ----------> Alumnos

  async create(teacherId: string, dto: CreateStudentDto) {
    // Verifica que el grupo pertenece al maestro
    const group = await this.prisma.group.findFirst({
      where: {
        id: dto.groupId,
        school: {
          teachers: { some: { teacherId, active: true } },
        },
      },
    })

    if (!group) throw new NotFoundException('Grupo no encontrado')

    // Crea el alumno y lo asigna al grupo en una transacción
    return this.prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          teacherId,
          name: dto.name,
          firstLastName: dto.firstLastName,
          secondLastName: dto.secondLastName,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
          tutorName: dto.tutorName,
          tutorPhone: dto.tutorPhone,
        },
      })

      await tx.studentGroupTerm.create({
        data: {
          studentId: student.id,
          groupId: dto.groupId,
          academicTermId: dto.academicTermId,
        },
      })

      return student
    })
  }

  async findAll(teacherId: string, filters: {
    groupId?: string
    academicTermId?: string
    search?: string
    inactive?: boolean
  }) {
    return this.prisma.student.findMany({
      where: {
        teacherId,
        deletedAt: filters.inactive ? { not: null } : null,
        ...(filters.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { firstLastName: { contains: filters.search, mode: 'insensitive' } },
            { secondLastName: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
        ...(filters.groupId && {
          groupTerms: {
            some: {
              groupId: filters.groupId,
              academicTermId: filters.academicTermId,
              active: true,
            },
          },
        }),
      },
      include: {
        groupTerms: {
          where: { active: true },
          include: {
            group: true,
          },
        },
      },
      orderBy: [{ firstLastName: 'asc' }, { name: 'asc' }],
    })
  }

  async findOne(teacherId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        teacherId,
        deletedAt: null,
      },
      include: {
        groupTerms: {
          where: { active: true },
          include: { 
            group: {
              include: {
                subjectTermGroups: {
                  where: { active: true },
                  include: {
                    subject: true
                  },
                },
              },
            } 
          },
        },
      },
    })

    if (!student) throw new NotFoundException('Alumno no encontrado')

    return student
  }

  async update(teacherId: string, studentId: string, dto: UpdateStudentDto) {
    await this.findOne(teacherId, studentId)

    return this.prisma.student.update({
      where: { id: studentId },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
    })
  }

  async remove(teacherId: string, studentId: string) {
    await this.findOne(teacherId, studentId)

    return this.prisma.student.update({
      where: { id: studentId },
      data: { deletedAt: new Date() },
    })
  }

  // -----> Asignar un Alumno ya existente a un ggrupo

  async assignToGroup(
    teacherId: string,
    studentId: string,
    groupId: string,
    academicTermId: string,
  ) {
    await this.findOne(teacherId, studentId)

    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        school: {
          teachers: { some: { teacherId, active: true } },
        },
      },
    })

    if (!group) throw new NotFoundException('Grupo no encontrado')

    return this.prisma.studentGroupTerm.upsert({
      where: {
        studentId_groupId_academicTermId: {
          studentId,
          groupId,
          academicTermId,
        },
      },
      update: { active: true },
      create: { studentId, groupId, academicTermId },
    })
  }

  async getSubjectSummary(
    teacherId: string,
    studentId: string,
    subjectTermGroupId: string,
    periodId: string,
  ) {
    // Verifica que el alumno pertenece al maestro
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, teacherId, deletedAt: null },
    })

    if (!student) throw new NotFoundException('Alumno no encontrado')

    // Verifica que el SubjectTermGroup pertenece al maestro
    const stg = await this.prisma.subjectTermGroup.findFirst({
      where: {
        id: subjectTermGroupId,
        subject: { teacherId },
      },
      include: { subject: true },
    })

    if (!stg) throw new NotFoundException('Materia no encontrada')

    // Calificación bimestral
    const finalGrade = await this.prisma.finalGrade.findUnique({
      where: {
        studentId_subjectTermGroupId_periodId: {
          studentId,
          subjectTermGroupId,
          periodId,
        },
      },
    })

    // Actividades del bimestre con la calificación del alumno
    const activities = await this.prisma.activity.findMany({
      where: {
        subjectId: stg.subjectId,
        periodId,
        deletedAt: null,
      },
      include: {
        category: true,
        grades: {
          where: { 
            studentId,
            subjectTermGroupId
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const activitiesWithGrade = activities.map((a) => ({
      id: a.id,
      title: a.title,
      categoryName: a.category.name,
      categoryPercentage: a.category.percentage,
      maxScore: a.maxScore,
      score: a.grades[0]?.score ?? null,
      didNotSubmit: a.grades[0]?.didNotSubmit ?? false,
    }))

    // Asistencias del bimestre
    const period = await this.prisma.period.findUnique({
      where: { id: periodId },
    })

    const attendances = await this.prisma.attendance.findMany({
      where: {
        studentId,
        subjectTermGroupId,
        date: {
          gte: period?.startDate,
          lte: period?.endDate,
        },
      },
      orderBy: { date: 'asc'}
    })

    const attendanceSummary = {
      present: attendances.filter((a) => a.status === 'PRESENT').length,
      absent: attendances.filter((a) => a.status === 'ABSENT').length,
      late: attendances.filter((a) => a.status === 'LATE').length,
      excused: attendances.filter((a) => a.status === 'EXCUSED').length,
    }

    return {
      subjectName: stg.subject.name,
      periodDates: {
        startDate: period?.startDate,
        endDate: period?.endDate
      },
      finalGrade: finalGrade
        ? {
            calculatedScore: finalGrade.calculatedScore,
            finalScore: finalGrade.finalScore,
          }
        : null,
      activities: activitiesWithGrade,
      attendance: attendances.map(a => ({
        date: a.date,
        status: a.status
      })),
    }
  }

}