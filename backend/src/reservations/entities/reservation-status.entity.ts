import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('reservation_statuses')
export class ReservationStatus {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  name!: string;
}
