import { IsString, IsInt, Min, IsDateString, IsOptional } from 'class-validator';

export class FilterAvailableTablesDto {
  @IsDateString()
  date!: string; // Format: YYYY-MM-DD

  @IsString()
  start_time!: string; // Format: HH:mm (e.g., "09:00")

  @IsString()
  end_time!: string; // Format: HH:mm (e.g., "10:00")

  @IsInt()
  @Min(1)
  capacity!: number; // Số người cần chỗ ngồi
}
