import axios from 'axios';
import type {
    ChatPayload,
    GreenApiChat,
    GreenApiCredentials,
    HistoryMessage,
    Method,
} from './greenApi.types';

const API_URL = 'https://api.greenapi.com';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export function isRequestCanceled(error: unknown) {
    return axios.isCancel(error);
}

const MESSAGE_LABELS: Record<string, string> = {
    imageMessage: 'Photo',
    videoMessage: 'Video',
    documentMessage: 'Document',
    audioMessage: 'Audio',
    stickerMessage: 'Sticker',
    reactionMessage: 'Reaction',
    locationMessage: 'Location',
    contactMessage: 'Contact',
    contactsArrayMessage: 'Contacts',
    pollMessage: 'Poll',
    pollUpdateMessage: 'Poll',
};

function methodUrl(credentials: GreenApiCredentials, method: Method) {
    return `/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}`;
}

async function request<T>(
    url: string,
    config?: {
        method?: 'GET' | 'POST';
        data?: unknown;
        signal?: AbortSignal;
    },
) {
    const response = await api.request<T>({
        url,
        method: config?.method ?? 'GET',
        data: config?.data,
        signal: config?.signal,
    });

    return response.data;
}

function parseChat(value: unknown): GreenApiChat | null {
    if (typeof value !== 'object' || value === null) return null;

    const chat = value as ChatPayload;
    if (typeof chat.id !== 'string' || chat.id.length === 0) return null;

    const trimmedName = typeof chat.name === 'string' ? chat.name.trim() : '';
    const name = trimmedName || chat.id.split('@')[0] || chat.id;

    return {
        id: chat.id,
        name,
        type: chat.type === 'group' ? 'group' : 'user',
        unreadCount: chat.unreadCount ?? 0,
        archive: !!chat.archive,
    };
}

function firstText(...values: unknown[]) {
    for (const value of values) {
        if (typeof value === 'string' && value.trim()) return value.trim();
    }

    return '';
}

function previewFromMessage(message: HistoryMessage) {
    if (message.isDeleted === true) return 'Deleted';

    const text = firstText(
        message.textMessage,
        message.caption,
        message.fileName,
    );
    if (text) return text;

    if (typeof message.typeMessage === 'string') {
        return MESSAGE_LABELS[message.typeMessage] ?? '';
    }

    return '';
}

export async function getChats(
    credentials: GreenApiCredentials,
    signal?: AbortSignal,
) {
    const payload = await request<unknown>(methodUrl(credentials, 'getChats'), {
        signal,
    });

    if (!Array.isArray(payload)) {
        throw new Error('Unexpected chats response');
    }

    return payload.flatMap((item) => {
        const chat = parseChat(item);
        return chat ? [chat] : [];
    });
}

export async function getLastMessageText(
    credentials: GreenApiCredentials,
    chatId: string,
    signal?: AbortSignal,
) {
    const payload = await request<unknown>(
        methodUrl(credentials, 'getChatHistory'),
        {
            method: 'POST',
            data: { chatId, count: 1 },
            signal,
        },
    );

    if (!Array.isArray(payload) || payload.length === 0) return '';

    const message = payload[0];
    if (typeof message !== 'object' || message === null) return '';

    return previewFromMessage(message);
}
