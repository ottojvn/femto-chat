import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { MessagesGateway } from './messages.gateway.js';

@Module({
  providers: [MessagesGateway, MessagesService],
})
export class MessagesModule {}
