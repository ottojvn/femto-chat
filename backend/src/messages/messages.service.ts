import { Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/prisma.js';
import { CreateMessageDto } from './dto/create-message.dto.js';

@Injectable()
export class MessagesService {
  constructor(private readonly prismaService: PrismaService) {}

  async findMessagesByChat(chatId: string, userId?: string) {
    return await this.prismaService.message.findMany({
      where: {
        chat: { userId },
        chatId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async createMessage(createMessageDto: CreateMessageDto) {
    return await this.prismaService.message.create({
      data: {
        senderRole: createMessageDto.senderRole,
        chatId: createMessageDto.chatId,
        steps: createMessageDto.steps as Array<{
          type: string;
          content: { type: string; text: string }[];
        }>,
        text: createMessageDto.text,
      },
    });
  }
}
