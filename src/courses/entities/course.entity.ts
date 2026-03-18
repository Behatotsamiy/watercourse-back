import { Group } from "src/groups/entities/group.entity";
import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity('course')
export class Course {
    @PrimaryGeneratedColumn('uuid')
    id:string

    @Column()
    courseName: string

    @Column()
    length: string

    @OneToMany(() => Group, (group) => group.course )
    groups: Group[]
}
