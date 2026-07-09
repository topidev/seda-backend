import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { GradeActivityDto } from './dto/grade-activity.dto';

@Injectable()
export class ClassroomService {
    constructor(private prisma: PrismaService) {}

    // ----> Mis Clases
    async findMyClasses(teacherId: string) {
        return this.prisma.subjectTermGroup.findMany({
            where: {
							active:true,
							subject: { teacherId },
							academicTerm: { active:true }
            },
            include: {
                subject: true,
                group: {
                    include: { 
                        school: true,
                        studentGroupTerms: {
                            where: { active: true }
                        } 
                    }
                },
                academicTerm: {
                    include: {
                        periods: { orderBy: { number: 'asc' } }
                    }
                },
                _count: {
                    select: { reports: true }
                }
            },
            orderBy: [
                { subject: { name: 'asc' } },
                { group: { grade: 'asc' } },
                { group: { letter: 'asc' } }
            ]
        })
    }

    async findOneClass(teacherId: string, subjectTermGroupId: string) {
        const stg = await this.prisma.subjectTermGroup.findFirst({
            where: {
                id: subjectTermGroupId,
                active: true,
                subject: { teacherId }
            },
            include: {
                subject: {
                    include: { gradeCategories: true }
                },
                group: {
                    include: {
                        school: true,
                        studentGroupTerms: {
                            where: { active: true },
                            include: { student: true }
                        }
                    }
                },
                academicTerm: {
                    include: {
                        periods: {
                            orderBy: { number: 'asc' }
                        }
                    }
                }
            }
        })
        if (!stg) throw new NotFoundException('Clase no encontrada')
        
        return stg
    }

    // ------> Actividades
    async findActivitiesByPeriod(
			teacherId: string, 
			subjectTermGroupId: string, 
			periodId: string
    ) {
        const stg = await this.findOneClass(teacherId, subjectTermGroupId)

        return this.prisma.activity.findMany({
            where: {
							subjectId: stg.subjectId,
							periodId,
							deletedAt: null
            },
            include: {
                category: true,
                grades: {
                    where: { subjectTermGroupId },
                }
            },
            orderBy: { createdAt: 'asc' }
        })
    }

    async createActivity(
			teacherId: string,
			subjectTermGroupId: string,
			periodId: string,
			dto: CreateActivityDto
    ) {
        const stg = await this.findOneClass(teacherId, subjectTermGroupId)

        return this.prisma.activity.create({
					data: {
						subjectId: stg.subjectId,
						periodId,
						categoryId: dto.categoryId,
						title: dto.title,
						description: dto.description,
						dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
						maxScore: dto.maxScore ?? 10
					},
					include: { category: true }
        })
    }

    async deleteActivity(teacherId: string, activityId: string) {
			const activity = await this.prisma.activity.findFirst({
				where: {
					id: activityId,
					deletedAt: null,
					subject: { teacherId }
				},
			})
			if (!activity) throw new NotFoundException('Actividad no encontrada')
        
			return this.prisma.activity.update({
				where: {
					id: activityId
				},
				data: { deletedAt: new Date() }
			})
    }

    // ----------> Ponderación
    async gradeActivity(
			teacherId: string, 
			activityId: string, 
			subjectTermGroupId: string,
			dto: GradeActivityDto
		) {
			const activity = await this.prisma.activity.findFirst({
				where: {
					id: activityId,
					deletedAt: null,
					subject: { teacherId }
				}
			})

        if (!activity) throw new NotFoundException('Actividad no encontrada')

        await Promise.all(
            dto.grades.map(grade => 
                this.prisma.grade.upsert({
                    where: {
                        activityId_studentId_subjectTermGroupId: {
													activityId,
													studentId: grade.studentId,
													subjectTermGroupId,
                        }
                    },
                    update: {
                        score: grade.didNotSubmit ? 0 : grade.score,
                        didNotSubmit: grade.didNotSubmit ?? false,
                        version: { increment: 1 },
                        updatedAt: new Date()
                    },
                    create: {
                        activityId,
                        studentId: grade.studentId,
												subjectTermGroupId,
                        score: grade.didNotSubmit ? 0 : grade.score,
                        didNotSubmit: grade.didNotSubmit ?? false
                    }
                })
            )
        )

        await this.recalculatePeriodGrades(activityId, subjectTermGroupId)
        return { success: true }
    }

