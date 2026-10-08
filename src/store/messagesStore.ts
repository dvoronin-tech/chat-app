import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { greenApi, isRequestCanceled as isAbortError } from '../api/greenApi';
import type { ChatMessage } from '../api/greenApi.types';

export type MessagesStatus = 'idle' | 'loading' | 'ready' | 'error';

type MessagesState = {
    chatId: string | null;
    messages: ChatMessage[];
    status: MessagesStatus;
    error: string | null;
    loadMessages: (chatId: string, signal?: AbortSignal) => Promise<void>;
};

export const useMessagesStore = create<MessagesState>()(
    devtools(
        (set) => {
            let requestId = 0;

            return {
                chatId: null,
                messages: [],
                status: 'idle',
                error: null,
                loadMessages: async (chatId, signal) => {
                    const id = ++requestId;
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

                        set({
                            messages,
                            status: 'ready',
                            error: null,
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
            };
        },
        { name: 'messages' },
    ),
);
