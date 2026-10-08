import { useEffect } from 'react';
import axios from 'axios';
import { greenApiClient, greenApiUrl } from '../../lib/green-api-client';
import { queryClient } from '../../lib/query-client';
import { useAuthStore } from '../../store/authStore';
import { useChatsStore } from '../../store/chatsStore';
import { readText } from '../../utils/readText';
import type { GreenApiChat, GreenApiCredentials } from '../greenApi.types';
import { chatsQueryKey } from '../chats/getChats';
import { chatHistoryQueryKey, type CachedChatMessage } from './getChatHistory';

type IncomingNotification = {
    typeWebhook?: unknown;
    timestamp?: unknown;
    idMessage?: unknown;
    senderData?: {
        chatId?: unknown;
        senderName?: unknown;
        senderContactName?: unknown;
        senderPhoneNumber?: unknown;
    };
    messageData?: {
        typeMessage?: unknown;
        textMessageData?: { textMessage?: unknown };
    };
};

type IncomingText = {
    idMessage: string;
    chatId: string;
    phone: string;
    text: string;
    timestamp: number;
    senderName: string | null;
};

function parseNotification(data: unknown) {
    if (typeof data !== 'object' || data === null) return null;

    const receiptId = (data as { receiptId?: unknown }).receiptId;
    if (typeof receiptId !== 'number' || !Number.isFinite(receiptId))
        return null;

    return { receiptId, body: (data as { body?: unknown }).body };
}

function parseIncomingText(body: unknown): IncomingText | null {
    if (typeof body !== 'object' || body === null) return null;

    const notification = body as IncomingNotification;

    if (notification.typeWebhook !== 'incomingMessageReceived') return null;
    if (notification.messageData?.typeMessage !== 'textMessage') return null;

    const text = readText(
        notification.messageData.textMessageData?.textMessage,
    );
    const chatId = readText(notification.senderData?.chatId);
    const idMessage = readText(notification.idMessage);
    if (!text || !chatId || !idMessage) return null;

    const phoneNumber = notification.senderData?.senderPhoneNumber;
    const phone =
        typeof phoneNumber === 'number' && phoneNumber > 0
            ? String(phoneNumber)
            : '';
    const senderName =
        readText(notification.senderData?.senderContactName) ||
        readText(notification.senderData?.senderName) ||
        null;

    return {
        idMessage,
        chatId,
        phone,
        text,
        timestamp:
            typeof notification.timestamp === 'number' &&
            Number.isFinite(notification.timestamp)
                ? notification.timestamp
                : Math.floor(Date.now() / 1000),
        senderName,
    };
}

function knownChatIds(credentials: GreenApiCredentials) {
    const ids = new Set<string>();
    const chats = queryClient.getQueryData<GreenApiChat[]>(
        chatsQueryKey(credentials),
    );

    for (const chat of chats ?? []) ids.add(chat.id);

    for (const [key] of queryClient.getQueriesData({
        queryKey: ['chat-history', credentials],
    })) {
        const chatId = key[2];
        if (typeof chatId === 'string') ids.add(chatId);
    }

    const selectedChatId = useChatsStore.getState().selectedChatId;
    if (selectedChatId) ids.add(selectedChatId);

    return ids;
}

function resolveChatId(
    credentials: GreenApiCredentials,
    chatId: string,
    phone: string,
) {
    const known = knownChatIds(credentials);
    if (known.has(chatId) || !phone) return chatId;

    const phoneChatId = [...known].find(
        (id) => id === phone || id === `${phone}@c.us`,
    );

    return phoneChatId ?? chatId;
}

function appendIncomingMessage(
    credentials: GreenApiCredentials,
    message: IncomingText,
) {
    const chatId = resolveChatId(credentials, message.chatId, message.phone);
    const queryKey = chatHistoryQueryKey(credentials, chatId);
    const incoming: CachedChatMessage = {
        id: `incoming:${message.idMessage}`,
        direction: 'incoming',
        timestamp: message.timestamp,
        text: message.text,
        senderName: message.senderName,
        imageUrl: null,
        deliveryStatus: null,
        pending: true,
    };

    queryClient.setQueryData<CachedChatMessage[]>(queryKey, (messages = []) => {
        if (messages.some((item) => item.id === incoming.id)) return messages;

        return [...messages, incoming].sort(
            (left, right) => left.timestamp - right.timestamp,
        );
    });
}

async function receiveNotification(
    credentials: GreenApiCredentials,
    signal: AbortSignal,
) {
    const { data } = await greenApiClient.get<unknown>(
        greenApiUrl(credentials, 'receiveNotification'),
        { signal },
    );

    return parseNotification(data);
}

async function deleteNotification(
    credentials: GreenApiCredentials,
    receiptId: number,
    signal: AbortSignal,
) {
    await greenApiClient.delete(
        `${greenApiUrl(credentials, 'deleteNotification')}/${receiptId}`,
        { signal },
    );
}

function wait(ms: number, signal: AbortSignal) {
    return new Promise<void>((resolve) => {
        if (signal.aborted) {
            resolve();
            return;
        }

        const timeout = setTimeout(resolve, ms);
        signal.addEventListener(
            'abort',
            () => {
                clearTimeout(timeout);
                resolve();
            },
            { once: true },
        );
    });
}

async function receiveIncomingMessages(
    credentials: GreenApiCredentials,
    signal: AbortSignal,
) {
    while (!signal.aborted) {
        try {
            const notification = await receiveNotification(credentials, signal);
            if (signal.aborted) return;
            if (!notification) continue;

            const message = parseIncomingText(notification.body);
            if (message) appendIncomingMessage(credentials, message);

            await deleteNotification(
                credentials,
                notification.receiptId,
                signal,
            );
        } catch (error) {
            if (signal.aborted || axios.isCancel(error)) return;
            await wait(1000, signal);
        }
    }
}

export function useReceiveMessages() {
    const credentials = useAuthStore((state) => state.credentials);

    useEffect(() => {
        if (!credentials) return;

        const controller = new AbortController();
        void receiveIncomingMessages(credentials, controller.signal);

        return () => controller.abort();
    }, [credentials]);
}
