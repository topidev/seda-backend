import { IsArray, IsOptional, IsString, MinLength } from "class-validator";

export class CreateGroupDto {
    @IsString()
    schoolId!: string

    @IsString()
    @MinLength(1)
    grade!: string

    @IsString()
    @MinLength(1)
    letter!: string

    @IsString()
    academicTermId!: string

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    subjectIds?: string[]
}