export declare class Reservation {
    reservation_id: number;
    table_id: number;
    customer_id: number;
    status_id: number;
    start_time: Date;
    end_time: Date;
    num_guests: number;
    special_requests?: string;
    check_in_time?: Date;
    check_out_time?: Date;
    staff_handler_id?: number;
    created_by?: number;
    cancel_reason?: string;
    cancelled_at?: Date;
    cancelled_by?: number;
    created_at: Date;
    updated_at: Date;
}
