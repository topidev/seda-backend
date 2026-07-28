import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateScheduleDto } from './dto/create-schedule.dto'

@Injectable()
export class ClassScheduleService {
  constructor(private prisma: PrismaService) {}

  async create(
    teacherId: string,
    subjectTermGroupId: string,
    dto: CreateScheduleDto,
  ) {
    // Verifica que la clase pertenece al maestro
    const stg = await this.prisma.subjectTermGroup.findFirst({
      where: {
        id: subjectTermGroupId,
        subject: { teacherId },
      },
    })

    if (!stg) throw new NotFoundException('Clase no encontrada')

    return this.prisma.schedule.create({
      data: {
        subjectTermGroupId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    })
  }

  async findByClass(teacherId: string, subjectTermGroupId: string) {
    const stg = await this.prisma.subjectTermGroup.findFirst({
      where: {
        id: subjectTermGroupId,
        subject: { teacherId },
      },
    })

    if (!stg) throw new NotFoundException('Clase no encontrada')

    return this.prisma.schedule.findMany({
      where: { subjectTermGroupId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })
  }

  async remove(teacherId: string, scheduleId: string) {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        subjectTermGroup: { subject: { teacherId } },
      },
    })

    if (!schedule) throw new NotFoundException('Horario no encontrado')

    return this.prisma.schedule.delete({
      where: { id: scheduleId },
    })
  }

  async getWeeklyActivities(teacherId: string, weekOffset: number = 0) {
    // Calcula el inicio y fin de la semana solicitada
    const now = new Date()
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay() // domingo = 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - dayOfWeek + 1 + weekOffset * 7)
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    // Obtiene todos los horarios del maestro con sus actividades
    const schedules = await this.prisma.schedule.findMany({
      where: {
        subjectTermGroup: {
          subject: { teacherId },
          active: true,
          academicTerm: { active: true },
        },
      },
      include: {
        subjectTermGroup: {
          include: {
            subject: true,
            group: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })



    // Agrupa por día de la semana
    const days = [1, 2, 3, 4, 5, 6, 7]
    const result = await Promise.all(
      days.map(async day => {
        const date = new Date(monday)
        date.setDate(monday.getDate() + day - 1)

        const daySchedules = schedules.filter(s => s.dayOfWeek === day)

        const schedulesWithActivities = await Promise.all(
          daySchedules.map(async s => {
            const activities = await this.prisma.activity.findMany({
              where: {
                subjectId: s.subjectTermGroup.subject.id,
                deletedAt: null,
                dueDate: {
                  gte: monday,
                  lte: sunday,
                },
              },
              include: { category: true },
            })

            return {
              id: s.id,
              startTime: s.startTime,
              endTime: s.endTime,
              subjectTermGroupId: s.subjectTermGroupId,
              subjectName: s.subjectTermGroup.subject.name,
              groupName: `${s.subjectTermGroup.group.grade}°${s.subjectTermGroup.group.letter}`,
              activities,
            }
          })
        )

        return {
          dayOfWeek: day,
          date: date.toISOString(),
          schedules: schedulesWithActivities,
        }
      })
    )

    return {
      weekStart: monday.toISOString(),
      weekEnd: sunday.toISOString(),
      days: result,
    }
  }

  async getTodayActivities(teacherId: string) {
    const now = new Date()
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()

    // Inicio y fin de la semana actual
    const monday = new Date(now)
    monday.setDate(now.getDate() - dayOfWeek + 1)
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    const schedules = await this.prisma.schedule.findMany({
      where: {
        dayOfWeek,
        subjectTermGroup: {
          subject: { teacherId },
          active: true,
          academicTerm: { active: true },
        },
      },
      include: {
        subjectTermGroup: {
          include: {
            subject: true,
            group: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return Promise.all(
      schedules.map(async s => {
        const activities = await this.prisma.activity.findMany({
          where: {
            subjectId: s.subjectTermGroup.subject.id,
            deletedAt: null,
            dueDate: {
              gte: monday,
              lte: sunday,
            },
          },
          include: { category: true },
        })

        return {
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          subjectTermGroupId: s.subjectTermGroupId,
          subjectName: s.subjectTermGroup.subject.name,
          groupName: `${s.subjectTermGroup.group.grade}°${s.subjectTermGroup.group.letter}`,
          activities,
        }
      })
    )
  }
}