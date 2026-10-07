import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type {
    ChatPayload,
    GreenApiChat,
    Method,
    SendMessagePayload,
    SendMessageResponse,
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

export class GreenApi {
    private static instance: GreenApi | null = null;

    private constructor() {}

    static getInstance() {
        GreenApi.instance ??= new GreenApi();
        return GreenApi.instance;
    }

    async getChats(signal?: AbortSignal) {
        const payload = await this.request<unknown>(
            this.methodUrl('getChats'),
            {
                signal,
            },
        );

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
