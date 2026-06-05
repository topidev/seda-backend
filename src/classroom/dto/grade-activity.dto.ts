import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";

export class StudentGradeDto {
    @IsString()
    studentId!: string

    @IsNumber()
    @Min(0)
    @IsOptional()
    score?: number

    @IsBoolean()
    @IsOptional()
    didNotSubmit?: boolean
}

export class GradeActivityDto {
    @IsArray()
    @ValidateNested( { each: true })
    @Type(() => StudentGradeDto)
    grades!: StudentGradeDto[]
}