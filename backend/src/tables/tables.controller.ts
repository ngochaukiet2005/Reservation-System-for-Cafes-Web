import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('tables')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  async findAll() {
    const tables = await this.tablesService.findAll();
    return { message: 'Tables retrieved successfully', data: tables };
  }

  @Get('statuses')
  async getStatuses() {
    const statuses = await this.tablesService.getStatuses();
    return { message: 'Table statuses retrieved successfully', data: statuses };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const table = await this.tablesService.findOne(id);
    return { message: 'Table retrieved successfully', data: table };
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() dto: CreateTableDto) {
    const table = await this.tablesService.create(dto);
    return { message: 'Table created successfully', data: table };
  }

  @Put(':id')
  @Roles('ADMIN')
  async update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    const table = await this.tablesService.update(id, dto);
    return { message: 'Table updated successfully', data: table };
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    await this.tablesService.remove(id);
    return { message: 'Table deleted successfully' };
  }
}
