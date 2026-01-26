import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Reservation } from "./entities/reservation.entity";
import { ReservationStatus } from "./entities/reservation-status.entity";
import { CafeTable } from "../tables/entities/table.entity";
import { TableStatus } from "../tables/entities/table-status.entity";
import { User } from "../users/entities/user.entity";
import { ReservationsGateway } from "./reservations.gateway";

// Thời gian giữ bàn tính từ start_time (ms). Hiện tại: 1 phút.
const HOLD_WINDOW_MS = 60 * 1000;

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(ReservationStatus)
    private readonly statusRepo: Repository<ReservationStatus>,
    @InjectRepository(CafeTable)
    private readonly tableRepo: Repository<CafeTable>,
    @InjectRepository(TableStatus)
    private readonly tableStatusRepo: Repository<TableStatus>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly reservationsGateway: ReservationsGateway,
  ) {}

  async findAll(filters?: {
    status?: string;
    date?: string;
  }): Promise<Reservation[]> {
    const query = this.reservationRepo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.table", "table")
      .leftJoinAndSelect("r.status", "status")
      .leftJoinAndSelect("r.customer", "customer");

    if (filters?.status) {
      const statusRecord = await this.statusRepo.findOne({
        where: { name: filters.status },
      });
      if (statusRecord) {
        query.andWhere("r.status_id = :statusId", {
          statusId: statusRecord.id,
        });
      }
    }

    if (filters?.date) {
      const startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);
      query.andWhere("r.start_time BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });
    }

    return query.orderBy("r.start_time", "ASC").getMany();
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepo.findOne({
      where: { id },
      relations: ["table", "customer", "status"],
    });
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }
    return reservation;
  }

  /**
   * Kiểm tra xung đột đặt bàn (trùng bàn/giờ)
   * @param tableId ID của bàn cần kiểm tra
   * @param startTime Thời gian bắt đầu
   * @param endTime Thời gian kết thúc
   * @param excludeReservationId ID reservation cần loại trừ (dùng khi update)
   * @returns true nếu có xung đột, false nếu không
   */
  private async checkTableConflict(
    tableId: string,
    startTime: Date,
    endTime: Date,
    excludeReservationId?: string,
  ): Promise<boolean> {
    // Lấy các status active (có thể gây xung đột)
    const activeStatuses = await this.statusRepo.find({
      where: [{ name: "PENDING" }, { name: "CONFIRMED" }, { name: "OCCUPIED" }],
    });
    const activeStatusIds = activeStatuses.map((s) => s.id);

    if (activeStatusIds.length === 0) {
      return false; // Không có status active nào
    }

    // Tìm reservation trùng lặp
    const query = this.reservationRepo
      .createQueryBuilder("r")
      .where("r.table_id = :tableId", { tableId })
      .andWhere("r.status_id IN (:...statusIds)", {
        statusIds: activeStatusIds,
      })
      .andWhere("(r.start_time < :endTime AND r.end_time > :startTime)", {
        startTime,
        endTime,
      });

    // Loại trừ reservation hiện tại nếu đang update
    if (excludeReservationId) {
      query.andWhere("r.id != :excludeId", { excludeId: excludeReservationId });
    }

    const conflictCount = await query.getCount();
    return conflictCount > 0;
  }

  /**
   * Cập nhật table status dựa trên reservation status
   * PENDING/CONFIRMED → RESERVED
   * OCCUPIED → OCCUPIED
   * CANCELLED/COMPLETED/NO_SHOW/EXPIRED → AVAILABLE (nếu không còn reservation nào khác)
   * Public method để scheduler có thể gọi
   */
  async updateTableStatus(
    tableId: string,
    reservationStatus: string,
  ): Promise<void> {
    if (!tableId) return;

    const table = await this.tableRepo.findOne({
      where: { id: tableId },
      relations: ["status"],
    });
    if (!table) return;

    // Nếu bàn đang MAINTENANCE/DISABLED, không tự động thay đổi
    if (
      table.status?.name === "MAINTENANCE" ||
      table.status?.name === "DISABLED"
    ) {
      return;
    }

    let targetStatusName: string;

    if (reservationStatus === "OCCUPIED") {
      targetStatusName = "OCCUPIED";
    } else if (["PENDING", "CONFIRMED"].includes(reservationStatus)) {
      targetStatusName = "RESERVED";
    } else {
      // CANCELLED, COMPLETED, NO_SHOW, EXPIRED → kiểm tra xem còn reservation active nào không
      const activeStatuses = await this.statusRepo.find({
        where: [
          { name: "PENDING" },
          { name: "CONFIRMED" },
          { name: "OCCUPIED" },
        ],
      });
      const activeStatusIds = activeStatuses.map((s) => s.id);

      const now = new Date();
      const activeReservations = await this.reservationRepo
        .createQueryBuilder("r")
        .where("r.table_id = :tableId", { tableId })
        .andWhere("r.status_id IN (:...statusIds)", {
          statusIds: activeStatusIds,
        })
        .andWhere("r.end_time > :now", { now })
        .getCount();

      targetStatusName = activeReservations > 0 ? "RESERVED" : "AVAILABLE";
    }

    // Lấy target status từ DB
    const targetStatus = await this.tableStatusRepo.findOne({
      where: { name: targetStatusName },
    });
    if (!targetStatus || table.status_id === targetStatus.id) {
      return; // Đã đúng status rồi
    }

    // Cập nhật table status
    table.status_id = targetStatus.id;
    await this.tableRepo.save(table);

    // Emit socket event để frontend biết table đã update
    this.reservationsGateway.emitTable("table.updated", { tableId });
  }

  async create(dto: any, userId: string): Promise<Reservation> {
    // Validate table_id
    if (!dto.table_id) {
      throw new BadRequestException(
        "table_id is required. Please select a table.",
      );
    }

    // Lấy status PENDING
    const pendingStatus = await this.statusRepo.findOne({
      where: { name: "PENDING" },
    });
    if (!pendingStatus) {
      throw new BadRequestException("PENDING status not found");
    }

    const startTime = new Date(dto.reservation_time || dto.start_time);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 giờ sau

    // Kiểm tra bàn
    const table = await this.tableRepo.findOne({
      where: { id: dto.table_id },
    });
    if (!table) {
      throw new BadRequestException("Table not found");
    }

    // Kiểm tra xung đột đặt bàn
    const hasConflict = await this.checkTableConflict(
      dto.table_id,
      startTime,
      endTime,
    );
    if (hasConflict) {
      throw new BadRequestException(
        "Bàn này đã được đặt trong khung giờ này. Vui lòng chọn bàn khác hoặc thời gian khác.",
      );
    }

    // Kiểm tra khách hàng
    const customer = await this.userRepo.findOne({ where: { id: userId } });
    if (!customer) {
      throw new BadRequestException("Customer not found");
    }

    const reservation = this.reservationRepo.create({
      customer_id: userId,
      status_id: pendingStatus.id,
      start_time: startTime,
      end_time: endTime,
      num_guests: dto.guest_count || dto.num_guests,
      special_requests: dto.notes || dto.special_requests,
      table_id: dto.table_id,
      created_by: userId,
      // Giữ bàn tới 1 phút sau giờ bắt đầu (hold window)
      expires_at: new Date(startTime.getTime() + HOLD_WINDOW_MS),
    });

    const savedReservation = await this.reservationRepo.save(reservation);

    // Cập nhật table status
    if (dto.table_id) {
      await this.updateTableStatus(dto.table_id, "PENDING");
    }

    // Reload with relations để get đầy đủ data
    const reloaded = await this.reservationRepo.findOne({
      where: { id: savedReservation.id },
      relations: ["table", "customer", "status"],
    });
    this.reservationsGateway.emitReservation("reservation.created", reloaded);
    return reloaded;
  }

  async update(
    id: string,
    dto: any,
    userId: string,
    userRole?: string,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);

    const role = (userRole || "").toUpperCase();
    // Kiểm tra quyền: CUSTOMER chỉ được update reservation của mình
    const isOwner = `${reservation.customer_id}` === `${userId}`;
    if (role === "CUSTOMER" && !isOwner) {
      throw new BadRequestException("Bạn không có quyền chỉnh sửa đặt bàn này");
    }

    Object.assign(reservation, dto);
    reservation.updated_at = new Date();
    return this.reservationRepo.save(reservation);
  }

  async remove(id: string, userId: string, userRole?: string): Promise<void> {
    const reservation = await this.findOne(id);

    const role = (userRole || "").toUpperCase();
    // Kiểm tra quyền: CUSTOMER chỉ được xóa reservation của mình
    const isOwner = `${reservation.customer_id}` === `${userId}`;
    if (role === "CUSTOMER" && !isOwner) {
      throw new BadRequestException("Bạn không có quyền xóa đặt bàn này");
    }

    await this.reservationRepo.remove(reservation);
  }

  async cancel(
    id: string,
    reason?: string,
    userId?: string,
    userRole?: string,
  ): Promise<Reservation> {
    const reservation = await this.findOne(id);

    const role = (userRole || "").toUpperCase();
    // Kiểm tra quyền: CUSTOMER chỉ được hủy reservation của mình
    const isOwner = `${reservation.customer_id}` === `${userId}`;
    if (userId && role === "CUSTOMER" && !isOwner) {
      throw new BadRequestException("Bạn không có quyền hủy đặt bàn này");
    }

    // Nếu PENDING → CANCELLED, nếu CONFIRMED → REQUEST_CANCEL
    let targetStatusName = "CANCELLED";
    if (reservation.status?.name === "CONFIRMED") {
      targetStatusName = "REQUEST_CANCEL";
    }

    const targetStatus = await this.statusRepo.findOne({
      where: { name: targetStatusName },
    });
    if (!targetStatus) {
      throw new BadRequestException(
        `${targetStatusName} status not found in database`,
      );
    }

    console.log(
      `[CANCEL] Reservation #${id}: Updating to status ${targetStatusName} (${targetStatus.id})`,
    );

    // Sử dụng query builder để update trực tiếp
    const updateData: any = {
      status_id: targetStatus.id,
      cancel_reason: reason,
      updated_at: new Date(),
    };

    if (targetStatusName === "CANCELLED") {
      updateData.cancelled_at = new Date();
    }

    await this.reservationRepo
      .createQueryBuilder()
      .update(Reservation)
      .set(updateData)
      .where("id = :id", { id })
      .execute();

    // Reload with relations để get đầy đủ data
    const reloaded = await this.reservationRepo.findOne({
      where: { id },
      relations: ["table", "customer", "status"],
    });

    // Cập nhật table status về AVAILABLE nếu cần
    if (reloaded?.table_id) {
      await this.updateTableStatus(reloaded.table_id, targetStatusName);
    }

    this.reservationsGateway.emitReservation("reservation.cancelled", reloaded);
    console.log(`[CANCEL] Reloaded status: ${reloaded?.status?.name}`);
    return reloaded;
  }

  async confirm(id: string): Promise<Reservation> {
    const confirmedStatus = await this.statusRepo.findOne({
      where: { name: "CONFIRMED" },
    });
    if (!confirmedStatus) {
      throw new BadRequestException("CONFIRMED status not found in database");
    }

    console.log(
      `[CONFIRM] Reservation #${id}: Updating to status_id ${confirmedStatus.id}`,
    );

    // Sử dụng query builder để update trực tiếp
    const updateResult = await this.reservationRepo
      .createQueryBuilder()
      .update(Reservation)
      .set({
        status_id: confirmedStatus.id,
        updated_at: new Date(),
      })
      .where("id = :id", { id })
      .execute();

    console.log(`[CONFIRM] Update result:`, updateResult);

    // Reload with relations để get đầy đủ data
    const reloaded = await this.reservationRepo.findOne({
      where: { id },
      relations: ["table", "customer", "status"],
    });

    // Cập nhật table status
    if (reloaded?.table_id) {
      await this.updateTableStatus(reloaded.table_id, "CONFIRMED");
    }

    this.reservationsGateway.emitReservation("reservation.updated", reloaded);
    console.log(
      `[CONFIRM] Reloaded reservation status_id: ${reloaded?.status_id}, status name: ${reloaded?.status?.name}`,
    );
    return reloaded;
  }

  async checkIn(id: string): Promise<Reservation> {
    const occupiedStatus = await this.statusRepo.findOne({
      where: { name: "OCCUPIED" },
    });
    if (!occupiedStatus) {
      throw new BadRequestException("OCCUPIED status not found in database");
    }

    console.log(
      `[CHECK-IN] Reservation #${id}: Updating to status_id ${occupiedStatus.id}`,
    );

    // Sử dụng query builder để update trực tiếp
    await this.reservationRepo
      .createQueryBuilder()
      .update(Reservation)
      .set({
        status_id: occupiedStatus.id,
        check_in_time: new Date(),
        updated_at: new Date(),
      })
      .where("id = :id", { id })
      .execute();

    // Reload with relations để get đầy đủ data
    const reloaded = await this.reservationRepo.findOne({
      where: { id },
      relations: ["table", "customer", "status"],
    });

    // Cập nhật table status
    if (reloaded?.table_id) {
      await this.updateTableStatus(reloaded.table_id, "OCCUPIED");
    }

    this.reservationsGateway.emitReservation("reservation.updated", reloaded);
    console.log(`[CHECK-IN] Reloaded status: ${reloaded?.status?.name}`);
    return reloaded;
  }

  async checkOut(id: string): Promise<Reservation> {
    const completedStatus = await this.statusRepo.findOne({
      where: { name: "COMPLETED" },
    });
    if (!completedStatus) {
      throw new BadRequestException("COMPLETED status not found in database");
    }

    console.log(
      `[CHECK-OUT] Reservation #${id}: Updating to status_id ${completedStatus.id}`,
    );

    // Sử dụng query builder để update trực tiếp
    await this.reservationRepo
      .createQueryBuilder()
      .update(Reservation)
      .set({
        status_id: completedStatus.id,
        check_out_time: new Date(),
        updated_at: new Date(),
      })
      .where("id = :id", { id })
      .execute();

    // Reload with relations để get đầy đủ data
    const reloaded = await this.reservationRepo.findOne({
      where: { id },
      relations: ["table", "customer", "status"],
    });

    // Cập nhật table status về AVAILABLE
    if (reloaded?.table_id) {
      await this.updateTableStatus(reloaded.table_id, "COMPLETED");
    }

    this.reservationsGateway.emitReservation("reservation.updated", reloaded);
    console.log(`[CHECK-OUT] Reloaded status: ${reloaded?.status?.name}`);
    return reloaded;
  }

  async approveCancelRequest(id: string): Promise<Reservation> {
    const cancelledStatus = await this.statusRepo.findOne({
      where: { name: "CANCELLED" },
    });
    if (!cancelledStatus) {
      throw new BadRequestException("CANCELLED status not found in database");
    }

    console.log(
      `[APPROVE-CANCEL] Reservation #${id}: Updating to status_id ${cancelledStatus.id}`,
    );

    // Sử dụng query builder để update trực tiếp
    await this.reservationRepo
      .createQueryBuilder()
      .update(Reservation)
      .set({
        status_id: cancelledStatus.id,
        cancelled_at: new Date(),
        updated_at: new Date(),
      })
      .where("id = :id", { id })
      .execute();

    // Reload with relations để get đầy đủ data
    const reloaded = await this.reservationRepo.findOne({
      where: { id },
      relations: ["table", "customer", "status"],
    });

    // Cập nhật table status về AVAILABLE
    if (reloaded?.table_id) {
      await this.updateTableStatus(reloaded.table_id, "CANCELLED");
    }

    this.reservationsGateway.emitReservation("reservation.cancelled", reloaded);
    console.log(`[APPROVE-CANCEL] Reloaded status: ${reloaded?.status?.name}`);
    return reloaded;
  }

  async rejectCancelRequest(id: string): Promise<Reservation> {
    const confirmedStatus = await this.statusRepo.findOne({
      where: { name: "CONFIRMED" },
    });
    if (!confirmedStatus) {
      throw new BadRequestException("CONFIRMED status not found in database");
    }

    console.log(
      `[REJECT-CANCEL] Reservation #${id}: Updating status_id back to ${confirmedStatus.id}`,
    );

    // Sử dụng query builder để update trực tiếp
    await this.reservationRepo
      .createQueryBuilder()
      .update(Reservation)
      .set({
        status_id: confirmedStatus.id,
        updated_at: new Date(),
      })
      .where("id = :id", { id })
      .execute();

    // Reload with relations để get đầy đủ data
    const reloaded = await this.reservationRepo.findOne({
      where: { id },
      relations: ["table", "customer", "status"],
    });

    // Cập nhật table status về RESERVED
    if (reloaded?.table_id) {
      await this.updateTableStatus(reloaded.table_id, "CONFIRMED");
    }

    this.reservationsGateway.emitReservation("reservation.updated", reloaded);
    console.log(`[REJECT-CANCEL] Reloaded status: ${reloaded?.status?.name}`);
    return reloaded;
  }
}
