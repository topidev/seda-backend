import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class AcademicTermGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const teacherId = req.user?.id
    const academicTermId = req.body?.academicTermId ?? req.query?.academicTermId

    if (!academicTermId) return true // si no viene, deja pasar

    const term = await this.prisma.academicTerm.findFirst({
      where: {
        id: academicTermId,
        school: {
          teachers: { some: { teacherId, active: true } },
        },
      },
    })

    if (!term) {
      throw new BadRequestException(
        'El ciclo escolar no pertenece a ninguna de tus escuelas',
      )
    }

    return true
  }
}