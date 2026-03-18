// dto/create-schedule.dto.ts
import { IsInt, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateScheduleDto {
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @IsString()
  startTime: string; // '14:00'

  @IsString()
  endTime: string; // '16:00'

  @IsUUID()
  groupId: string;
}