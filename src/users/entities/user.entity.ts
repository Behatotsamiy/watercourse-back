import { Group } from 'src/groups/entities/group.entity';
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  TEACHER = 'teacher',
}

@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phone: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true, select: false })
  refreshToken: string | null;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  // Если юзер — это Admin или Teacher, он "принадлежит" какому-то Owner-у
  @ManyToOne(() => User, (user) => user.staff, { nullable: true })
  owner: User;

  // Если юзер — это Owner, у него есть список сотрудников (staff)
  @OneToMany(() => User, (user) => user.owner)
  staff: User[];

  @OneToMany(() => Group, (group) => group.teacher)
  groups: Group[]; // Список групп, которые ведет этот юзер (если он учитель)
  
  // Связь с компанией (только для Owner)
  @Column({ nullable: true })
  companyName: string;
}
