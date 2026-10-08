import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type ChatsState = {
    selectedChatId: string | null;
    selectChat: (chatId: string | null) => void;
};

export const useChatsStore = create<ChatsState>()(
    devtools(
        (set) => ({
            selectedChatId: null,
            selectChat: (chatId) => set({ selectedChatId: chatId }),
        }),
        { name: 'chats' },
    ),
);
