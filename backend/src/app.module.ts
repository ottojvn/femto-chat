import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MessagesModule } from './messages/messages.module.js';
import { AgentModule } from './agent/agent.module.js';

@Module({
  imports: [MessagesModule, AgentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
