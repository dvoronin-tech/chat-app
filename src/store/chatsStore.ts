import { create } from 'zustand';
import {
    getChats,
    getLastMessageText,
    isRequestCanceled,
} from '../api/greenApi';
import type { GreenApiChat, GreenApiCredentials } from '../api/greenApi.types';

export type Chat = GreenApiChat & {
    lastMessage: string;
};

export type ChatsStatus = 'idle' | 'loading' | 'ready' | 'error';

type ChatsState = {
    chats: Chat[];
    status: ChatsStatus;
    error: string | null;
    loadChats: (
        credentials: GreenApiCredentials,
        signal?: AbortSignal,
    ) => Promise<void>;
};

const HISTORY_CONCURRENCY = 10;

function isAbortError(error: unknown) {
    return isRequestCanceled(error);
}

async function mapWithConcurrency<T, R>(
    items: readonly T[],
    concurrency: number,
    mapper: (item: T) => Promise<R>,
) {
    const results = new Array<R>(items.length);
    let cursor = 0;

    async function worker() {
        while (cursor < items.length) {
            const index = cursor;
            cursor += 1;
            results[index] = await mapper(items[index]);
        }
    }

    const workerCount = Math.min(concurrency, items.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    return results;
}

export const useChatsStore = create<ChatsState>()((set) => {
    let requestId = 0;

    return {
        chats: [],
        status: 'idle',
        error: null,
        loadChats: async (credentials, signal) => {
            const id = ++requestId;
            set({ status: 'loading', error: null });

            try {
                const chats = await getChats(credentials, signal);
                const withLastMessage = await mapWithConcurrency(
                    chats,
                    HISTORY_CONCURRENCY,
                    async (chat) => {
                        let lastMessage = '';

                        try {
                            lastMessage = await getLastMessageText(
                                credentials,
                                chat.id,
                                signal,
                            );
                        } catch (error) {
                            if (isAbortError(error) || signal?.aborted) {
                                throw error;
                            }
                        }

                        return { ...chat, lastMessage };
                    },
                );

                if (signal?.aborted || id !== requestId) return;

                set({
                    chats: withLastMessage,
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
                            : 'Failed to load chats',
                });
            }
        },
    };
});
