import { Component, inject, signal } from '@angular/core';
import { Chat as ChatModel } from '../../../../core/models/chat';
import { Message } from '../../../../core/models/message';
import { Chat as ChatService } from '../../../../core/services/chat';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  chatService = inject(ChatService);
  router = inject(Router);

  chats = signal<ChatModel[]>([]);
  activeChat = signal<ChatModel | null>(null);
  messages = signal<Message[]>([]);
  inputText = signal<string>('');

  ngOnInit() {
    this.chatService.connectSocket();
    this.chatService.getChats().subscribe((chats) => {
      this.chats.set(chats);
      if (chats.length > 0) {
        this.selectChat(chats[0]);
      }
    });

    this.chatService.agentMessage.subscribe((chunk) => {
      this.messages.update((current) => {
        const lastMsg = current[current.length - 1];
        if (lastMsg && lastMsg.senderRole === 'AGENT') {
          return [...current.slice(0, -1), { ...lastMsg, text: lastMsg.text + chunk }];
        }

        const newAgentMsg: Message = {
          id: crypto.randomUUID(),
          chatId: this.activeChat()?.id || '',
          senderRole: 'AGENT',
          text: chunk,
          createdAt: new Date().toISOString(),
        };

        return [...current, newAgentMsg];
      })


    });
  }

  selectChat(chat: ChatModel) {
    this.activeChat.set(chat);
    this.messages.set(chat.messages || []);
    const userId = this.chatService.authService.currentUser()?.id || '';
    if (!userId) return;
    this.chatService.joinChat(userId, chat.id);
    this.chatService.loadChatMessages(userId, chat.id, (messages) => {
      console.log("Messages received in component: ", messages);
      this.messages.set(messages);
    });
  }

  send() {
    const inputText = this.inputText().trim();
    if (!inputText || !this.activeChat()) return;

    const currentChatId = this.activeChat()!.id || '';
    const userId = this.chatService.authService.currentUser()?.id || '';

    this.messages.update(prev => [...prev, {
      id: crypto.randomUUID(),
      chatId: currentChatId,
      senderRole: 'USER',
      text: inputText,
      createdAt: new Date().toISOString(),
    }]);

    this.chatService.sendMessage(currentChatId, inputText, userId);
    this.inputText.set('');
  }

  createChat(name?: string) {
    this.chatService.createChat(name).subscribe((newChat) => {
      this.chats.update((current) => [...current, newChat]);
      this.selectChat(newChat);
    });
  }

  logout() {
    this.chatService.disconnect();
    this.chatService.authService.logout();
    this.router.navigate(['/login']);
  }
}
