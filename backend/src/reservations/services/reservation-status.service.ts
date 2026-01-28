import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { ReservationStatus } from '../entities/reservation-status.entity';
import { CafeTable } from '../../tables/entities/table.entity';
import { TableStatus } from '../../tables/entities/table-status.entity';
import { ReservationsGateway } from '../reservations.gateway';

@Injectable()
export class ReservationStatusService {
  private readonly logger = new Logger(ReservationStatusService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(ReservationStatus)
    private readonly statusRepo: Repository<ReservationStatus>,
    @InjectRepository(CafeTable)
    private readonly tableRepo: Repository<CafeTable>,
    @InjectRepository(TableStatus)
    private readonly tableStatusRepo: Repository<TableStatus>,
    private readonly reservationsGateway: ReservationsGateway,
  ) {}

  async getStatus(statusName: string): Promise<ReservationStatus> {
    return this.statusRepo.findOne({ where: { name: statusName } });
  }

  async updateTableStatus(
    tableId: string,
    reservationStatus: string,
  ): Promise<void> {
    if (!tableId) return;

    const table = await this.tableRepo.findOne({
      where: { id: tableId },
      relations: ['status'],
    });

    if (!table) {
      this.logger.log(`[UPDATE_TABLE_STATUS] Table ${tableId} not found`);
      return;
    }

    // Skip if table is in maintenance/disabled state
    if (
      table.status?.name === 'MAINTENANCE' ||
      table.status?.name === 'DISABLED'
    ) {
      this.logger.log(
        `[UPDATE_TABLE_STATUS] Table ${tableId} is ${table.status?.name}, skipping auto-update`,
      );
      return;
    }

    const targetStatusName = await this.resolveTableStatus(
      tableId,
      reservationStatus,
    );

    if (!targetStatusName) {
      this.logger.log(
        `[UPDATE_TABLE_STATUS] Could not resolve target status for reservation status: ${reservationStatus}`,
      );
      return;
    }

    if (table.status?.name === targetStatusName) {
      this.logger.log(
        `[UPDATE_TABLE_STATUS] Table ${tableId} already has status ${targetStatusName}`,
      );
      return;
    }

    const targetStatus = await this.tableStatusRepo.findOne({
      where: { name: targetStatusName },
    });

    if (!targetStatus) {
      this.logger.log(`[UPDATE_TABLE_STATUS] Target status ${targetStatusName} not found in DB`);
      return;
    }

    this.logger.log(
      `[UPDATE_TABLE_STATUS] Updating table ${tableId} from ${table.status?.name} to ${targetStatusName}`,
    );

    await this.tableRepo
      .createQueryBuilder()
      .update(CafeTable)
      .set({
        status_id: String(targetStatus.id),
        updated_at: new Date(),
      })
      .where('id = :id', { id: tableId })
      .execute();

    const updatedTable = await this.tableRepo.findOne({
      where: { id: tableId },
      relations: ['status'],
    });

    this.logger.log(
      `[UPDATE_TABLE_STATUS] Table ${tableId} updated successfully. New status: ${updatedTable?.status?.name}`,
    );

    this.reservationsGateway.emitTable('table.updated', updatedTable);
  }

  private async resolveTableStatus(
    tableId: string,
    reservationStatus: string,
  ): Promise<string> {
    switch (reservationStatus) {
      case 'OCCUPIED':
        return 'OCCUPIED';
      case 'PENDING':
        return 'PENDING';
      case 'CONFIRMED':
        return 'RESERVED';
      case 'CANCELLED':
      case 'COMPLETED':
      case 'NO_SHOW':
      case 'EXPIRED':
        return await this.resolveAvailabilityStatus(tableId);
      default:
        return null;
    }
  }

  private async resolveAvailabilityStatus(tableId: string): Promise<string> {
    const activeStatuses = await this.statusRepo.find({
      where: [{ name: 'PENDING' }, { name: 'CONFIRMED' }, { name: 'OCCUPIED' }],
    });
    const activeStatusIds = activeStatuses.map((s) => s.id);

    const now = new Date();
    const activeReservations = await this.reservationRepo
      .createQueryBuilder('r')
      .where('r.table_id = :tableId', { tableId })
      .andWhere('r.status_id IN (:...statusIds)', { statusIds: activeStatusIds })
      .andWhere('r.start_time <= :now', { now })
      .andWhere('r.end_time > :now', { now })
      .getCount();

    if (activeReservations === 0) {
      return 'AVAILABLE';
    }

    const pendingStatus = await this.statusRepo.findOne({
      where: { name: 'PENDING' },
    });

    if (!pendingStatus) {
      return 'RESERVED';
    }

    const hasPending = await this.reservationRepo
      .createQueryBuilder('r')
      .where('r.table_id = :tableId', { tableId })
      .andWhere('r.status_id = :pendingId', { pendingId: pendingStatus.id })
      .andWhere('r.start_time <= :now', { now })
      .andWhere('r.end_time > :now', { now })
      .getCount();

    return hasPending > 0 ? 'PENDING' : 'RESERVED';
  }
}
