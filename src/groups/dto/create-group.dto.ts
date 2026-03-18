// dto/create-group.dto.ts
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  groupName: string;

  @IsUUID()
  courseId: string;

  @IsUUID()
  teacherId: string;
}



export class AddStudentDto {
  @IsUUID()
  studentId: string;
}