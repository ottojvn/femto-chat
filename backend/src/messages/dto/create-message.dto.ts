import { Role } from '../../../generated/prisma/enums.js';
import { IsNotEmpty, IsEnum, IsUUID, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsEnum(Role)
  senderRole: Role;

  @IsNotEmpty()
  @IsUUID()
  conversationId: string;

  @IsNotEmpty()
  @IsString()
  text: string;
}
