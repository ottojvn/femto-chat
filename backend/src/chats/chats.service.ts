import { Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/prisma.js';
import { CreateChatDto } from './dto/create-chat.dto.js';

@Injectable()
export class ChatsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createChatDto: CreateChatDto) {
    return await this.prismaService.chat.create({
      data: {
        userId: createChatDto.userId,
      },
    });
  }

  async findUserChats(userId: string) {
    return await this.prismaService.chat.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async read(userId: string, chatId: string) {
    return await this.prismaService.message.findMany({
      where: {
        chat: { userId },
        chatId,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async remove(id: string) {
    return await this.prismaService.chat.delete({ where: { id } });
  }
}
