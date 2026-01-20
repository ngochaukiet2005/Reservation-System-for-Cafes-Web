import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class UpdateTableDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  status_id?: string;

  @IsString()
  @IsOptional()
  disabled_reason?: string;
}
