import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAttendanceDto {
  @IsDateString()
  date: string;

  @IsBoolean()
  isPresent: boolean;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsUUID()
  studentId: string;

  @IsUUID()
  groupId: string;
}