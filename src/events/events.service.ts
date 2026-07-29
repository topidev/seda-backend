import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateEventDto } from './dto/create-event.dto'
import { EventType } from '@prisma/client'

// Festivos mexicanos predefinidos
const MEXICAN_HOLIDAYS = [
  { title: 'Año Nuevo', month: 1, day: 1 },
  { title: 'Día de la Constitución', month: 2, day: 5 },
  { title: 'Natalicio de Benito Juárez', month: 3, day: 21 },
  { title: 'Día del Trabajo', month: 5, day: 1 },
  { title: 'Día de la Independencia', month: 9, day: 16 },
  { title: 'Grito de Independencia', month: 9, day: 15 },
  { title: 'Revolución Mexicana', month: 11, day: 20 },
  { title: 'Navidad', month: 12, day: 25 },
]

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(teacherId: string, dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        teacherId,
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        type: dto.type ?? 'PERSONAL',
        schoolId: dto.schoolId ?? null,
      },
    })
  }

  async findUpcoming(teacherId: string, days: number = 30) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const until = new Date(today)
    until.setDate(today.getDate() + days)

    // Eventos del maestro
    const events = await this.prisma.event.findMany({
      where: {
        teacherId,
        date: {
          gte: today,
          lte: until,
        },
      },
      include: { school: { select: { name: true } } },
      orderBy: { date: 'asc' },
    })

    // Genera festivos mexicanos para el rango de fechas
    const holidays = this.generateHolidays(today, until)

    // Combina y ordena
    const combined = [
      ...events.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        date: e.date.toISOString(),
        type: e.type,
        schoolName: e.school?.name ?? null,
        isHoliday: false,
      })),
      ...holidays,
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return combined
  }

  private generateHolidays(from: Date, until: Date) {
    const holidays: {
      id: string
      title: string
      description: null
      date: string
      type: 'NATIONAL_HOLIDAY'
      schoolName: null
      isHoliday: boolean
    }[] = []
    
    const fromYear = from.getFullYear()
    const untilYear = until.getFullYear()

    for (let year = fromYear; year <= untilYear; year++) {
      for (const holiday of MEXICAN_HOLIDAYS) {
        const date = new Date(year, holiday.month - 1, holiday.day)
        date.setHours(0, 0, 0, 0)

        if (date >= from && date <= until) {
          holidays.push({
            id: `holiday-${year}-${holiday.month}-${holiday.day}`,
            title: holiday.title,
            description: null,
            date: date.toISOString(),
            type: 'NATIONAL_HOLIDAY' as const,
            schoolName: null,
            isHoliday: true,
          })
        }
      }
    }

    return holidays
  }

  async remove(teacherId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, teacherId },
    })

    if (!event) throw new NotFoundException('Evento no encontrado')

    return this.prisma.event.delete({ where: { id: eventId } })
  }
}