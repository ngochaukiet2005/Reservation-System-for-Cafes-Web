import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { ReservationsScheduler } from './reservations.scheduler';
import { Reservation } from './entities/reservation.entity';
import { ReservationStatus } from './entities/reservation-status.entity';
import { CafeTable } from '../tables/entities/table.entity';
import { TableStatus } from '../tables/entities/table-status.entity';
import { User } from '../users/entities/user.entity';
import { ReservationsGateway } from './reservations.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, ReservationStatus, CafeTable, TableStatus, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'supersecretkey',
      }),
    }),
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsGateway, ReservationsScheduler],
  exports: [ReservationsService],
})
export class ReservationsModule {}

