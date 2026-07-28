import { Role } from '../../../generated/prisma/enums.js';
import { IsNotEmpty, IsEnum, IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsEnum(Role)
  senderRole: Role;

  @IsNotEmpty()
  @IsUUID()
  conversationId: string;

  @IsOptional()
  steps?: any;

  @IsNotEmpty()
  @IsString()
  text: string;
}
