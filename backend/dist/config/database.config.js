"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('database', () => {
    var _a;
    return ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt((_a = process.env.DB_PORT) !== null && _a !== void 0 ? _a : '5432', 10),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        entities: [__dirname + '/../**/*.entity.{ts,js}'],
        synchronize: true,
    });
});
//# sourceMappingURL=database.config.js.map