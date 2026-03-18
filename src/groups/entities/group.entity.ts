import { Attendance } from "src/attendance/entities/attendance.entity";
import { Course } from "src/courses/entities/course.entity";
import { Schedule } from "src/schedule/entities/schedule.entity";
import { Student } from "src/students/entities/student.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";


@Entity('group')
export class Group {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    groupName: string

    @ManyToOne(() => Course, (course) => course.groups)
    course: Course

    @ManyToOne(() => User, (user) => user.groups)
    teacher: User;

    @ManyToMany(() => Student, (student) => student.group)
    students: Student[] 

    @OneToMany(() => Schedule, (schedule) => schedule.group)
    schedules: Schedule[]

     @OneToMany(() => Attendance, (attendance) => attendance.group)
    attendances: Schedule[]
}
