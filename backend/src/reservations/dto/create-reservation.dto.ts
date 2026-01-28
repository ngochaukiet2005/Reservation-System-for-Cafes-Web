export class CreateReservationDto {
  table_id!: string;
  customer_name?: string;
  customer_phone?: string;
  guest_count?: number;
  num_guests?: number;
  reservation_time?: string;
  start_time?: string;
  notes?: string;
  special_requests?: string;
}
