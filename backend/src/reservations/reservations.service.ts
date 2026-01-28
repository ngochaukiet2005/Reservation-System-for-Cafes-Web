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

// Thời gian giữ bàn tính từ start_time (ms). Hiện tại: ~1 phút 40 giây.
const HOLD_WINDOW_MS = 100 * 1000;
// Thời gian chờ duyệt tối thiểu cho khách đặt online (ms)
const CUSTOMER_MIN_LEAD_MS = 15 * 60 * 1000;

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
  }, user?: User): Promise<Reservation[]> {
    const query = this.reservationRepo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.table", "table")
      .leftJoinAndSelect("r.status", "status")
      .leftJoinAndSelect("r.customer", "customer");

    // Chỉ khách hàng xem được đơn của chính họ
    if (user?.role?.name === "CUSTOMER") {
      query.andWhere("r.customer_id = :customerId", { customerId: user.id });
    }

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

  async findByTable(
    tableId: string,
    date?: string,
  ): Promise<{ reservations: Reservation[]; earliestTime?: string; lockedAfter?: boolean }> {
    const query = this.reservationRepo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.table", "table")
      .leftJoinAndSelect("r.status", "status")
      .leftJoinAndSelect("r.customer", "customer")
      .where("r.table_id = :tableId", { tableId })
      .andWhere("status.name IN (:...statuses)", {
        statuses: ["PENDING", "CONFIRMED", "OCCUPIED"],
      });

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.andWhere("r.start_time BETWEEN :startDate AND :endDate", {
        startDate,
        endDate,
      });
    }

    const reservations = await query.orderBy("r.start_time", "ASC").getMany();

    // Trả về kèm thông tin earliest time nếu có
    if (reservations.length > 0) {
      const earliestTime = reservations[0].start_time.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return {
        reservations,
        earliestTime,
        lockedAfter: true,
      };
    }

    return { reservations };
  }

  async findOne(id: string, user?: User): Promise<Reservation> {
    const reservation = await this.reservationRepo.findOne({
      where: { id },
      relations: ["table", "customer", "status"],
    });
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    // Khách chỉ xem được đơn của mình
    if (user?.role?.name === "CUSTOMER" && `${reservation.customer_id}` !== `${user.id}`) {
      throw new BadRequestException("Bạn không có quyền xem đặt bàn này");
    }

    return reservation;
  }

  /**
   * Kiểm tra xung đột đặt bàn
   * Logic mới: Nếu đã có reservation trong ngày, chỉ cho đặt TRƯỚC reservation đầu tiên
   * Mọi thời gian SAU reservation đầu tiên bị khóa cho đến khi checkout
   * @param tableId ID của bàn cần kiểm tra
   * @param startTime Thời gian bắt đầu đặt
   * @param date Ngày đặt (YYYY-MM-DD)
   * @param excludeReservationId ID reservation cần loại trừ (dùng khi update)
   * @returns { hasConflict: boolean, earliestTime?: string, message?: string }
   */
  private async checkTableConflict(
    tableId: string,
    startTime: Date,
    date: string,
    excludeReservationId?: string,
  ): Promise<{ hasConflict: boolean; earliestTime?: Date; message?: string }> {
    // Yêu cầu: mọi đặt bàn sau slot đầu tiên phải cách ít nhất 1 giờ trước giờ sớm nhất
    const MIN_LEAD_MS = 60 * 60 * 1000;
    // Lấy các status active
    const activeStatuses = await this.statusRepo.find({
      where: [{ name: "PENDING" }, { name: "CONFIRMED" }, { name: "OCCUPIED" }],
    });
    const activeStatusIds = activeStatuses.map((s) => s.id);

    if (activeStatusIds.length === 0) {
      return { hasConflict: false };
    }

    // Tìm reservation đầu tiên trong ngày
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const query = this.reservationRepo
      .createQueryBuilder("r")
      .where("r.table_id = :tableId", { tableId })
      .andWhere("r.status_id IN (:...statusIds)", {
        statusIds: activeStatusIds,
      })
      .andWhere("r.start_time BETWEEN :dayStart AND :dayEnd", {
        dayStart,
        dayEnd,
      });

    if (excludeReservationId) {
      query.andWhere("r.id != :excludeId", { excludeId: excludeReservationId });
    }

    const existingReservations = await query
      .orderBy("r.start_time", "ASC")
      .getMany();

    if (existingReservations.length === 0) {
      return { hasConflict: false };
    }

    // Lấy reservation đầu tiên
    const earliestReservation = existingReservations[0];
    const earliestTime = earliestReservation.start_time;

    // Chỉ cho đặt trước (earliest - 1h). Ví dụ earliest = 11:00 → đặt muộn nhất 10:00.
    const latestAllowed = new Date(earliestTime.getTime() - MIN_LEAD_MS);
    if (startTime > latestAllowed) {
      const timeStr = earliestTime.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const latestStr = latestAllowed.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return {
        hasConflict: true,
        earliestTime,
        message: `Bàn đã có khách lúc ${timeStr}. Bạn chỉ có thể đặt sớm hơn hoặc bằng ${latestStr}.`,
      };
    }

    return { hasConflict: false };
  }

  /** Lấy chuỗi ngày theo local (YYYY-MM-DD) để tránh lệch timezone */
  private getLocalDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, "0");
    const d = `${date.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  /**
   * Cập nhật table status dựa trên reservation status
   * PENDING → PENDING (Chờ duyệt)
   * CONFIRMED → RESERVED (Đã xác nhận)
   * OCCUPIED → OCCUPIED (Đang sử dụng)
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
    if (!table) {
      console.log(`[UPDATE_TABLE_STATUS] Table ${tableId} not found`);
      return;
    }

    console.log(`[UPDATE_TABLE_STATUS] Table ${tableId} current status: ${table.status?.name}, reservation status: ${reservationStatus}`);

    // Nếu bàn đang MAINTENANCE/DISABLED, không tự động thay đổi
    if (
      table.status?.name === "MAINTENANCE" ||
      table.status?.name === "DISABLED"
    ) {
      console.log(`[UPDATE_TABLE_STATUS] Table ${tableId} is ${table.status?.name}, skipping auto-update`);
      return;
    }

    let targetStatusName: string;

    if (reservationStatus === "OCCUPIED") {
      targetStatusName = "OCCUPIED";
    } else if (reservationStatus === "PENDING") {
      targetStatusName = "PENDING";
    } else if (reservationStatus === "CONFIRMED") {
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
      // FIX: Kiểm tra cả start_time và end_time để đảm bảo reservation chưa kết thúc
      // r.start_time <= :now để không lấy reservation trong tương lai
      // r.end_time > :now để đảm bảo reservation vẫn còn hiệu lực
      const activeReservations = await this.reservationRepo
        .createQueryBuilder("r")
        .where("r.table_id = :tableId", { tableId })
        .andWhere("r.status_id IN (:...statusIds)", {
          statusIds: activeStatusIds,
        })
        .andWhere("r.start_time <= :now", { now })
        .andWhere("r.end_time > :now", { now })
        .getCount();

      if (activeReservations > 0) {
        // Kiểm tra xem có reservation nào PENDING không
        const pendingStatus = await this.statusRepo.findOne({ where: { name: "PENDING" } });
        if (pendingStatus) {
          const hasPending = await this.reservationRepo
            .createQueryBuilder("r")
            .where("r.table_id = :tableId", { tableId })
            .andWhere("r.status_id = :pendingId", { pendingId: pendingStatus.id })
            .andWhere("r.start_time <= :now", { now })
            .andWhere("r.end_time > :now", { now })
            .getCount();
          
          targetStatusName = hasPending > 0 ? "PENDING" : "RESERVED";
        } else {
          targetStatusName = "RESERVED";
        }
      } else {
        targetStatusName = "AVAILABLE";
      }
    }

    // Lấy target status từ DB
    const targetStatus = await this.tableStatusRepo.findOne({
      where: { name: targetStatusName },
    });
    if (!targetStatus) {
      console.log(`[UPDATE_TABLE_STATUS] Target status ${targetStatusName} not found in DB`);
      return;
    }

    if (table.status_id === targetStatus.id) {
      console.log(`[UPDATE_TABLE_STATUS] Table ${tableId} already has status ${targetStatusName}`);
      return; // Đã đúng status rồi
    }

    // Cập nhật table status - dùng query builder để đảm bảo lưu đúng
    console.log(`[UPDATE_TABLE_STATUS] Updating table ${tableId} from ${table.status?.name} to ${targetStatusName}`);
    
    await this.tableRepo
      .createQueryBuilder()
      .update(CafeTable)
      .set({
        status_id: String(targetStatus.id),
        updated_at: new Date(),
      })
      .where("id = :id", { id: tableId })
      .execute();

    // Reload table với status mới
    const updatedTable = await this.tableRepo.findOne({
      where: { id: tableId },
      relations: ["status"],
    });

    console.log(`[UPDATE_TABLE_STATUS] Table ${tableId} updated successfully. New status: ${updatedTable?.status?.name}`);

    // Emit socket event với dữ liệu đầy đủ
    this.reservationsGateway.emitTable("table.updated", updatedTable);
  }

  async create(dto: any, userId: string, userRole?: string): Promise<Reservation> {
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

    // Khách hàng đặt online phải chọn thời gian sau hiện tại ít nhất 15 phút
    const role = (userRole || "").toUpperCase();
    if (role === "CUSTOMER") {
      const now = new Date();
      const minAllowed = new Date(now.getTime() + CUSTOMER_MIN_LEAD_MS);
      if (startTime.getTime() < minAllowed.getTime()) {
        const minStr = minAllowed.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        throw new BadRequestException(
          "Bạn phải đặt bàn sau thời gian hiện tại 15 phút để nhân viên chúng tôi tiếp nhận đơn này",
        );
      }
    }

    // Kiểm tra bàn
    const table = await this.tableRepo.findOne({
      where: { id: dto.table_id },
    });
    if (!table) {
      throw new BadRequestException("Table not found");
    }

    // Backend vẫn kiểm tra chồng chéo để đảm bảo an toàn
    const conflict = await this.checkTableConflict(
      dto.table_id,
      startTime,
      this.getLocalDateKey(startTime),
    );
    if (conflict.hasConflict) {
      throw new BadRequestException(conflict.message);
    }

    // Kiểm tra khách hàng
    const customer = await this.userRepo.findOne({ where: { id: userId } });
    if (!customer) {
      throw new BadRequestException("Customer not found");
    }

    const reservation = this.reservationRepo.create({
      customer_id: userId,
      customer_name: dto.customer_name || customer.user_name,
      customer_phone: dto.customer_phone || customer.phone_number,
      status_id: pendingStatus.id,
      start_time: startTime,
      end_time: endTime,
      num_guests: dto.guest_count || dto.num_guests,
      special_requests: dto.notes || dto.special_requests,
      table_id: dto.table_id,
      created_by: userId,
      // Hold bàn đến start_time + grace period cho khách check-in
      expires_at: new Date(startTime.getTime() + HOLD_WINDOW_MS),
    });

    const savedReservation = await this.reservationRepo.save(reservation);

    console.log(`[CREATE_RESERVATION] Created reservation #${savedReservation.id} for table ${dto.table_id}`);

    // Cập nhật table status
    if (dto.table_id) {
      await this.updateTableStatus(dto.table_id, "PENDING");
    }

    // Reload with relations để get đầy đủ data (bao gồm table.status mới)
    const reloaded = await this.reservationRepo.findOne({
      where: { id: savedReservation.id },
      relations: ["table", "table.status", "customer", "status"],
    });

    console.log(`[CREATE_RESERVATION] Emitting reservation.created with table status: ${reloaded?.table?.status?.name}`);
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

    // Chuẩn hóa dữ liệu thời gian và bàn mới (nếu có)
    const newStart = new Date(dto.reservation_time || dto.start_time || reservation.start_time);

    // Khách hàng online không được dời giờ về quá gần hiện tại (>= 15 phút)
    if (role === "CUSTOMER") {
      const now = new Date();
      const minAllowed = new Date(now.getTime() + CUSTOMER_MIN_LEAD_MS);
      if (newStart.getTime() < minAllowed.getTime()) {
        const minStr = minAllowed.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        throw new BadRequestException(
          "Bạn phải đặt bàn sau thời gian này 15 phút để nhân viên chúng tôi tiếp nhận đơn này",
        );
      }
    }

    const targetTableId = dto.table_id || reservation.table_id;

    // Kiểm tra chồng chéo theo rule mới
    const conflict = await this.checkTableConflict(
      String(targetTableId),
      newStart,
      this.getLocalDateKey(newStart),
      reservation.id,
    );
    if (conflict.hasConflict) {
      throw new BadRequestException(conflict.message);
    }

    Object.assign(reservation, dto);
    reservation.start_time = newStart;
    reservation.end_time = new Date(newStart.getTime() + 60 * 60 * 1000);
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
