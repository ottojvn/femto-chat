import { Module } from '@nestjs/common';
import { PrismaService } from '../lib/prisma.js';
import { MessagesService } from './messages.service.js';

@Module({
  providers: [MessagesService, PrismaService],
  exports: [MessagesService],
})
export class MessagesModule {}
