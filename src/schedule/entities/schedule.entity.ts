import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Group } from "../../groups/entities/group.entity";

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' }) // 1 - Понедельник, 7 - Воскресенье
  dayOfWeek: number;

  @Column({ type: 'time' }) // Например, '14:00'
  startTime: string;

  @Column({ type: 'time' }) // Например, '16:00'
  endTime: string;

  @ManyToOne(() => Group, (group) => group.schedules, { onDelete: 'CASCADE' })
  group: Group;
}