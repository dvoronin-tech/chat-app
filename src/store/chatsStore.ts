import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { greenApi, isRequestCanceled } from '../api/greenApi';
import type { GreenApiChat } from '../api/greenApi.types';

export type Chat = GreenApiChat;

export type ChatsStatus = 'idle' | 'loading' | 'ready' | 'error';

type ChatsState = {
    chats: Chat[];
    status: ChatsStatus;
    error: string | null;
    loadChats: (signal?: AbortSignal) => Promise<void>;
};

function isAbortError(error: unknown) {
    return isRequestCanceled(error);
}

export const useChatsStore = create<ChatsState>()(
    devtools(
        (set) => {
            let requestId = 0;

            return {
                chats: [],
                status: 'idle',
                error: null,
                loadChats: async (signal) => {
                    const id = ++requestId;
                    set({ status: 'loading', error: null });

                    try {
                        const chats = await greenApi.getChats(signal);

                        if (signal?.aborted || id !== requestId) return;

                        set({
                            chats,
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
        },
        { name: 'chats' },
    ),
);
