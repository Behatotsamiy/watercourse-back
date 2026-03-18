// src/modules/attendance/entities/attendance.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Student } from "../../students/entities/student.entity";
import { Group } from "../../groups/entities/group.entity";

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: false })
  isPresent: boolean;

  @Column({ nullable: true })
  reason: string; // Причина отсутствия

  @ManyToOne(() => Student, (student) => student.attendances)
  student: Student;

  @ManyToOne(() => Group, (group) => group.attendances)
  group: Group;
}