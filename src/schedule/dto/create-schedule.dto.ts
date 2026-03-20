// dto/create-schedule.dto.ts
import { IsArray, IsInt, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateScheduleDto {
  @IsArray()
  @IsString({each: true})
  dayOfWeek: string[];

  @IsString()
  startTime: string; // '14:00'

  @IsString()
  endTime: string; // '16:00'

  @IsUUID()
  groupId: string;
}
