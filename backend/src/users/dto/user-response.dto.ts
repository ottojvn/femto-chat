import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UserResponseDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  createdAt: Date;
  updatedAt: Date;
}
