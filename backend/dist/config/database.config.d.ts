declare const _default: (() => {
    type: "postgres";
    host: string | undefined;
    port: number;
    username: string | undefined;
    password: string | undefined;
    database: string | undefined;
    entities: string[];
    synchronize: boolean;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    type: "postgres";
    host: string | undefined;
    port: number;
    username: string | undefined;
    password: string | undefined;
    database: string | undefined;
    entities: string[];
    synchronize: boolean;
}>;
export default _default;
