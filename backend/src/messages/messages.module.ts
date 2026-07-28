import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { MessagesGateway } from './messages.gateway.js';
import { AgentModule } from '../agent/agent.module.js';

@Module({
  providers: [MessagesGateway, MessagesService],
  imports: [AgentModule]
})
export class MessagesModule {}
