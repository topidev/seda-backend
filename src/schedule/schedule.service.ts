import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateScheduleDto } from './dto/create-schedule.dto'

@Injectable()
export class ScheduleService {
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
            activities: {
              where: {
                deletedAt: null,
                dueDate: {
                  gte: monday,
                  lte: sunday,
                },
              },
              include: { category: true },
            },
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    // Agrupa por día de la semana
    const days = [1, 2, 3, 4, 5, 6, 7]
    const result = days.map(day => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + day - 1)

      const daySchedules = schedules.filter(s => s.dayOfWeek === day)

      return {
        dayOfWeek: day,
        date: date.toISOString(),
        schedules: daySchedules.map(s => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          subjectTermGroupId: s.subjectTermGroupId,
          subjectName: s.subjectTermGroup.subject.name,
          groupName: `${s.subjectTermGroup.group.grade}°${s.subjectTermGroup.group.letter}`,
          activities: s.subjectTermGroup.activities,
        })),
      }
    })

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
            activities: {
              where: {
                deletedAt: null,
                dueDate: {
                  gte: monday,
                  lte: sunday,
                },
              },
              include: { category: true },
            },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return schedules.map(s => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      subjectTermGroupId: s.subjectTermGroupId,
      subjectName: s.subjectTermGroup.subject.name,
      groupName: `${s.subjectTermGroup.group.grade}°${s.subjectTermGroup.group.letter}`,
      activities: s.subjectTermGroup.activities,
    }))
  }
}