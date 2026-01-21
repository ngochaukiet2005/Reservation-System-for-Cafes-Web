import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { ReservationStatus } from './entities/reservation-status.entity';
import { CafeTable } from '../tables/entities/table.entity';
import { User } from '../users/entities/user.entity';
import { ReservationsGateway } from './reservations.gateway';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(ReservationStatus)
    private readonly statusRepo: Repository<ReservationStatus>,
    @InjectRepository(CafeTable)
    private readonly tableRepo: Repository<CafeTable>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly reservationsGateway: ReservationsGateway,
  ) {}

  async findAll(filters?: { status?: string; date?: string }): Promise<Reservation[]> {
    const query = this.reservationRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.table', 'table')
      .leftJoinAndSelect('r.status', 'status')
      .leftJoinAndSelect('r.customer', 'customer');

    if (filters?.status) {
      const statusRecord = await this.statusRepo.findOne({ where: { name: filters.status } });
      if (statusRecord) {
        query.andWhere('r.status_id = :statusId', { statusId: statusRecord.id });
      }
    }

    if (filters?.date) {
      const startDate = new Date(filters.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(filters.date);
      endDate.setHours(23, 59, 59, 999);
      query.andWhere('r.start_time BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    return query.orderBy('r.start_time', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.reservationRepo.findOne({
      where: { id },
      relations: ['table', 'customer', 'status'],
    });
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }
    return reservation;
  }

  async create(dto: any, userId: string): Promise<Reservation> {
    // Lấy status PENDING
    const pendingStatus = await this.statusRepo.findOne({ where: { name: 'PENDING' } });
    if (!pendingStatus) {
      throw new BadRequestException('PENDING status not found');
    }

    // Kiểm tra bàn nếu có
    if (dto.table_id) {
      const table = await this.tableRepo.findOne({ where: { id: dto.table_id } });
      if (!table) {
        throw new BadRequestException('Table not found');
      }
    }

    // Kiểm tra khách hàng
    const customer = await this.userRepo.findOne({ where: { id: userId } });
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    const reservation = this.reservationRepo.create({
      customer_id: userId,
      status_id: pendingStatus.id,
      start_time: new Date(dto.reservation_time || dto.start_time),
      end_time: new Date((new Date(dto.reservation_time || dto.start_time)).getTime() + 60 * 60 * 1000),
      num_guests: dto.guest_count || dto.num_guests,
      special_requests: dto.notes || dto.special_requests,
      table_id: dto.table_id,
      created_by: userId,
    });

    const savedReservation = await this.reservationRepo.save(reservation);
    // Reload with relations để get đầy đủ data
    const reloaded = await this.reservationRepo.findOne({
      where: { id: savedReservation.id },
      relations: ['table', 'customer', 'status'],
    });
    this.reservationsGateway.emitReservation('reservation.created', reloaded);
    return reloaded;
  }

  async update(id: string, dto: any): Promise<Reservation> {
    const reservation = await this.findOne(id);
    Object.assign(reservation, dto);
    reservation.updated_at = new Date();
    return this.reservationRepo.save(reservation);
  }

  async remove(id: string): Promise<void> {
    const reservation = await this.findOne(id);
    await this.reservationRepo.remove(reservation);
  }

  async cancel(id: string, reason?: string): Promise<Reservation> {
    const reservation = await this.findOne(id);
    
    // Nếu PENDING → CANCELLED, nếu CONFIRMED → REQUEST_CANCEL
    let targetStatusName = 'CANCELLED';
    if (reservation.status?.name === 'CONFIRMED') {
      targetStatusName = 'REQUEST_CANCEL';
    }
    
    const targetStatus = await this.statusRepo.findOne({ where: { name: targetStatusName } });
    if (!targetStatus) {
      throw new BadRequestException(`${targetStatusName} status not found in database`);
    }
    
    console.log(`[CANCEL] Reservation #${id}: Updating to status ${targetStatusName} (${targetStatus.id})`);
    
    // Sử dụng query builder để update trực tiếp
    const updateData: any = { 
      status_id: targetStatus.id,
      cancel_reason: reason,
      updated_at: new Date()
    };
    
    if (targetStatusName === 'CANCELLED') {
      updateData.cancelled_at = new Date();
    }
    
    await this.reservationRepo
      .createQueryBuilder()
      .update(Reservation)
      .set(updateData)
      .where('id = :id', { id })
      .execute();
    
    // Reload with relations để get đầy đủ data
    const reloaded = await this.reservationRepo.findOne({
      where: { id },
      relations: ['table', 'customer', 'status'],
    });
    this.reservationsGateway.emitReservation('reservation.cancelled', reloaded);
    console.log(`[CANCEL] Reloaded status: ${reloaded?.status?.name}`);
    return reloaded;
  }

  async confirm(id: string): Promise<Reservation> {
    const confirmedStatus = await this.statusRepo.findOne({ where: { name: 'CONFIRMED' } });
    if (!confirmedStatus) {
      throw new BadRequestException('CONFIRMED status not found in database');
    }
    
    console.log(`[CONFIRM] Reservation #${id}: Updating to status_id ${confirmedStatus.id}`);
    
    // Sử dụng query builder để update trực tiếp
    const updateResult = await this.reservationRepo
      .createQueryBuilder()
      .update(Reservation)
      .set({ 
        status_id: confirmedStatus.id,
        updated_at: new Date()
      })
      .where('id = :id', { id })
      .execute();
    
    console.log(`[CONFIRM] Update result:`, updateResult);
    
    // Reload with relations để get đầy đủ data
    const reloaded = await this.reservationRepo.findOne({
      where: { id },
      relations: ['table', 'customer', 'status'],
    });
    this.reservationsGateway.emitReservation('reservation.updated', reloaded);
    console.log(`[CONFIRM] Reloaded reservation status_id: ${reloaded?.status_id}, status name: ${reloaded?.status?.name}`);
    return reloaded;
  }

  async checkIn(id: string): Promise<Reservation> {
    const occupiedStatus = await this.statusRepo.findOne({ where: { name: 'OCCUPIED' } });
    if (!occupiedStatus) {
      throw new BadRequestException('OCCUPIED status not found in database');
    }
    
    console.log(`[CHECK-IN] Reservation #${id}: Updating to status_id ${occupiedStatus.id}`);
    
    // Sử dụng query builder để update trực tiếp
    await this.reservationRepo
      .createQueryBuilder()
      .update(Reservation)
      .set({ 
        status_id: occupiedStatus.id,
        check_in_time: new Date(),
        updated_at: new Date()
      })
      .where('id = :id', { id })
      .execute();
    
    // Reload with relations để get đầy đủ data
    const reloaded = await this.reservationRepo.findOne({
      where: { id },
      relations: ['table', 'customer', 'status'],
    });
    this.reservationsGateway.emitReservation('reservation.updated', reloaded);
    console.log(`[CHECK-IN] Reloaded status: ${reloaded?.status?.name}`);
    return reloaded;
  }

  async checkOut(id: string): Promise<Reservation> {
    const completedStatus = await this.statusRepo.findOne({ where: { name: 'COMPLETED' } });
    if (!completedStatus) {
      throw new BadRequestException('COMPLETED status not found in database');
    }
    
    console.log(`[CHECK-OUT] Reservation #${id}: Updating to status_id ${completedStatus.id}`);
    
    // Sử dụng query builder để update trực tiếp
    await this.reservationRepo
      .createQueryBuilder()
      .update(Reservation)
      .set({ 
        status_id: completedStatus.id,
        check_out_time: new Date(),
        updated_at: new Date()
      })
      .where('id = :id', { id })
      .execute();
    
    // Reload with relations để get đầy đủ data
    const reloaded = await this.reservationRepo.findOne({
      where: { id },
      relations: ['table', 'customer', 'status'],
    });
    this.reservationsGateway.emitReservation('reservation.updated', reloaded);
    console.log(`[CHECK-OUT] Reloaded status: ${reloaded?.status?.name}`);
    return reloaded;
  }

    async approveCancelRequest(id: string): Promise<Reservation> {
      const cancelledStatus = await this.statusRepo.findOne({ where: { name: 'CANCELLED' } });
      if (!cancelledStatus) {
        throw new BadRequestException('CANCELLED status not found in database');
      }
      
      console.log(`[APPROVE-CANCEL] Reservation #${id}: Updating to status_id ${cancelledStatus.id}`);
      
      // Sử dụng query builder để update trực tiếp
      await this.reservationRepo
        .createQueryBuilder()
        .update(Reservation)
        .set({ 
          status_id: cancelledStatus.id,
          cancelled_at: new Date(),
          updated_at: new Date()
        })
        .where('id = :id', { id })
        .execute();
      
      // Reload with relations để get đầy đủ data
      const reloaded = await this.reservationRepo.findOne({
        where: { id },
        relations: ['table', 'customer', 'status'],
      });
      this.reservationsGateway.emitReservation('reservation.cancelled', reloaded);
      console.log(`[APPROVE-CANCEL] Reloaded status: ${reloaded?.status?.name}`);
      return reloaded;
    }
  
    async rejectCancelRequest(id: string): Promise<Reservation> {
      const confirmedStatus = await this.statusRepo.findOne({ where: { name: 'CONFIRMED' } });
      if (!confirmedStatus) {
        throw new BadRequestException('CONFIRMED status not found in database');
      }
      
      console.log(`[REJECT-CANCEL] Reservation #${id}: Updating status_id back to ${confirmedStatus.id}`);
      
      // Sử dụng query builder để update trực tiếp
      await this.reservationRepo
        .createQueryBuilder()
        .update(Reservation)
        .set({ 
          status_id: confirmedStatus.id,
          updated_at: new Date()
        })
        .where('id = :id', { id })
        .execute();
      
      // Reload with relations để get đầy đủ data
      const reloaded = await this.reservationRepo.findOne({
        where: { id },
        relations: ['table', 'customer', 'status'],
      });
      this.reservationsGateway.emitReservation('reservation.updated', reloaded);
      console.log(`[REJECT-CANCEL] Reloaded status: ${reloaded?.status?.name}`);
      return reloaded;
    }
}

