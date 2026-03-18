import { Attendance } from "src/attendance/entities/attendance.entity";
import { Group } from "src/groups/entities/group.entity";
import { Payment } from "src/payments/entities/payment.entity";
import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('student')
export class Student {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    stfirstName: string

    @Column()
    stlastName : string

    @Column()
    phone: string

    @ManyToMany(() => Group)
    @JoinTable()
    group: Group[]

    @OneToMany(() => Attendance, (attendance) => attendance.student)
    attendances: Attendance[]

    @OneToMany(() => Payment, (payment) => payment.student)
    payments: Attendance[]
}

