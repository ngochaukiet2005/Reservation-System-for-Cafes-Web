export declare class User {
    user_id: number;
    role_id: number;
    email: string;
    password_hash: string;
    user_name: string;
    phone_number?: string;
    is_active: boolean;
    is_locked: boolean;
    created_at: Date;
    updated_at: Date;
}
