import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cafe_tables')
export class CafeTable {
  @PrimaryGeneratedColumn()
  table_id!: number;

  @Column({ type: 'varchar', length: 20, unique: true })
  code!: string; // T01, T02, VIP1...

  @Column({ type: 'integer' })
  capacity!: number; // CHECK > 0 (logic check ở code)

  @Column({ type: 'varchar', length: 50, nullable: true })
  area?: string; // Indoor, Tầng 1, Ban công...

  @Column({ type: 'integer' })
  status_id!: number; // FK tới table_statuses sau này

  @Column({ type: 'text', nullable: true })
  disabled_reason?: string; // lý do khóa nếu DISABLED

  @Column({ type: 'integer', nullable: true })
  sort_order?: number;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at!: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
