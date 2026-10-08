import type { GreenApiChat } from '../greenApi.types';

export type ChatPayload = {
    id?: string;
    name?: string;
    type?: string;
    unreadCount?: number;
    archive?: boolean;
    newChatId?: string;
};

export function parseChat(value: unknown): GreenApiChat | null {
    if (typeof value !== 'object' || value === null) return null;

    const chat = value as ChatPayload;
    if (typeof chat.id !== 'string' || chat.id.length === 0) return null;

    const id =
        typeof chat.newChatId === 'string' && chat.newChatId.length > 0
            ? chat.newChatId
            : chat.id;
    const trimmedName = typeof chat.name === 'string' ? chat.name.trim() : '';
    const name = trimmedName || id.split('@')[0] || id;

    return {
        id,
        name,
        type: chat.type === 'group' ? 'group' : 'user',
        unreadCount: chat.unreadCount ?? 0,
        archive: !!chat.archive,
    };
}

export function chatFromId(id: string): GreenApiChat {
    const local = id.split('@')[0] || id;

    return {
        id,
        name: local,
        type: id.endsWith('@g.us') ? 'group' : 'user',
        unreadCount: 0,
        archive: false,
    };
}
