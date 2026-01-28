import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CafeTable } from '../../tables/entities/table.entity';
import { User } from '../../users/entities/user.entity';
import { ReservationStatus } from './reservation-status.entity';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @ManyToOne(() => CafeTable, { nullable: false })
  @JoinColumn({ name: 'table_id' })
  table!: CafeTable;

  @Column({ type: 'bigint' })
  table_id!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer!: User;

  @Column({ type: 'bigint' })
  customer_id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customer_name?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customer_phone?: string;

  @ManyToOne(() => ReservationStatus, { nullable: false })
  @JoinColumn({ name: 'status_id' })
  status!: ReservationStatus;

  @Column({ type: 'bigint' })
  status_id!: string;

  @Column({ type: 'timestamp' })
  start_time!: Date;

  @Column({ type: 'timestamp' })
  end_time!: Date;

  @Column({ type: 'int' })
  num_guests!: number;

  @Column({ type: 'text', nullable: true })
  special_requests?: string;

  @Column({ type: 'timestamp', nullable: true })
  check_in_time?: Date;

  @Column({ type: 'timestamp', nullable: true })
  check_out_time?: Date;

  @Column({ type: 'bigint', nullable: true })
  staff_handler_id?: string;

  @Column({ type: 'bigint', nullable: true })
  created_by?: string;

  @Column({ type: 'text', nullable: true })
  cancel_reason?: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at?: Date;

  @Column({ type: 'bigint', nullable: true })
  cancelled_by?: string;

  @Column({ type: 'timestamp', nullable: true })
  expires_at?: Date;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  created_at!: Date;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  updated_at!: Date;
}
