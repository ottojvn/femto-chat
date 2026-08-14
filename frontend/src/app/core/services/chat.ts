import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Auth } from './auth';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Chat as ChatModel } from '../models/chat';
import { Message } from '../models/message';

@Service()
export class Chat {
    http = inject(HttpClient);
    authService = inject(Auth);

    private socket!: Socket;
    private userMessage$ = new Subject<string>();
    private agentMessage$ = new Subject<string>();

    get userMessage() {
        return this.userMessage$.asObservable();
    }

    get agentMessage() {
        return this.agentMessage$.asObservable();
    }

    getChats(): Observable<ChatModel[]> {
        return this.http.get<ChatModel[]>(`${environment.apiUrl}/chats`);
    }

    createChat(name?: string): Observable<ChatModel> {
        return this.http.post<ChatModel>(`${environment.apiUrl}/chats`, name ? { name } : {});
    }

    connectSocket() {
        this.socket = io(`${environment.apiUrl}`, {
            auth: {
                token: this.authService.getToken()
            }
        });

        this.socket.on('user-message', (message: string) => {
            this.userMessage$.next(message);
        });

        this.socket.on('agent-message', (chunk: string) => {
            this.agentMessage$.next(chunk);
        });
    }

    joinChat(userId: string, chatId: string) {
        this.socket.emit('joinChat', { userId, chatId });
    }

    sendMessage(chatId: string, text: string, userId: string) {
        this.socket.emit('sendMessage', { createMessageDto: { chatId, senderRole: 'USER', text }, userId });
    }

    disconnect() {
        this.socket?.disconnect();
    }

    loadChatMessages(userId: string, chatId: string, callback: (messages: Message[]) => void) {
        this.socket.emit('readChatMessages', { userId, chatId }, (response: any) => {
            callback(response);
        });
    }
}