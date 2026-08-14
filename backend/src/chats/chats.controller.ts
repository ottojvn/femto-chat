import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
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
    { id: string; name: string; userId: string; createdAt: Date; updatedAt: Date }[]
  > {
    return await this.chatsService.findUserChats(userId);
  }

  @Post()
  async create(
    @CurrentUser('sub') userId: string,
    @Body() body?: { name?: string },
  ): Promise<{ id: string; name: string; userId: string; createdAt: Date; updatedAt: Date }> {
    return await this.chatsService.create({ userId, name: body?.name });
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ id: string; name: string; userId: string; createdAt: Date; updatedAt: Date }> {
    return await this.chatsService.remove(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { name: string },
  ) {
    return await this.chatsService.update(id, body.name);
  }
}
