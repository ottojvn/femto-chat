import { Message } from './message';

export interface Chat {
    id: string;
    name: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    messages?: Message[];
}
