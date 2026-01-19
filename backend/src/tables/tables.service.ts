import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CafeTable } from './entities/table.entity';
import { TableStatus } from './entities/table-status.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(CafeTable)
    private tablesRepository: Repository<CafeTable>,
    @InjectRepository(TableStatus)
    private tableStatusRepository: Repository<TableStatus>,
  ) {}

  async create(createTableDto: CreateTableDto) {
    // Tìm status AVAILABLE (mặc định khi tạo bàn mới)
    const availableStatus = await this.tableStatusRepository.findOne({
      where: { name: 'AVAILABLE' },
    });

    if (!availableStatus) {
      throw new BadRequestException('Không tìm thấy trạng thái AVAILABLE');
    }

    const newTable = this.tablesRepository.create({
      capacity: createTableDto.capacity,
      status_id: availableStatus.id,
      status: availableStatus,
    });

    return this.tablesRepository.save(newTable);
  }

  async findAll() {
    const tables = await this.tablesRepository.find({
      relations: ['status'],
    });

    return tables;
  }

  async findOne(id: string) {
    const table = await this.tablesRepository.findOne({
      where: { id },
      relations: ['status'],
    });

    if (!table) {
      throw new NotFoundException(`Không tìm thấy bàn với ID ${id}`);
    }

    return table;
  }

  async update(id: string, updateTableDto: UpdateTableDto) {
    const table = await this.findOne(id);

    if (updateTableDto.capacity !== undefined) {
      table.capacity = updateTableDto.capacity;
    }

    if (updateTableDto.status_id) {
      const status = await this.tableStatusRepository.findOne({
        where: { id: updateTableDto.status_id },
      });

      if (!status) {
        throw new BadRequestException('Trạng thái không hợp lệ');
      }

      table.status_id = status.id;
      table.status = status;
    }

    if (updateTableDto.disabled_reason !== undefined) {
      table.disabled_reason = updateTableDto.disabled_reason;
    }

    table.updated_at = new Date();

    await this.tablesRepository.save(table);
    
    // Trả về table với relation status
    return this.findOne(id);
  }

  async remove(id: string) {
    const table = await this.findOne(id);
    await this.tablesRepository.remove(table);
    
    return { message: 'Xóa bàn thành công' };
  }

  async getStatuses() {
    return this.tableStatusRepository.find();
  }
}
