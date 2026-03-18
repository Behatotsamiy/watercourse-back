import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateAttendanceDto {
  @IsOptional()
  @IsBoolean()
  isPresent?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}