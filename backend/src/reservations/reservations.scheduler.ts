import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In, IsNull } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { ReservationStatus } from './entities/reservation-status.entity';
import { ReservationsGateway } from './reservations.gateway';

@Injectable()
export class ReservationsScheduler {
  private readonly logger = new Logger(ReservationsScheduler.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(ReservationStatus)
    private readonly statusRepo: Repository<ReservationStatus>,
    private readonly reservationsGateway: ReservationsGateway,
  ) {}

  /**
   * Chạy mỗi phút để kiểm tra và expire các đặt bàn hết hạn đến giờ đến
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations() {
    try {
      // Lấy status PENDING, CONFIRMED và EXPIRED
      const [pendingStatus, confirmedStatus, expiredStatus] = await Promise.all([
        this.statusRepo.findOne({ where: { name: 'PENDING' } }),
        this.statusRepo.findOne({ where: { name: 'CONFIRMED' } }),
        this.statusRepo.findOne({ where: { name: 'EXPIRED' } }),
      ]);

      if (!pendingStatus || !confirmedStatus || !expiredStatus) {
        this.logger.warn('PENDING/CONFIRMED/EXPIRED status missing');
        return;
      }

      // Tìm reservation tới giờ mà khách chưa check-in
      const now = new Date();
      const expiredReservations = await this.reservationRepo.find({
        where: {
          status_id: In([pendingStatus.id, confirmedStatus.id]),
          expires_at: LessThan(now),
          check_in_time: IsNull(),
        },
        relations: ['table', 'customer', 'status'],
      });

      if (expiredReservations.length === 0) {
        return; // Không có gì để expire
      }

      // Cập nhật trạng thái thành EXPIRED
      const updateResult = await this.reservationRepo
        .createQueryBuilder()
        .update(Reservation)
        .set({
          status_id: expiredStatus.id,
          updated_at: new Date(),
        })
        .where('status_id IN (:...statusIds)', { statusIds: [pendingStatus.id, confirmedStatus.id] })
        .andWhere('expires_at < :now', { now })
        .andWhere('check_in_time IS NULL')
        .execute();

      if (updateResult.affected && updateResult.affected > 0) {
        this.logger.log(
          `[EXPIRE] Expired ${updateResult.affected} PENDING reservation(s)`,
        );

        // Reload và emit cho frontend
        for (const reservation of expiredReservations) {
          const reloaded = await this.reservationRepo.findOne({
            where: { id: reservation.id },
            relations: ['table', 'customer', 'status'],
          });
          if (reloaded) {
            this.reservationsGateway.emitReservation(
              'reservation.expired',
              reloaded,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `[EXPIRE] Error handling expired reservations:`,
        error,
      );
    }
  }
}
