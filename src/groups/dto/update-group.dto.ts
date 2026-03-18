import { IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  groupName?: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;
}