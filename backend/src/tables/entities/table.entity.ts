import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TableStatus } from './table-status.entity';

@Entity('cafe_tables')
export class CafeTable {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'int' })
  capacity!: number;

  @ManyToOne(() => TableStatus, { nullable: false })
  @JoinColumn({ name: 'status_id' })
  status!: TableStatus;

  @Column({ type: 'bigint' })
  status_id!: string;

  @Column({ type: 'text', nullable: true })
  disabled_reason?: string;

  @Column({ type: 'int', nullable: true })
  sort_order?: number;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  created_at!: Date;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  updated_at!: Date;
}
