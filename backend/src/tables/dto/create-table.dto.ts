import { IsString, IsInt, Min, IsOptional } from 'class-validator';

export class CreateTableDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsString()
  @IsOptional()
  type?: string;
}
