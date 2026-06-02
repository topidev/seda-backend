import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateStudentDto {
  @IsString()
  @MinLength(2)
  name!: string

  @IsString()
  @MinLength(2)
  firstLastName!: string

  @IsString()
  @IsOptional()
  secondLastName?: string

  @IsDateString()
  @IsOptional()
  birthDate?: string

  @IsString()
  @IsOptional()
  tutorName?: string

  @IsString()
  @IsOptional()
  tutorPhone?: string

  // grupo y ciclo para asignar al crear
  @IsString()
  groupId!: string

  @IsString()
  academicTermId!: string
}