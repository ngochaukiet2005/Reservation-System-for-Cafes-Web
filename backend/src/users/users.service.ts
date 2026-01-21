import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async create(email: string, hashedPassword: string, userName: string, roleId: string): Promise<User> {
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      user_name: userName,
      role_id: roleId,
    });
    await this.usersRepository.save(user);
    // Load relationship role trước khi return
    return this.usersRepository.findOne({
      where: { id: user.id },
      relations: ['role'],
    });
  }

  // Lấy danh sách tất cả staff
  async findAllStaff(): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('role.name = :roleName', { roleName: 'STAFF' })
      .orderBy('user.created_at', 'DESC')
      .getMany();
  }

  // Tạo tài khoản staff mới
  async createStaff(email: string, password: string, userName: string, phoneNumber?: string): Promise<User> {
    // Kiểm tra email đã tồn tại
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    // Tìm role STAFF
    const staffRole = await this.rolesRepository.findOne({ 
      where: { name: 'STAFF' } 
    });

    if (!staffRole) {
      throw new BadRequestException('Không tìm thấy role STAFF trong database');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Tạo user mới
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      plain_password: password,
      user_name: userName,
      phone_number: phoneNumber,
      role_id: staffRole.id,
      is_active: true,
      is_locked: false,
    });

    await this.usersRepository.save(user);

    return this.findById(user.id);
  }

  // Cập nhật thông tin staff
  async updateStaff(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }

    if (user.role.name !== 'STAFF') {
      throw new BadRequestException('Chỉ có thể cập nhật tài khoản nhân viên');
    }

    Object.assign(user, updateData);
    await this.usersRepository.save(user);

    return this.findById(id);
  }

  // Xóa staff
  async deleteStaff(id: string): Promise<void> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }

    if (user.role.name !== 'STAFF') {
      throw new BadRequestException('Chỉ có thể xóa tài khoản nhân viên');
    }

    await this.usersRepository.remove(user);
  }

  // Cập nhật thông tin profile (cho tất cả user)
  async updateProfile(userId: string, updateData: { user_name?: string; phone_number?: string }): Promise<User> {
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (updateData.user_name) {
      user.user_name = updateData.user_name;
    }

    if (updateData.phone_number !== undefined) {
      user.phone_number = updateData.phone_number;
    }

    user.updated_at = new Date();
    await this.usersRepository.save(user);

    return this.findById(userId);
  }
}
