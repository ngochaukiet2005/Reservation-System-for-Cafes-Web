import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Tên không được quá 100 ký tự' })
  user_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15, { message: 'Số điện thoại không được quá 15 ký tự' })
  phone_number?: string;
}
