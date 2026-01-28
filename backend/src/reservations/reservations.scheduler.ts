import { Injectable, Logger, forwardRef, Inject } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan, In, IsNull } from "typeorm";
import { Reservation } from "./entities/reservation.entity";
import { ReservationStatus } from "./entities/reservation-status.entity";
import { ReservationsGateway } from "./reservations.gateway";
import { ReservationsService } from "./reservations.service";

@Injectable()
export class ReservationsScheduler {
  private readonly logger = new Logger(ReservationsScheduler.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(ReservationStatus)
    private readonly statusRepo: Repository<ReservationStatus>,
    private readonly reservationsGateway: ReservationsGateway,
    @Inject(forwardRef(() => ReservationsService))
    private readonly reservationsService: ReservationsService,
  ) {}

  /**
   * Chạy mỗi phút để kiểm tra và expire các đặt bàn hết hạn đến giờ đến
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredReservations() {
    try {
      // Lấy status PENDING, CONFIRMED và EXPIRED
      const [pendingStatus, confirmedStatus, expiredStatus] = await Promise.all(
        [
          this.statusRepo.findOne({ where: { name: "PENDING" } }),
          this.statusRepo.findOne({ where: { name: "CONFIRMED" } }),
          this.statusRepo.findOne({ where: { name: "EXPIRED" } }),
        ],
      );

      if (!pendingStatus || !confirmedStatus || !expiredStatus) {
        this.logger.warn("PENDING/CONFIRMED/EXPIRED status missing");
        return;
      }

      const now = new Date();

      // 1. Tự động hủy các đơn PENDING quá 15 phút chưa được duyệt
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      const pendingExpired = await this.reservationRepo.find({
        where: {
          status_id: pendingStatus.id,
          created_at: LessThan(fifteenMinutesAgo),
        },
        relations: ["table", "customer", "status"],
      });

      if (pendingExpired.length > 0) {
        const updatePendingResult = await this.reservationRepo
          .createQueryBuilder()
          .update(Reservation)
          .set({
            status_id: expiredStatus.id,
            cancel_reason: "Hệ thống tự động hủy do quá 15 phút chưa được nhân viên duyệt",
            cancelled_at: now,
            updated_at: now,
          })
          .where("status_id = :statusId", { statusId: pendingStatus.id })
          .andWhere("created_at < :fifteenMinutesAgo", { fifteenMinutesAgo })
          .execute();

        if (updatePendingResult.affected && updatePendingResult.affected > 0) {
          this.logger.log(
            `[AUTO-CANCEL] Cancelled ${updatePendingResult.affected} PENDING reservation(s) after 15 minutes`,
          );

          // Emit và cập nhật table status
          for (const reservation of pendingExpired) {
            const reloaded = await this.reservationRepo.findOne({
              where: { id: reservation.id },
              relations: ["table", "customer", "status"],
            });
            if (reloaded) {
              this.reservationsGateway.emitReservation(
                "reservation.expired",
                reloaded,
              );
              if (reloaded.table_id) {
                await this.reservationsService.updateTableStatus(
                  reloaded.table_id,
                  "EXPIRED",
                );
              }
            }
          }
        }
      }

      // 2. Tìm CONFIRMED reservation tới giờ mà khách chưa check-in
      const expiredReservations = await this.reservationRepo.find({
        where: {
          status_id: confirmedStatus.id,
          expires_at: LessThan(now),
          check_in_time: IsNull(),
        },
        relations: ["table", "customer", "status"],
      });

      if (expiredReservations.length === 0) {
        return; // Không có gì để expire
      }

      // Cập nhật CONFIRMED reservation thành EXPIRED
      const updateResult = await this.reservationRepo
        .createQueryBuilder()
        .update(Reservation)
        .set({
          status_id: expiredStatus.id,
          updated_at: new Date(),
        })
        .where("status_id = :statusId", {
          statusId: confirmedStatus.id,
        })
        .andWhere("expires_at < :now", { now })
        .andWhere("check_in_time IS NULL")
        .execute();

      if (updateResult.affected && updateResult.affected > 0) {
        this.logger.log(
          `[EXPIRE] Expired ${updateResult.affected} CONFIRMED reservation(s)`,
        );

        // Reload và emit cho frontend + cập nhật table status
        for (const reservation of expiredReservations) {
          const reloaded = await this.reservationRepo.findOne({
            where: { id: reservation.id },
            relations: ["table", "customer", "status"],
          });
          if (reloaded) {
            this.reservationsGateway.emitReservation(
              "reservation.expired",
              reloaded,
            );
            // Cập nhật table status về AVAILABLE
            if (reloaded.table_id) {
              await this.reservationsService.updateTableStatus(
                reloaded.table_id,
                "EXPIRED",
              );
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`[EXPIRE] Error handling expired reservations:`, error);
    }
  }
}
