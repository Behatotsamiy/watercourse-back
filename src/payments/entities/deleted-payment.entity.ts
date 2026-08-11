import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('deleted_payments')
export class DeletedPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalPaymentId: string;

  @Column()
  studentId: string;

  @Column()
  studentName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  method: string;

  @Column({ nullable: true })
  originalComment: string;

  @Column({ nullable: true })
  refundReason: string;

  @Column()
  deletedBy: string; // ownerId

  @CreateDateColumn()
  deletedAt: Date;
}