import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { TableStatus } from '../tables/entities/table-status.entity';
import { ReservationStatus } from '../reservations/entities/reservation-status.entity';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@cafe.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Admin User';
const ADMIN_ROLE_NAME = 'ADMIN';
const STAFF_ROLE_NAME = 'STAFF';
const CUSTOMER_ROLE_NAME = 'CUSTOMER';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.ensureRoles();
    await this.ensureTableStatuses();
    await this.ensureReservationStatuses();
    await this.ensureAdminUser();
  }

  private async ensureRoles() {
    const roleRepository = this.dataSource.getRepository(Role);

    for (const roleName of [ADMIN_ROLE_NAME, STAFF_ROLE_NAME, CUSTOMER_ROLE_NAME]) {
      let role = await roleRepository.findOne({ where: { name: roleName } });
      if (!role) {
        role = roleRepository.create({ name: roleName });
        await roleRepository.save(role);
        this.logger.log(`✓ Created role '${roleName}'`);
      }
    }
  }

  private async ensureTableStatuses() {
    const statusRepository = this.dataSource.getRepository(TableStatus);
    
    const statuses = ['AVAILABLE', 'PENDING', 'RESERVED', 'OCCUPIED', 'DISABLED'];
    
    for (const statusName of statuses) {
      let status = await statusRepository.findOne({ where: { name: statusName } });
      if (!status) {
        status = statusRepository.create({ name: statusName });
        await statusRepository.save(status);
        this.logger.log(`✓ Created table status '${statusName}'`);
      }
    }
  }

  private async ensureReservationStatuses() {
    const statusRepository = this.dataSource.getRepository(ReservationStatus);
    
    const statuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];
    
    for (const statusName of statuses) {
      let status = await statusRepository.findOne({ where: { name: statusName } });
      if (!status) {
        status = statusRepository.create({ name: statusName });
        await statusRepository.save(status);
        this.logger.log(`✓ Created reservation status '${statusName}'`);
      }
    }
  }

  private async ensureAdminUser() {
    const roleRepository = this.dataSource.getRepository(Role);
    const userRepository = this.dataSource.getRepository(User);

    const adminRole = await roleRepository.findOne({ where: { name: ADMIN_ROLE_NAME } });
    if (!adminRole) {
      this.logger.error(`Admin role not found!`);
      return;
    }

    let existingAdmin = await userRepository.findOne({ where: { email: ADMIN_EMAIL } });
    
    if (existingAdmin) {
      this.logger.log(`✓ Admin user already exists: ${ADMIN_EMAIL}`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const adminUser = userRepository.create({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      user_name: ADMIN_NAME,
      role_id: adminRole.id,
      role: adminRole,
      is_active: true,
      is_locked: false,
    });

    await userRepository.save(adminUser);
    this.logger.log(`✓ Created admin user: ${ADMIN_EMAIL} (password: ${ADMIN_PASSWORD})`);
  }
}