    // -----> Calculo Bimestral
    private async recalculatePeriodGrades(
			activityId: string, 
			subjectTermGroupId: string
		) {
			const activity = await this.prisma.activity.findUnique({
				where: {
					id: activityId
				},
				include: {
					subject: {
						include: { gradeCategories: true } 
					},
				}
			})

			if (!activity) return

			const stg = await this.prisma.subjectTermGroup.findUnique({
				where: { id: subjectTermGroupId },
				include: {
					group: {
						include: {
							studentGroupTerms: {
								where: { active: true },
								select: { studentId: true }
							}
						}
					}
				}
			})

			if (!stg) return

			const studentIds = stg.group.studentGroupTerms.map(
				s => s.studentId
			)
			const categories = activity.subject.gradeCategories
			const periodId = activity.periodId

			await Promise.all( // Calcular calificacion de cada alumno
				studentIds.map(async studentId => {
					const activities = await this.prisma.activity.findMany({
						where: { 
							subjectId: activity.subjectId, 
							periodId, 
							deletedAt: null 
						},
						include: {
							grades: {
								where: { studentId, subjectTermGroupId  }
							},
							category: true
						},
					})
					
					let calculatedScore = 0

					for (const category of categories) {
						const categoryActivites = activities.filter(
							a => a.categoryId === category.id
						)

						if (categoryActivites.length === 0) continue

						const categoryScores = categoryActivites.map(a => {
							const grade = a.grades[0]
							if (!grade || grade.score === null) return null
							return (grade.score / a.maxScore) * 10
						})

						const validScores = categoryScores.filter(s => s !== null) as number[]

						if(validScores.length === 0) continue

						const categoryAvg = 
							validScores.reduce((sum, s) => sum + s, 0) / validScores.length

						calculatedScore += categoryAvg * (category.percentage / 100)
					}

					// Actualizar calificacion bimestral
					await this.prisma.finalGrade.upsert({
						where: {
							studentId_subjectTermGroupId_periodId: {
								studentId,
								subjectTermGroupId,
								periodId
							}
						},
						update: {
							calculatedScore: Math.round(calculatedScore * 10) / 10
						},
						create: {
							studentId,
							subjectTermGroupId,
							periodId,
							calculatedScore: Math.round(calculatedScore * 10) / 10
						}
					})
				})
			)
    }

    // --------> Calificaciones Bimestrales
    async getPeriodGrades(teacherId: string, subjectTermGroupId: string, periodId: string) {
        await this.findOneClass(teacherId, subjectTermGroupId)

        return this.prisma.finalGrade.findMany({
            where: {
                subjectTermGroupId,
                periodId
            },
            include: {
                student: true
            },
            orderBy: [
                { student: { firstLastName: 'asc' }},
                { student: { name: 'asc' }}
            ]
        })
    }

    async overrideFinalGrade(
        teacherId: string,
        finalGradeId: string,
        finalScore: number,
        overrideReason?: string
    ){
			const finalGrade = await this.prisma.finalGrade.findFirst({
				where: {
					id: finalGradeId,
					subjectTermGroup: { subject: { teacherId } }
				},
			})

			if (!finalGrade) throw new NotFoundException('Calificación no encontrada')
			
			return this.prisma.finalGrade.update({
				where: { id: finalGradeId },
				data: {
					finalScore,
					overrideReason,
					overrideAt: new Date()
				}
			})
    }

    // ----------> Asistencia

    async saveAttendance(
        teacherId: string,
        subjectTermGroupId: string,
        date: string,
        records: { studentId: string; status: string }[],
    ) {
        await this.findOneClass(teacherId, subjectTermGroupId)

        const attendanceDate = new Date(date)

        // Upsert de cada registro de asistencia
        await Promise.all(
            records.map(record =>
                this.prisma.attendance.upsert({
                    where: {
                    studentId_subjectTermGroupId_date: {
                        studentId: record.studentId,
                        subjectTermGroupId,
                        date: attendanceDate,
                    },
                    },
                    update: {
                    status: record.status as any,
                    version: { increment: 1 },
                    updatedAt: new Date(),
                    },
                    create: {
                    studentId: record.studentId,
                    subjectTermGroupId,
                    date: attendanceDate,
                    status: record.status as any,
                    },
                }),
            ),
        )

        return { success: true }
    }

    async getAttendanceByDate(
        teacherId: string,
        subjectTermGroupId: string,
        date: string,
    ) {
        await this.findOneClass(teacherId, subjectTermGroupId)

        return this.prisma.attendance.findMany({
            where: {
            subjectTermGroupId,
            date: new Date(date),
            },
        })
    }

    async getAttendanceHistory(
        teacherId: string,
        subjectTermGroupId: string,
    ) {
        await this.findOneClass(teacherId, subjectTermGroupId)

        return this.prisma.attendance.findMany({
            where: { subjectTermGroupId },
            include: { student: true },
            orderBy: { date: 'desc' },
        })
    }

    async getDashboardSummary(teacherId: string) {
			const [students, groups, classes, pendingGrades] = await Promise.all([
				// Total de alumnos activos
				this.prisma.student.count({
					where: { teacherId, deletedAt: null },
				}),

				// Total de grupos activos
				this.prisma.group.count({
					where: {
						active: true,
						school: {
							teachers: { some: { teacherId, active: true } },
						},
					},
				}),

				// Clases activas del ciclo activo
				this.prisma.subjectTermGroup.findMany({
					where: {
							active: true,
							subject: { teacherId },
							academicTerm: { active: true },
					},
					include: {
							subject: true,
							group: { include: { school: true } },
							academicTerm: true,
					},
					orderBy: [
							{ subject: { name: 'asc' } },
							{ group: { grade: 'asc' } },
					],
					take: 5, // solo las primeras 5 para el dashboard
				}),

				// Actividades sin calificar completamente
				this.prisma.activity.count({
					where: {
						deletedAt: null,
                        subject: { teacherId },
						grades: {
							none: {},
						},
					},
				}),
		])

		return {
				totalStudents: students,
				totalGroups: groups,
				totalClasses: classes.length,
				pendingGrades,
				recentClasses: classes,
		}
	}

    async togglePeriodClose(
        teacherId: string,
        subjectTermGroupId: string,
        periodId: string,
        closed: boolean,
    ) {
        await this.findOneClass(teacherId, subjectTermGroupId)

        // cierra o abre todas las calificaciones del bimestre de esta materia
        await this.prisma.finalGrade.updateMany({
            where: {
                subjectTermGroupId,
                periodId, 
            },
            data: { closed }
        })

        return { success: true, closed }

    }
}
