import { IsString, MinLength, MaxLength, IsOptional, Matches, IsBoolean } from 'class-validator';

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Tên không được quá 100 ký tự' })
  user_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(15, { message: 'Số điện thoại không được quá 15 ký tự' })
  @Matches(/^[0-9+\-\s()]*$/, { message: 'Số điện thoại không hợp lệ' })
  phone_number?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsBoolean()
  @IsOptional()
  is_locked?: boolean;
}
