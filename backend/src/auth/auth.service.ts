import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Tìm user theo email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng!');
    }

    // Kiểm tra password
    const isPasswordValid = await this.usersService.validatePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng!');
    }

    // Kiểm tra tài khoản có bị khóa không
    if (user.is_locked) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa!');
    }

    // Kiểm tra tài khoản có hoạt động không
    if (!user.is_active) {
      throw new UnauthorizedException('Tài khoản của bạn không hoạt động!');
    }

    // Tạo JWT token
    const token = this.jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role.name,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.user_name,
        email: user.email,
        phone: user.phone_number,
        role: user.role.name,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email này đã được đăng ký!');
    }

    // Lấy role CUSTOMER từ database
    const customerRole = await this.rolesRepository.findOne({
      where: { name: 'CUSTOMER' },
    });

    if (!customerRole) {
      throw new BadRequestException('Role CUSTOMER không tồn tại!');
    }

    // Hash password
    const hashedPassword = await this.usersService.hashPassword(password);

    // Tạo user mới với role CUSTOMER
    const newUser = await this.usersService.create(
      email,
      hashedPassword,
      name,
      customerRole.id,
    );

    // Tạo JWT token
    const token = this.jwtService.sign({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role.name,
    });

    return {
      token,
      user: {
        id: newUser.id,
        name: newUser.user_name,
        email: newUser.email,
        phone: newUser.phone_number,
        role: newUser.role.name,
      },
    };
  }
}
