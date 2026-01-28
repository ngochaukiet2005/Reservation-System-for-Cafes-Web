import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CafeTable } from '../../tables/entities/table.entity';

const CUSTOMER_MIN_LEAD_MS = 15 * 60 * 1000;

@Injectable()
export class ReservationValidationService {
  constructor(
    @InjectRepository(CafeTable)
    private readonly tableRepo: Repository<CafeTable>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async validateTableId(tableId: string): Promise<CafeTable> {
    if (!tableId) {
      throw new BadRequestException('table_id is required. Please select a table.');
    }

    const table = await this.tableRepo.findOne({ where: { id: tableId } });
    if (!table) {
      throw new BadRequestException('Table not found');
    }

    return table;
  }

  async validateCustomerId(userId: string): Promise<User> {
    const customer = await this.userRepo.findOne({ where: { id: userId } });
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    return customer;
  }

  validateCustomerLeadTime(startTime: Date): void {
    const now = new Date();
    const minAllowed = new Date(now.getTime() + CUSTOMER_MIN_LEAD_MS);

    if (startTime.getTime() < minAllowed.getTime()) {
      const minStr = minAllowed.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      throw new BadRequestException(
        `Bạn phải đặt bàn sau thời gian hiện tại 15 phút để nhân viên chúng tôi tiếp nhận đơn này (muộn nhất: ${minStr})`,
      );
    }
  }

  validateOwnership(
    resourceOwnerId: string,
    userId: string,
    userRole: string,
  ): void {
    if (userRole === 'CUSTOMER') {
      const isOwner = `${resourceOwnerId}` === `${userId}`;
      if (!isOwner) {
        throw new BadRequestException('Bạn không có quyền thực hiện hành động này');
      }
    }
  }
}
