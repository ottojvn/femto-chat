export interface Message {
    id: string;
    chatId: string;
    senderRole: 'USER' | 'AGENT';
    text: string;
    createdAt: string;
}
