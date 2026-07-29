import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  MinLength,
} from 'class-validator'
import { EventType } from '@prisma/client'

export class CreateEventDto {
  @IsString()
  @MinLength(2, { message: 'El título debe tener al menos 2 caracteres' })
  title!: string

  @IsString()
  @IsOptional()
  description?: string

  @IsDateString()
  date!: string

  @IsEnum(EventType)
  @IsOptional()
  type?: EventType

  @IsString()
  @IsOptional()
  schoolId?: string
}