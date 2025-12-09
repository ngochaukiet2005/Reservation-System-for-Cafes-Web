import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  reservation_id!: number;

  @Column({ type: 'integer' })
  table_id!: number; // bàn được đặt

  @Column({ type: 'integer' })
  customer_id!: number; // user_id của khách hàng

  @Column({ type: 'integer' })
  status_id!: number; // trạng thái đặt chỗ

  @Column({ type: 'timestamp' })
  start_time!: Date; // dự kiến đến

  @Column({ type: 'timestamp' })
  end_time!: Date; // dự kiến kết thúc

  @Column({ type: 'integer' })
  num_guests!: number; // số khách

  @Column({ type: 'text', nullable: true })
  special_requests?: string; // yêu cầu đặc biệt

  @Column({ type: 'timestamp', nullable: true })
  check_in_time?: Date; // đến thực tế

  @Column({ type: 'timestamp', nullable: true })
  check_out_time?: Date; // về thực tế

  @Column({ type: 'integer', nullable: true })
  staff_handler_id?: number; // nhân viên xử lý

  @Column({ type: 'integer', nullable: true })
  created_by?: number; // người tạo (staff hoặc customer)

  @Column({ type: 'text', nullable: true })
  cancel_reason?: string; // lý do hủy

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at?: Date;

  @Column({ type: 'integer', nullable: true })
  cancelled_by?: number;

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
