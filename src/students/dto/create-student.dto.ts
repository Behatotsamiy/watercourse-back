// dto/create-student.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class CreateStudentDto {
  @IsString()
  stfirstName: string;

  @IsString()
  stlastName: string;

  @IsString()
  phone: string;
}

