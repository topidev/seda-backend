import { IsDateString, IsNumber, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateActivityDto {
    @IsString()
    @MinLength(2)
    title!: string

    @IsString()
    @IsOptional()
    description?: string

    @IsString()
    categoryId!: string

    @IsDateString()
    @IsOptional()
    dueDate?: string

    @IsNumber()
    @Min(1)
    @IsOptional()
    maxScore?: number
}