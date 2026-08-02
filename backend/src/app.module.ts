import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MessagesModule } from './messages/messages.module.js';
import { AgentModule } from './agent/agent.module.js';
import { ChatsModule } from './chats/chats.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [MessagesModule, AgentModule, ChatsModule, UsersModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
