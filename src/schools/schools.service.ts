import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { CreateTermDto } from './dto/create-term.dto';

@Injectable()
export class SchoolsService {
    constructor(private prisma: PrismaService) {}

    // ------------------------ SCHOOLS --------------------------------

    async create(teacherId:string, dto: CreateSchoolDto){
        const school = await this.prisma.school.create({
            data: {
                name: dto.name,
                shift: dto.shift,
                level: dto.level,
                teachers: {
                    create: {
                        teacherId,
                    }
                }
            }
        })
        return school
    }

    async findAll(teacherId: string) {
        return this.prisma.school.findMany({
            where: {
                active: true,
                teachers: {
                    some: {
                        teacherId,
                        active:true,
                    },
                },
            },
            include: {
							academicTerms: {
								include: {
									periods: { orderBy: {
										number: 'asc'
									}}
								},
								orderBy: { createdAt: 'desc' }
							},
							_count: {
								select: { groups: true },
							},
            },
        })
    }

    async findOne(teacherId: string, schoolId: string) {

        const school = await this.prisma.school.findFirst({
            where: {
                id: schoolId,
                active: true,
                teachers: {
                    some: { teacherId, active: true },
                },
            },
            include: {
                academicTerms: {
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: { groups: true },
                },
            },
        })

        if (!school) throw new NotFoundException('Escuela No Encontrada.')
        
        return school 
    }

    async update(teacherId: string, schoolId: string, dto:UpdateSchoolDto) {
        await this.findOne(teacherId, schoolId)

        return this.prisma.school.update({
            where: { id: schoolId },
            data: dto
        })
    }

    async remove(teacherId: string, schoolId: string) {
        await this.prisma.school.update({
            where: { id: schoolId },
            data: { active: false },
        })
    }

    // ---------------- TERMS ------------------------

    async createTerm(teacherId: string, schoolId: string, dto: CreateTermDto) {
        await this.findOne(teacherId, schoolId)

        const start = new Date(dto.startDate)
        const end   = new Date(dto.endDate)

        const totalMs = end.getTime() - start.getTime()
        const periodMs = totalMs / 5

        const term = await this.prisma.academicTerm.create({
            data: {
                schoolId,
                name: dto.name,
                startDate: start,
                endDate: end,
                active: true,
                periods: {
                    create: Array.from({ length: 5}, (_, i) => {
                        const periodStart = new Date(start.getTime() + periodMs * i)
                        const periodEnd = new Date(end.getTime() + periodMs * (i + 1))

                        const isLast = i === 4

                        return {
                            number: i + 1,
                            startDate: periodStart,
                            endDate: isLast ? end : periodEnd
                        }
                    })
                },
            },
            include: {
                periods: {
                    orderBy: { number: 'asc' },
                }
            }
        })

        return term
    }

    async findTerms(teacherId: string, schoolId: string) {
        await this.findOne(teacherId, schoolId)

        return this.prisma.academicTerm.findMany({
            where: { schoolId },
            include: {
                periods: {
                    orderBy: { number: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' }
        })
    }

    async toggleTermClose(
        teacherId: string,
        schoolId: string,
        termId: string,
        active: boolean
    ) {
        const term = await this.prisma.academicTerm.findFirst({
            where: {
                id: termId,
                schoolId,
                school: {
                    teachers: {
                        some: {
                            teacherId,
                            active: true
                        }
                    }
                }
            }
        })

        if(!term) throw new NotFoundException('Ciclo escolar no encontrado')

        return this.prisma.academicTerm.update({
            where: { id: termId}, 
            data: { active }
        })
    }

}
