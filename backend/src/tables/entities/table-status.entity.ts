import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('table_statuses')
export class TableStatus {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  name!: string;
}
