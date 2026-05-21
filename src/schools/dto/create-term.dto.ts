import { IsDateString, IsString, MinLength } from "class-validator";

export class CreateTermDto {
    @IsString()
    @MinLength(4)
    name!: string

    @IsDateString()
    startDate!: string

    @IsDateString()
    endDate!: string
}