import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type {
    ChatMessage,
    ChatPayload,
    GreenApiChat,
    Method,
    SendMessagePayload,
    SendMessageResponse,
} from './greenApi.types';

const API_URL = 'https://api.greenapi.com';
const CHAT_HISTORY_COUNT = 5000;

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export function isRequestCanceled(error: unknown) {
    return axios.isCancel(error);
}

function parseMessageId(value: unknown) {
    if (typeof value !== 'object' || value === null) return null;

    const response = value as SendMessageResponse;
    if (
        typeof response.idMessage !== 'string' ||
        response.idMessage.length === 0
    ) {
        return null;
    }

    return response.idMessage;
}

function parseChat(value: unknown): GreenApiChat | null {
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

type MessagePayload = {
    type?: string;
    idMessage?: string;
    timestamp?: number;
    typeMessage?: string;
    textMessage?: string;
    caption?: string;
    fileName?: string;
    senderName?: string;
    senderContactName?: string;
    isDeleted?: boolean;
    downloadUrl?: string;
    extendedTextMessage?: { text?: string };
    extendedTextMessageData?: { text?: string };
    pollMessageData?: { name?: string };
};

const MESSAGE_TYPE_LABELS: Record<string, string> = {
    imageMessage: 'Изображение',
    videoMessage: 'Видео',
    documentMessage: 'Документ',
    audioMessage: 'Аудио',
    stickerMessage: 'Стикер',
    reactionMessage: 'Реакция',
    pollMessage: 'Опрос',
};

function readText(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
}

function parseMessage(value: unknown): ChatMessage | null {
    if (typeof value !== 'object' || value === null) return null;

    const message = value as MessagePayload;
    const idMessage = readText(message.idMessage);
    if (
        !idMessage ||
        (message.type !== 'incoming' && message.type !== 'outgoing')
    ) {
        return null;
    }

    const imageUrl =
        !message.isDeleted &&
        (message.typeMessage === 'imageMessage' ||
            message.typeMessage === 'stickerMessage')
            ? readText(message.downloadUrl) || null
            : null;
    const label = message.typeMessage
        ? MESSAGE_TYPE_LABELS[message.typeMessage]
        : undefined;
    let text = message.isDeleted
        ? 'Сообщение удалено'
        : readText(message.textMessage) ||
          readText(message.extendedTextMessage?.text) ||
          readText(message.caption) ||
          readText(message.pollMessageData?.name) ||
          readText(message.extendedTextMessageData?.text) ||
          (message.typeMessage === 'documentMessage'
              ? readText(message.fileName)
              : '') ||
          label ||
          'Сообщение';

    if (imageUrl && text === label) text = '';

    return {
        id: `${message.type}:${idMessage}`,
        direction: message.type,
        timestamp:
            typeof message.timestamp === 'number' &&
            Number.isFinite(message.timestamp)
                ? message.timestamp
                : 0,
        text,
        senderName:
            readText(message.senderContactName) ||
            readText(message.senderName) ||
            null,
        imageUrl,
    };
}

export class GreenApi {
    private static instance: GreenApi | null = null;

    private constructor() {}

    static getInstance() {
        GreenApi.instance ??= new GreenApi();
        return GreenApi.instance;
    }

    async getChats(signal?: AbortSignal) {
        const payload = await this.request<unknown>(this.methodUrl('getChats'), {
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

    async sendMessage({ recipientsPhoneNumber, message }: SendMessagePayload) {
        const payload = await this.request<unknown>(
            this.methodUrl('sendMessage'),
            {
                method: 'POST',
                data: { chatId: recipientsPhoneNumber, message },
            },
        );

        const idMessage = parseMessageId(payload);

        if (!idMessage) {
            throw new Error('Unexpected send message response');
        }

        return idMessage;
    }

    async getChatHistory(chatId: string, signal?: AbortSignal) {
        const history = await this.request<unknown>(
            this.methodUrl('getChatHistory'),
            {
                method: 'POST',
                data: { chatId, count: CHAT_HISTORY_COUNT },
                signal,
            },
        );
        if (!Array.isArray(history)) {
            throw new Error('Unexpected chat history response');
        }

        return history
            .flatMap((item) => {
                const message = parseMessage(item);
                return message ? [message] : [];
            })
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    private methodUrl(method: Method) {
        const { idInstance, apiTokenInstance } = this.requireCredentials();
        return `/waInstance${idInstance}/${method}/${apiTokenInstance}`;
    }

    private requireCredentials() {
        const credentials = useAuthStore.getState().credentials;

        if (!credentials) {
            throw new Error('Green API credentials are not set');
        }

        return credentials;
    }

    private async request<T>(
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
}

export const greenApi = GreenApi.getInstance();
