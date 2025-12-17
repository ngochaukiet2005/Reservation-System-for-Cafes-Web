import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@cafe.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@123';
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'Administrator';
const ADMIN_ROLE_NAME = 'admin';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.ensureAdminUser();
  }

  private async ensureAdminUser() {
    const roleRepository = this.dataSource.getRepository(Role);
    const userRepository = this.dataSource.getRepository(User);

    let adminRole = await roleRepository.findOne({ where: { name: ADMIN_ROLE_NAME } });
    if (!adminRole) {
      adminRole = roleRepository.create({ name: ADMIN_ROLE_NAME });
      adminRole = await roleRepository.save(adminRole);
      this.logger.log(`Created default role '${ADMIN_ROLE_NAME}'`);
    }

    let existingAdmin = await userRepository.findOne({ where: { email: ADMIN_EMAIL } });
    
    // Xóa admin cũ nếu có (để tạo lại với password mới)
    if (existingAdmin) {
      await userRepository.remove(existingAdmin);
      this.logger.log(`Removed existing admin user to recreate with plain password`);
    }

    const adminUser = userRepository.create({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      user_name: ADMIN_NAME,
      role_id: adminRole.id,
      role: adminRole,
      is_active: true,
      is_locked: false,
    });

    await userRepository.save(adminUser);
    this.logger.log(`Created default admin user '${ADMIN_EMAIL}' with password '${ADMIN_PASSWORD}'`);
  }
}
