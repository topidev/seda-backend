import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateGroupDto {
    @IsString()
    @MinLength(1)
    @IsOptional()
    grade?: string

    @IsString()
    @MinLength(1)
    @IsOptional()
    letter?: string
}