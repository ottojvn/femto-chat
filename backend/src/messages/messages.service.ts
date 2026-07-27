import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { prisma } from '../lib/prisma.js';

@Injectable()
export class MessagesService {
  joinConversation(userId: string, conversationId: string) {
    return prisma.message.findMany({
      where: {
        conversation: { userId },
        conversationId
      }
    });
  }

  writeMessage(createMessageDto: CreateMessageDto) {
    return prisma.message.create({
      data: {
        senderRole: createMessageDto.senderRole,
        conversationId: createMessageDto.conversationId,
        text: createMessageDto.text,
      }
    });
  }
}
