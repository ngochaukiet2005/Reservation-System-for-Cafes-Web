import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  role_id!: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  role_name!: string; // ADMIN, STAFF, CUSTOMER...
}
