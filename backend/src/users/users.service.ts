import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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
}
