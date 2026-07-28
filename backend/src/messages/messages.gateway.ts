import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessagesService } from './messages.service.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { Server, Socket } from 'socket.io';
import { AgentService } from '../agent/agent.service.js';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly agentService: AgentService
  ) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinConversation')
  async joinConversation(@MessageBody() body: { userId: string; conversationId: string }, @ConnectedSocket() client: Socket) {
    client.join(body.conversationId);
    return await this.messagesService.joinConversation(body.userId, body.conversationId);
  }

  @SubscribeMessage('writeMessage')
  async writeMessage(@MessageBody() createMessageDto: CreateMessageDto) {
    const userMessage = await this.messagesService.writeMessage(createMessageDto);
    this.server.to(createMessageDto.conversationId).emit('user-message', userMessage.text);
    return await this.agentService.queue(userMessage.text, (text: string) => {
      this.server.to(createMessageDto.conversationId).emit('agent-message', text);
    });
  }

}
