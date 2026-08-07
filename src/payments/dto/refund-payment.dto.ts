import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RefundPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}