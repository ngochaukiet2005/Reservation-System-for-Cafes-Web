import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class CreateStaffDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(20, { message: 'Mật khẩu không được quá 20 ký tự' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, { 
    message: 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số' 
  })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên nhân viên không được để trống' })
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Tên không được quá 100 ký tự' })
  user_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(15, { message: 'Số điện thoại không được quá 15 ký tự' })
  @Matches(/^[0-9+\-\s()]*$/, { message: 'Số điện thoại không hợp lệ' })
  phone_number?: string;
}
