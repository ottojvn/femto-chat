import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { ChatsService } from './chats.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@UseGuards(AuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  async findUserChats(
    @CurrentUser('sub') userId: string,
  ): Promise<
    { id: string; userId: string; createdAt: Date; updatedAt: Date }[]
  > {
    return await this.chatsService.findUserChats(userId);
  }

  @Post()
  async create(
    @CurrentUser('sub') userId: string,
  ): Promise<{ id: string; userId: string; createdAt: Date; updatedAt: Date }> {
    return await this.chatsService.create({ userId });
  }
}
