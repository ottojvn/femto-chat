import { Role } from '../../../generated/prisma/enums.js';
import {
  IsNotEmpty,
  IsEnum,
  IsUUID,
  IsString,
  IsOptional,
} from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsEnum(Role)
  senderRole: Role;

  @IsNotEmpty()
  @IsUUID()
  chatId: string;

  @IsOptional()
  steps?: Array<{ type: string; content: { type: string; text: string }[] }>;

  @IsNotEmpty()
  @IsString()
  text: string;
}
