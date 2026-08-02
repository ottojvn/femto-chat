import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service.js';
import { ChatsGateway } from './chats.gateway.js';
import { AgentModule } from '../agent/agent.module.js';
import { MessagesModule } from '../messages/messages.module.js';
import { PrismaService } from '../lib/prisma.js';
import { ChatsController } from './chats.controller.js';

@Module({
  providers: [ChatsGateway, ChatsService, PrismaService],
  imports: [MessagesModule, AgentModule],
  controllers: [ChatsController],
})
export class ChatsModule {}
