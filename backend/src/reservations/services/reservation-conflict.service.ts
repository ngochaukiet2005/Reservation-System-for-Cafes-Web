import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { ReservationStatus } from '../entities/reservation-status.entity';

const MIN_LEAD_MS = 60 * 60 * 1000; // 1 hour

export interface ConflictResult {
  hasConflict: boolean;
  earliestTime?: Date;
  message?: string;
}

@Injectable()
export class ReservationConflictService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(ReservationStatus)
    private readonly statusRepo: Repository<ReservationStatus>,
  ) {}

  async checkTableConflict(
    tableId: string,
    startTime: Date,
    date: string,
    excludeReservationId?: string,
  ): Promise<ConflictResult> {
    const activeStatuses = await this.statusRepo.find({
      where: [
        { name: 'PENDING' },
        { name: 'CONFIRMED' },
        { name: 'OCCUPIED' },
      ],
    });
    const activeStatusIds = activeStatuses.map((s) => s.id);

    if (activeStatusIds.length === 0) {
      return { hasConflict: false };
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const query = this.reservationRepo
      .createQueryBuilder('r')
      .where('r.table_id = :tableId', { tableId })
      .andWhere('r.status_id IN (:...statusIds)', { statusIds: activeStatusIds })
      .andWhere('r.start_time BETWEEN :dayStart AND :dayEnd', {
        dayStart,
        dayEnd,
      });

    if (excludeReservationId) {
      query.andWhere('r.id != :excludeId', { excludeId: excludeReservationId });
    }

    const existingReservations = await query
      .orderBy('r.start_time', 'ASC')
      .getMany();

    if (existingReservations.length === 0) {
      return { hasConflict: false };
    }

    const earliestReservation = existingReservations[0];
    const earliestTime = earliestReservation.start_time;
    const latestAllowed = new Date(earliestTime.getTime() - MIN_LEAD_MS);

    if (startTime > latestAllowed) {
      const timeStr = earliestTime.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const latestStr = latestAllowed.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return {
        hasConflict: true,
        earliestTime,
        message: `Bàn đã có khách lúc ${timeStr}. Bạn chỉ có thể đặt sớm hơn hoặc bằng ${latestStr}.`,
      };
    }

    return { hasConflict: false };
  }
}
