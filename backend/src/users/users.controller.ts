import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  HttpCode,
  HttpStatus,
  Request
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('staff')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createStaff(@Body() createStaffDto: CreateStaffDto) {
    const staff = await this.usersService.createStaff(
      createStaffDto.email,
      createStaffDto.password,
      createStaffDto.user_name,
      createStaffDto.phone_number,
    );

    // Không trả về password
    const { password, ...result } = staff;
    return {
      message: 'Tạo tài khoản nhân viên thành công',
      data: result,
    };
  }

  @Get('staff')
  @Roles('ADMIN')
  async getAllStaff() {
    const staff = await this.usersService.findAllStaff();
    
    // Loại bỏ password khỏi response
    const result = staff.map(({ password, ...rest }) => rest);
    
    return {
      message: 'Lấy danh sách nhân viên thành công',
      data: result,
    };
  }

  @Put('staff/:id')
  @Roles('ADMIN')
  async updateStaff(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
  ) {
    const staff = await this.usersService.updateStaff(id, updateStaffDto);
    
    const { password, ...result } = staff;
    return {
      message: 'Cập nhật thông tin nhân viên thành công',
      data: result,
    };
  }

  @Delete('staff/:id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async deleteStaff(@Param('id') id: string) {
    await this.usersService.deleteStaff(id);
    return {
      message: 'Xóa tài khoản nhân viên thành công',
    };
  }

  @Put('profile')
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = req.user.userId;
    const user = await this.usersService.updateProfile(userId, updateProfileDto);
    
    const { password, ...result } = user;
    return {
      message: 'Cập nhật thông tin thành công',
      data: result,
    };
  }
}
