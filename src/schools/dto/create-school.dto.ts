import { Level, Shift } from "@prisma/client";
import { IsEnum, IsString, MinLength } from "class-validator";

export class CreateSchoolDto {
    @IsString()
    @MinLength(2)
    name!: string

    @IsEnum(Shift)
    shift!: Shift

    @IsEnum(Level)
    level!: Level
}