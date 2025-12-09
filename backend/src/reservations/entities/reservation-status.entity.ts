import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('reservation_statuses')
export class ReservationStatus {
  @PrimaryGeneratedColumn()
  reservation_statuses_id!: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  reservation_statuses_name!: string; 
  // PENDING, CONFIRMED, SEATED, COMPLETED, CANCELLED...
}
