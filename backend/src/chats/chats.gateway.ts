import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { AgentService } from '../agent/agent.service.js';
import { ChatsService } from './chats.service.js';
import { CreateMessageDto } from '../messages/dto/create-message.dto.js';
import { MessagesService } from '../messages/messages.service.js';
import { Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatsGateway {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly messagesService: MessagesService,
    private readonly agentService: AgentService,
  ) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinChat')
  async joinChat(
    @MessageBody() body: { userId: string; chatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(body.chatId);
  }

  @SubscribeMessage('readChatMessages')
  async readChatMessages(
    @MessageBody() body: { userId: string; chatId: string },
  ) {
    return await this.chatsService.read(body.userId, body.chatId);
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody() body: { createMessageDto: CreateMessageDto; userId: string },
  ) {
    const userMessage = await this.messagesService.createMessage(
      body.createMessageDto,
    );
    this.server
      .to(body.createMessageDto.chatId)
      .emit('user-message', userMessage.text);
    const previousMessages = await this.chatsService.read(
      body.userId,
      body.createMessageDto.chatId,
    );
    const previousSteps = [];
    for (const message of previousMessages) {
      if (message.senderRole === Role.USER) {
        previousSteps.push({
          type: 'user_input',
          content: [{ type: 'text', text: message.text }],
        });
      }
      if (Array.isArray(message.steps)) {
        previousSteps.push(...message.steps);
      }
    }
    const agentMessage = await this.agentService.query(
      userMessage.text,
      (text: string) => {
        this.server
          .to(body.createMessageDto.chatId)
          .emit('agent-message', text);
      },
      previousSteps,
    );
    return this.messagesService.createMessage({
      senderRole: Role.AGENT,
      chatId: body.createMessageDto.chatId,
      steps: agentMessage.steps,
      text: agentMessage.fullReply,
    });
  }
}
