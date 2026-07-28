import { IsInt, IsString, IsOptional, Min, Max, Matches } from 'class-validator'

export class CreateScheduleDto {
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime debe tener formato HH:MM',
  })
  startTime!: string

  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime debe tener formato HH:MM',
  })
  endTime?: string
}