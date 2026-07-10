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
        subjectTermGroupId: string,
    ) {
        const activity = await this.prisma.activity.findUnique({
            where: { id: activityId },
            include: {
            subject: { include: { gradeCategories: true } },
            },
        })

        if (!activity) return

        const stg = await this.prisma.subjectTermGroup.findUnique({
            where: { id: subjectTermGroupId },
            include: {
            group: {
                include: {
                studentGroupTerms: {
                    where: { active: true },
                    select: { studentId: true },
                },
                },
            },
            },
        })

        if (!stg) return

        const studentIds = stg.group.studentGroupTerms.map(s => s.studentId)
        const categories = activity.subject.gradeCategories
        const periodId = activity.periodId

        // Obtiene el periodo para filtrar asistencias por fecha
        const period = await this.prisma.period.findUnique({
            where: { id: periodId },
        })

        await Promise.all(
            studentIds.map(async studentId => {
            const activities = await this.prisma.activity.findMany({
                where: {
                subjectId: activity.subjectId,
                periodId,
                deletedAt: null,
                },
                include: {
                grades: {
                    where: { studentId, subjectTermGroupId },
                },
                category: true,
                },
            })

            // Asistencias del alumno en este bimestre
            const attendances = period ? await this.prisma.attendance.findMany({
                where: {
                studentId,
                subjectTermGroupId,
                date: {
                    gte: period.startDate,
                    lte: period.endDate,
                },
                },
            }) : []

            const totalClasses = attendances.length
            const absents = attendances.filter(a => a.status === 'ABSENT').length
            const lates = attendances.filter(a => a.status === 'LATE').length
            // 3 tardanzas = 1 falta, justificados no son faltas
            const equivalentAbsences = absents + Math.floor(lates / 3)
            const effectivePresences = totalClasses - equivalentAbsences
            const attendanceScore = totalClasses > 0
                ? Math.min((effectivePresences / totalClasses) * 10, 10)
                : null

            let calculatedScore = 0

            for (const category of categories) {
                const isAttendanceCategory =
                category.name.toLowerCase().trim() === 'asistencia'

                if (isAttendanceCategory) {
                // Usa el score calculado de asistencias
                if (attendanceScore !== null) {
                    calculatedScore += attendanceScore * (category.percentage / 100)
                }
                continue
                }

                const categoryActivities = activities.filter(
                a => a.categoryId === category.id,
                )

                if (categoryActivities.length === 0) continue

                const categoryScores = categoryActivities.map(a => {
                const grade = a.grades[0]
                if (!grade || grade.score === null) return null
                return (grade.score / a.maxScore) * 10
                })

                const validScores = categoryScores.filter(s => s !== null) as number[]

                if (validScores.length === 0) continue

                const categoryAvg =
                validScores.reduce((sum, s) => sum + s, 0) / validScores.length

                calculatedScore += categoryAvg * (category.percentage / 100)
            }

            await this.prisma.finalGrade.upsert({
                where: {
                studentId_subjectTermGroupId_periodId: {
                    studentId,
                    subjectTermGroupId,
                    periodId,
                },
                },
                update: {
                calculatedScore: Math.round(calculatedScore * 10) / 10,
                },
                create: {
                studentId,
                subjectTermGroupId,
                periodId,
                calculatedScore: Math.round(calculatedScore * 10) / 10,
                },
            })
            }),
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

        // Recalcula calificaciones si la materia tiene categoría de asistencia
        await this.recalculatePeriodGradesFromAttendance(
            subjectTermGroupId,
            attendanceDate,
        )

        return { success: true }
    }

		private async recalculatePeriodGradesFromAttendance(
			subjectTermGroupId: string,
			date: Date,
		) {
			const stg = await this.prisma.subjectTermGroup.findUnique({
				where: { id: subjectTermGroupId },
				include: {
					subject: { include: { gradeCategories: true } },
					group: {
						include: {
							studentGroupTerms: {
								where: { active: true },
								select: { studentId: true },
							},
						},
					},
					academicTerm: {
						include: {
							periods: { orderBy: { number: 'asc' } },
						},
					},
				},
			})

			if (!stg) return

			// Verifica si la materia tiene categoría de asistencia
			const hasAttendanceCategory = stg.subject.gradeCategories.some(
				c => c.name.toLowerCase().trim() === 'asistencia',
			)

			if (!hasAttendanceCategory) return

			// Encuentra el periodo al que pertenece la fecha
			const period = stg.academicTerm.periods.find(
				p => date >= p.startDate && date <= p.endDate,
			)

			if (!period) return

			const studentIds = stg.group.studentGroupTerms.map(s => s.studentId)
			const categories = stg.subject.gradeCategories

			await Promise.all(
				studentIds.map(async studentId => {
					// Asistencias del alumno en este bimestre
					const attendances = await this.prisma.attendance.findMany({
						where: {
							studentId,
							subjectTermGroupId,
							date: {
								gte: period.startDate,
								lte: period.endDate,
							},
						},
					})

					const totalClasses = attendances.length
					const absents = attendances.filter(a => a.status === 'ABSENT').length
					const lates = attendances.filter(a => a.status === 'LATE').length
					const equivalentAbsences = absents + Math.floor(lates / 3)
					const effectivePresences = totalClasses - equivalentAbsences
					const attendanceScore = totalClasses > 0
						? Math.min((effectivePresences / totalClasses) * 10, 10)
						: null

					if (attendanceScore === null) return

					// Actividades del bimestre para calcular el resto de categorías
					const activities = await this.prisma.activity.findMany({
						where: {
							subjectId: stg.subjectId,
							periodId: period.id,
							deletedAt: null,
						},
						include: {
							grades: { where: { studentId, subjectTermGroupId } },
							category: true,
						},
					})

					let calculatedScore = 0

					for (const category of categories) {
						const isAttendanceCategory =
							category.name.toLowerCase().trim() === 'asistencia'

						if (isAttendanceCategory) {
							calculatedScore += attendanceScore * (category.percentage / 100)
							continue
						}

						const categoryActivities = activities.filter(
							a => a.categoryId === category.id,
						)

						if (categoryActivities.length === 0) continue

						const categoryScores = categoryActivities.map(a => {
							const grade = a.grades[0]
							if (!grade || grade.score === null) return null
							return (grade.score / a.maxScore) * 10
						})

						const validScores = categoryScores.filter(s => s !== null) as number[]
						if (validScores.length === 0) continue

						const categoryAvg =
							validScores.reduce((sum, s) => sum + s, 0) / validScores.length
						calculatedScore += categoryAvg * (category.percentage / 100)
					}

					await this.prisma.finalGrade.upsert({
						where: {
							studentId_subjectTermGroupId_periodId: {
								studentId,
								subjectTermGroupId,
								periodId: period.id,
							},
						},
						update: {
							calculatedScore: Math.round(calculatedScore * 10) / 10,
						},
						create: {
							studentId,
							subjectTermGroupId,
							periodId: period.id,
							calculatedScore: Math.round(calculatedScore * 10) / 10,
						},
					})
				}),
			)
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
