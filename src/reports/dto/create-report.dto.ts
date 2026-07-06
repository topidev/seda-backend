import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateReportDto {
  @IsString()
  studentId!: string

  @IsString()
  @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres' })
  reason!: string

  @IsDateString()
  date!: string

  @IsBoolean()
  @IsOptional()
  notifyTutor?: boolean

  @IsString()
  @IsOptional()
  subjectTermGroupId?: string
}