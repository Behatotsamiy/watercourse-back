import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity('auth')
export class Auth {
    @Column()
    phone: string;

    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Column()
    password: string;
}
   