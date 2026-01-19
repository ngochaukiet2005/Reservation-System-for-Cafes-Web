import { IsInt, Min, IsOptional, IsString } from 'class-validator';

export class UpdateTableDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  status_id?: string;

  @IsOptional()
  @IsString()
  disabled_reason?: string;
}
