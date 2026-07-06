import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateReportDto } from './dto/create-report.dto'

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(teacherId: string, dto: CreateReportDto) {
    // Verifica que el alumno pertenece al maestro
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, teacherId, deletedAt: null },
    })

    if (!student) throw new NotFoundException('Alumno no encontrado')

    return this.prisma.report.create({
      data: {
        studentId: dto.studentId,
        teacherId,
        subjectTermGroupId: dto.subjectTermGroupId ?? null,
        reason: dto.reason,
        date: new Date(dto.date),
        notifyTutor: dto.notifyTutor ?? false,
      },
    })
  }

  async findByStudent(teacherId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, teacherId, deletedAt: null },
    })

    if (!student) throw new NotFoundException('Alumno no encontrado')

    return this.prisma.report.findMany({
      where: { studentId, teacherId },
      include: {
        subjectTermGroup: {
          include: { subject: true },
        },
      },
      orderBy: { date: 'desc' },
    })
  }

  async remove(teacherId: string, reportId: string) {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, teacherId },
    })

    if (!report) throw new NotFoundException('Reporte no encontrado')

    return this.prisma.report.delete({
      where: { id: reportId },
    })
  }
}