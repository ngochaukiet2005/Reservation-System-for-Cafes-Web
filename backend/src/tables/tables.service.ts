import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { CafeTable } from "./entities/table.entity";
import { TableStatus } from "./entities/table-status.entity";
import { Reservation } from "../reservations/entities/reservation.entity";
import { CreateTableDto } from "./dto/create-table.dto";
import { UpdateTableDto } from "./dto/update-table.dto";
import { FilterAvailableTablesDto } from "./dto/filter-available-tables.dto";

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(CafeTable)
    private readonly tableRepo: Repository<CafeTable>,
    @InjectRepository(TableStatus)
    private readonly statusRepo: Repository<TableStatus>,
  ) {}

  async findAll(): Promise<any[]> {
    // Lấy tất cả bàn cùng status hiện tại
    const tables = await this.tableRepo.find({
      relations: ["status"],
      order: { sort_order: "ASC", id: "ASC" },
    });

    // Lấy tất cả reservation ACTIVE trong tương lai để kiểm tra bàn nào đang được đặt
    const reservationRepo = this.tableRepo.manager.getRepository(Reservation);
    const now = new Date();

    const activeReservations = await reservationRepo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.status", "s")
      .where("r.end_time > :now", { now })
      .andWhere("s.name IN (:...activeStatuses)", {
        activeStatuses: ["PENDING", "CONFIRMED", "OCCUPIED"],
      })
      .getMany();

    // Tạo map: table_id -> reservation để lookup nhanh
    const reservedTableMap = new Map<string, Reservation>();
    activeReservations.forEach((res) => {
      if (!reservedTableMap.has(res.table_id)) {
        reservedTableMap.set(res.table_id, res);
      }
    });

    // Cập nhật trạng thái bàn dựa trên reservation
    return tables.map((table) => {
      const hasActiveReservation = reservedTableMap.has(table.id);

      // Nếu bàn đang MAINTENANCE/DISABLED → giữ nguyên
      if (
        table.status?.name === "MAINTENANCE" ||
        table.status?.name === "DISABLED"
      ) {
        return table;
      }

      // Nếu có active reservation → trả về status RESERVED/OCCUPIED
      if (hasActiveReservation) {
        const reservation = reservedTableMap.get(table.id)!;
        // Override status dựa trên reservation status
        return {
          ...table,
          status: {
            ...table.status,
            name:
              reservation.status?.name === "OCCUPIED" ? "OCCUPIED" : "RESERVED",
          },
          _display_status:
            reservation.status?.name === "OCCUPIED" ? "OCCUPIED" : "RESERVED",
        };
      }

      // Nếu không có active reservation → AVAILABLE
      return {
        ...table,
        status: {
          ...table.status,
          name: "AVAILABLE",
        },
        _display_status: "AVAILABLE",
      };
    });
  }

  async findOne(id: string): Promise<CafeTable> {
    const table = await this.tableRepo.findOne({
      where: { id },
      relations: ["status"],
    });
    if (!table) throw new NotFoundException(`Table with ID ${id} not found`);
    return table;
  }

  async create(dto: CreateTableDto): Promise<CafeTable> {
    // Check if name already exists
    const existing = await this.tableRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Table with name "${dto.name}" already exists`,
      );
    }

    // Find AVAILABLE status
    const availableStatus = await this.statusRepo.findOne({
      where: { name: "AVAILABLE" },
    });
    if (!availableStatus) {
      throw new NotFoundException(
        "AVAILABLE status not found. Please run seed first.",
      );
    }

    const table = this.tableRepo.create({
      name: dto.name,
      capacity: dto.capacity,
      type: dto.type,
      status_id: availableStatus.id,
    });

    const saved = await this.tableRepo.save(table);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateTableDto): Promise<CafeTable> {
    const table = await this.findOne(id);

    // Check name uniqueness if changed
    if (dto.name && dto.name !== table.name) {
      const existing = await this.tableRepo.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(
          `Table with name "${dto.name}" already exists`,
        );
      }
    }

    // Validate status_id if provided
    if (dto.status_id !== undefined) {
      const statusId = String(dto.status_id); // Convert number to string for bigint comparison
      const status = await this.statusRepo.findOne({ where: { id: statusId } });
      if (!status) {
        throw new NotFoundException(
          `Status with ID ${dto.status_id} not found`,
        );
      }
      table.status = status;
      table.status_id = status.id;
    }

    Object.assign(table, {
      name: dto.name ?? table.name,
      capacity: dto.capacity ?? table.capacity,
      type: dto.type ?? table.type,
      disabled_reason: dto.disabled_reason ?? table.disabled_reason,
    });
    table.updated_at = new Date();
    await this.tableRepo.save(table);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const table = await this.findOne(id);

    // Kiểm tra xem bàn có đặt chỗ đang hoạt động không (PENDING, CONFIRMED, OCCUPIED)
    const reservationRepo = this.tableRepo.manager.getRepository(Reservation);
    const activeReservations = await reservationRepo
      .createQueryBuilder("r")
      .innerJoin("r.status", "s")
      .where("r.table_id = :tableId", { tableId: id })
      .andWhere("s.name IN (:...activeStatuses)", {
        activeStatuses: ["PENDING", "CONFIRMED", "OCCUPIED"],
      })
      .getCount();

    if (activeReservations > 0) {
      throw new BadRequestException(
        `Không thể xóa bàn "${table.name}" vì có ${activeReservations} đặt chỗ đang hoạt động. Vui lòng hủy hoặc hoàn thành các đặt chỗ trước.`,
      );
    }

    // Xóa tất cả các đặt chỗ của bàn này (bất kể trạng thái) để tránh foreign key constraint
    await reservationRepo.delete({ table_id: id });

    // Xóa bàn
    await this.tableRepo.remove(table);
  }

  async getStatuses(): Promise<TableStatus[]> {
    return this.statusRepo.find();
  }

  async findAvailableTables(
    filterDto: FilterAvailableTablesDto,
  ): Promise<CafeTable[]> {
    // Parse input
    const reservationRepo = this.tableRepo.manager.getRepository(Reservation);
    const date = new Date(filterDto.date);
    const [startHour, startMin] = filterDto.start_time.split(":").map(Number);
    const [endHour, endMin] = filterDto.end_time.split(":").map(Number);

    // Create start_time and end_time for this date
    const startDateTime = new Date(date);
    startDateTime.setHours(startHour, startMin, 0, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endHour, endMin, 0, 0);

    // Get AVAILABLE status
    const availableStatus = await this.statusRepo.findOne({
      where: { name: "AVAILABLE" },
    });
    if (!availableStatus) {
      throw new NotFoundException("AVAILABLE status not found");
    }

    // Get all tables that are AVAILABLE and have capacity >= requested capacity
    const allTables = await this.tableRepo
      .createQueryBuilder("t")
      .leftJoinAndSelect("t.status", "status")
      .where("t.status_id = :statusId", { statusId: availableStatus.id })
      .andWhere("t.capacity >= :capacity", { capacity: filterDto.capacity })
      .orderBy("t.capacity", "ASC")
      .addOrderBy("t.sort_order", "ASC")
      .getMany();

    // Filter out tables that have conflicting reservations
    const conflictingTableIds = await reservationRepo
      .createQueryBuilder("r")
      .select("DISTINCT r.table_id")
      .innerJoin("r.status", "s")
      .where("r.start_time < :endDateTime", { endDateTime })
      .andWhere("r.end_time > :startDateTime", { startDateTime })
      .andWhere("s.name IN (:...activeStatuses)", {
        activeStatuses: ["PENDING", "CONFIRMED", "OCCUPIED"],
      })
      .getRawMany();

    const conflictingIds = new Set(conflictingTableIds.map((r) => r.table_id));

    // Return tables that don't have conflicts
    return allTables.filter((table) => !conflictingIds.has(table.id));
  }
}
