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
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTableDto: CreateTableDto) {
    const table = await this.tablesService.create(createTableDto);
    
    return {
      message: 'Tạo bàn mới thành công',
      data: table,
    };
  }

  @Get()
  async findAll() {
    const tables = await this.tablesService.findAll();
    
    return {
      message: 'Lấy danh sách bàn thành công',
      data: tables,
    };
  }

  @Get('statuses')
  async getStatuses() {
    const statuses = await this.tablesService.getStatuses();
    
    return {
      message: 'Lấy danh sách trạng thái thành công',
      data: statuses,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const table = await this.tablesService.findOne(id);
    
    return {
      message: 'Lấy thông tin bàn thành công',
      data: table,
    };
  }

  @Put(':id')
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() updateTableDto: UpdateTableDto) {
    const table = await this.tablesService.update(id, updateTableDto);
    
    return {
      message: 'Cập nhật bàn thành công',
      data: table,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    const result = await this.tablesService.remove(id);
    
    return result;
  }
}
