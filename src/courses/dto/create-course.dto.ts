import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  courseName: string;
  
  @IsString()
  @IsNotEmpty()
  length: string;

  @IsNumber()
  @Min(0)
  price: number;
}
