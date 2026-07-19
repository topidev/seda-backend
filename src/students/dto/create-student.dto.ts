import { IsDateString, IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator'

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

  @IsString()
  @IsOptional()
  @Matches(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/, {
    message: 'CURP inválida',
  })
  curp?: string

  @IsDateString()
  @IsOptional()
  birthDate?: string

  @IsString()
  @IsOptional()
  tutorName?: string

  @IsString()
  @IsOptional()
  tutorPhone?: string

  @IsEmail({}, { message: 'Email del tutor invalido' })
  @IsOptional()
  tutorEmail?: string

  @IsString()
  groupId!: string

  @IsString()
  academicTermId!: string
}