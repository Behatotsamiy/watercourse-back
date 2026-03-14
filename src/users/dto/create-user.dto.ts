// src/modules/users/dto/create-user.dto.ts
import { IsEnum, IsNotEmpty, IsPhoneNumber, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: '+998901234567' })
  @IsPhoneNumber() // Проверит формат номера
  phone: string;

  @ApiProperty({ example: '12345678' })
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  password: string;

  @ApiProperty({ example: 'Alisher' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Usmanov' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.TEACHER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: 'My IT Center', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;
}