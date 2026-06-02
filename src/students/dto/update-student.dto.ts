import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateStudentDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string

  @IsString()
  @MinLength(2)
  @IsOptional()
  firstLastName?: string

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
}