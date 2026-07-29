import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateEventDto } from './dto/create-event.dto'
import { EventType } from '@prisma/client'

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

    return events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.date.toISOString(),
      type: e.type,
      schoolName: e.school?.name ?? null,
    }))
  }

  async findAll(teacherId: string, schoolId?: string) {
    return this.prisma.event.findMany({
      where: {
        teacherId,
        ...(schoolId && { schoolId }),
      },
      include: { school: { select: { name: true } } },
      orderBy: { date: 'asc' },
    })
  }

  async remove(teacherId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, teacherId },
    })

    if (!event) throw new NotFoundException('Evento no encontrado')

    return this.prisma.event.delete({ where: { id: eventId } })
  }
}