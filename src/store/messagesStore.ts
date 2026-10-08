import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { greenApi, isRequestCanceled as isAbortError } from '../api/greenApi';
import type { ChatMessage, MessageDeliveryStatus } from '../api/greenApi.types';

export type MessagesStatus = 'idle' | 'loading' | 'ready' | 'error';

type MessagesState = {
    chatId: string | null;
    messages: ChatMessage[];
    status: MessagesStatus;
    error: string | null;
    loadMessages: (chatId: string, signal?: AbortSignal) => Promise<void>;
    sendMessage: (chatId: string, text: string) => Promise<void>;
    refreshOutgoingStatuses: (
        chatId: string,
        signal?: AbortSignal,
    ) => Promise<void>;
};

const DELIVERY_RANK: Record<MessageDeliveryStatus, number> = {
    sending: 0,
    sent: 1,
    checked: 2,
};

const STATUS_POLL_LIMIT = 5;

function preferDeliveryStatus(
    current: MessageDeliveryStatus | null,
    next: MessageDeliveryStatus | null,
) {
    if (!next) return current;
    if (!current) return next;

    return DELIVERY_RANK[next] > DELIVERY_RANK[current] ? next : current;
}

function apiMessageId(id: string) {
    const prefix = 'outgoing:';

    return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

export const useMessagesStore = create<MessagesState>()(
    devtools(
        (set, get) => {
            let requestId = 0;
            let pendingChatId: string | null = null;
            const pendingMessages = new Map<string, ChatMessage>();
            let refreshing = false;

            const rememberPending = (chatId: string, message: ChatMessage) => {
                if (pendingChatId !== chatId) {
                    pendingMessages.clear();
                    pendingChatId = chatId;
                }

                pendingMessages.set(message.id, message);
            };

            const patchMessage = (
                chatId: string,
                messageId: string,
                patch: (message: ChatMessage) => ChatMessage,
            ) => {
                const pending = pendingMessages.get(messageId);
                if (pending && pendingChatId === chatId) {
                    pendingMessages.set(messageId, patch(pending));
                }

                set((state) => {
                    if (state.chatId !== chatId) return state;

                    return {
                        messages: state.messages.map((message) =>
                            message.id === messageId ? patch(message) : message,
                        ),
                    };
                });
            };

            return {
                chatId: null,
                messages: [],
                status: 'idle',
                error: null,
                loadMessages: async (chatId, signal) => {
                    const id = ++requestId;
                    if (pendingChatId !== chatId) {
                        pendingMessages.clear();
                        pendingChatId = chatId;
                    }

                    set({
                        chatId,
                        messages: [],
                        status: 'loading',
                        error: null,
                    });

                    try {
                        const messages = await greenApi.getChatHistory(
                            chatId,
                            signal,
                        );

                        if (signal?.aborted || id !== requestId) return;

                        set((state) => {
                            if (state.chatId !== chatId || id !== requestId) {
                                return state;
                            }

                            const serverIds = new Set(
                                messages.map((message) => message.id),
                            );
                            for (const messageId of serverIds) {
                                pendingMessages.delete(messageId);
                            }

                            const previousStatus = new Map(
                                state.messages.map((message) => [
                                    message.id,
                                    message.deliveryStatus,
                                ]),
                            );
                            const merged = messages.map((message) => ({
                                ...message,
                                deliveryStatus: preferDeliveryStatus(
                                    previousStatus.get(message.id) ?? null,
                                    message.deliveryStatus,
                                ),
                            }));
                            const extras = [...pendingMessages.values()].filter(
                                (message) => !serverIds.has(message.id),
                            );

                            return {
                                messages: [...merged, ...extras].sort(
                                    (left, right) =>
                                        left.timestamp - right.timestamp,
                                ),
                                status: 'ready' as const,
                                error: null,
                            };
                        });
                    } catch (error) {
                        if (
                            isAbortError(error) ||
                            signal?.aborted ||
                            id !== requestId
                        ) {
                            return;
                        }

                        set({
                            status: 'error',
                            error:
                                error instanceof Error
                                    ? error.message
                                    : 'Failed to load messages',
                        });
                    }
                },
                sendMessage: async (chatId, text) => {
                    const trimmed = text.trim();
                    if (!trimmed) return;
                    if (get().chatId !== chatId) {
                        throw new Error('Чат не загружен');
                    }

                    const localId = `local:${crypto.randomUUID()}`;
                    const optimistic: ChatMessage = {
                        id: localId,
                        direction: 'outgoing',
                        timestamp: Math.floor(Date.now() / 1000),
                        text: trimmed,
                        senderName: null,
                        imageUrl: null,
                        deliveryStatus: 'sending',
                    };

                    rememberPending(chatId, optimistic);
                    set((state) => {
                        if (state.chatId !== chatId) return state;

                        return {
                            messages: [...state.messages, optimistic],
                        };
                    });

                    try {
                        const idMessage = await greenApi.sendMessage({
                            recipientsPhoneNumber: chatId,
                            message: trimmed,
                        });
                        const sent: ChatMessage = {
                            ...optimistic,
                            id: `outgoing:${idMessage}`,
                            deliveryStatus: 'sent',
                        };

                        pendingMessages.delete(localId);
                        rememberPending(chatId, sent);
                        set((state) => {
                            if (state.chatId !== chatId) return state;

                            const withoutLocal = state.messages.filter(
                                (message) =>
                                    message.id !== localId &&
                                    message.id !== sent.id,
                            );

                            return {
                                messages: [...withoutLocal, sent].sort(
                                    (left, right) =>
                                        left.timestamp - right.timestamp,
                                ),
                            };
                        });
                    } catch (error) {
                        pendingMessages.delete(localId);
                        set((state) => {
                            if (state.chatId !== chatId) return state;

                            return {
                                messages: state.messages.filter(
                                    (message) => message.id !== localId,
                                ),
                            };
                        });
                        throw error;
                    }
                },
                refreshOutgoingStatuses: async (chatId, signal) => {
                    if (refreshing || signal?.aborted) return;
                    if (get().chatId !== chatId) return;

                    const targets = get()
                        .messages.filter(
                            (message) =>
                                message.direction === 'outgoing' &&
                                (message.deliveryStatus === 'sending' ||
                                    message.deliveryStatus === 'sent') &&
                                !message.id.startsWith('local:'),
                        )
                        .slice(-STATUS_POLL_LIMIT);

                    if (targets.length === 0) return;

                    refreshing = true;

                    try {
                        await Promise.all(
                            targets.map(async (message) => {
                                try {
                                    const next =
                                        await greenApi.getOutgoingStatus(
                                            chatId,
                                            apiMessageId(message.id),
                                            signal,
                                        );

                                    if (
                                        !next ||
                                        signal?.aborted ||
                                        get().chatId !== chatId
                                    ) {
                                        return;
                                    }

                                    patchMessage(
                                        chatId,
                                        message.id,
                                        (current) => ({
                                            ...current,
                                            deliveryStatus:
                                                preferDeliveryStatus(
                                                    current.deliveryStatus,
                                                    next,
                                                ),
                                        }),
                                    );
                                } catch (error) {
                                    if (
                                        isAbortError(error) ||
                                        signal?.aborted
                                    ) {
                                        return;
                                    }
                                }
                            }),
                        );
                    } finally {
                        refreshing = false;
                    }
                },
            };
        },
        { name: 'messages' },
    ),
);
