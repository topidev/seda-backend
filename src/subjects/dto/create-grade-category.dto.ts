import { IsInt, IsString, Max, Min, MinLength } from "class-validator";

export class CreateGradeCategoryDto {
    @IsString()
    @MinLength(2)
    name!: string

    @IsInt()
    @Min(1)
    @Max(100)
    percentage!: number
}