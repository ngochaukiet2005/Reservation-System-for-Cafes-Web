import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { TablesService } from "./tables.service";
import { CreateTableDto } from "./dto/create-table.dto";
import { UpdateTableDto } from "./dto/update-table.dto";
import { FilterAvailableTablesDto } from "./dto/filter-available-tables.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("tables")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  async findAll() {
    const tables = await this.tablesService.findAll();
    return { message: "Tables retrieved successfully", data: tables };
  }

  @Get("statuses")
  async getStatuses() {
    const statuses = await this.tablesService.getStatuses();
    return { message: "Table statuses retrieved successfully", data: statuses };
  }

  @Get("available")
  async findAvailableTables(@Query() query: any) {
    try {
      // Convert string capacity to number
      const filterDto: FilterAvailableTablesDto = {
        date: query.date,
        start_time: query.start_time,
        end_time: query.end_time || this.calculateEndTime(query.start_time),
        capacity: parseInt(query.capacity, 10),
      };

      // Validate required fields
      if (!filterDto.date || !filterDto.start_time || !filterDto.capacity) {
        throw new BadRequestException(
          "Missing required fields: date, start_time, capacity",
        );
      }

      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filterDto.date)) {
        throw new BadRequestException("Invalid date format. Use YYYY-MM-DD");
      }

      // Validate time format (HH:mm)
      if (!/^\d{2}:\d{2}$/.test(filterDto.start_time)) {
        throw new BadRequestException("Invalid start_time format. Use HH:mm");
      }

      const tables = await this.tablesService.findAvailableTables(filterDto);
      return {
        message: "Available tables retrieved successfully",
        data: tables,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Error filtering tables: ${error.message}`);
    }
  }

  private calculateEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(":").map(Number);
    const endHours = (hours + 1) % 24;
    return `${endHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const table = await this.tablesService.findOne(id);
    return { message: "Table retrieved successfully", data: table };
  }

  @Post()
  @Roles("ADMIN")
  async create(@Body() dto: CreateTableDto) {
    const table = await this.tablesService.create(dto);
    return { message: "Table created successfully", data: table };
  }

  @Put(":id")
  @Roles("ADMIN")
  async update(@Param("id") id: string, @Body() dto: UpdateTableDto) {
    const table = await this.tablesService.update(id, dto);
    return { message: "Table updated successfully", data: table };
  }

  @Patch(":id")
  @Roles("ADMIN", "STAFF")
  async patch(@Param("id") id: string, @Body() dto: Partial<UpdateTableDto>) {
    const table = await this.tablesService.update(id, dto);
    return { message: "Table updated successfully", data: table };
  }

  @Delete(":id")
  @Roles("ADMIN")
  async remove(@Param("id") id: string) {
    await this.tablesService.remove(id);
    return { message: "Table deleted successfully" };
  }
}
