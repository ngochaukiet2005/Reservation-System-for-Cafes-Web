import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
    private readonly tableRepo: Repository<CafeTable>,
    @InjectRepository(TableStatus)
    private readonly statusRepo: Repository<TableStatus>,
  ) {}

  async findAll(): Promise<CafeTable[]> {
    return this.tableRepo.find({ relations: ['status'], order: { sort_order: 'ASC', id: 'ASC' } });
  }

  async findOne(id: string): Promise<CafeTable> {
    const table = await this.tableRepo.findOne({ where: { id }, relations: ['status'] });
    if (!table) throw new NotFoundException(`Table with ID ${id} not found`);
    return table;
  }

  async create(dto: CreateTableDto): Promise<CafeTable> {
    // Check if name already exists
    const existing = await this.tableRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Table with name "${dto.name}" already exists`);
    }

    // Find AVAILABLE status
    const availableStatus = await this.statusRepo.findOne({ where: { name: 'AVAILABLE' } });
    if (!availableStatus) {
      throw new NotFoundException('AVAILABLE status not found. Please run seed first.');
    }

    const table = this.tableRepo.create({
      name: dto.name,
      capacity: dto.capacity,
      type: dto.type,
      status_id: availableStatus.id,
    });

    const saved = await this.tableRepo.save(table);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateTableDto): Promise<CafeTable> {
    const table = await this.findOne(id);

    // Check name uniqueness if changed
    if (dto.name && dto.name !== table.name) {
      const existing = await this.tableRepo.findOne({ where: { name: dto.name } });
      if (existing) {
        throw new ConflictException(`Table with name "${dto.name}" already exists`);
      }
    }

    // Validate status_id if provided
    if (dto.status_id) {
      const status = await this.statusRepo.findOne({ where: { id: dto.status_id } });
      if (!status) {
        throw new NotFoundException(`Status with ID ${dto.status_id} not found`);
      }
    }

    Object.assign(table, dto);
    table.updated_at = new Date();
    await this.tableRepo.save(table);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const table = await this.findOne(id);
    await this.tableRepo.remove(table);
  }

  async getStatuses(): Promise<TableStatus[]> {
    return this.statusRepo.find();
  }
}
