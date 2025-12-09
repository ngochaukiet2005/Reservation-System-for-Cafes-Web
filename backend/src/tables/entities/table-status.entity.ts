import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('table_statuses')
export class TableStatus {
  @PrimaryGeneratedColumn()
  status_id!: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  status_name!: string; // AVAILABLE, RESERVED, OCCUPIED, DISABLED...
}
