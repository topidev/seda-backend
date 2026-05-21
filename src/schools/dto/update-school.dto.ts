import { CreateSchoolDto } from "./create-school.dto";
import { PartialType } from '@nestjs/mapped-types';

export class UpdateSchoolDto extends PartialType(CreateSchoolDto) {}