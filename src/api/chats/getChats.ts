import { useQuery } from '@tanstack/react-query';
import { greenApiClient, greenApiUrl } from '../../lib/green-api-client';
import { useAuthStore } from '../../store/authStore';
import type {
    ChatPayload,
    GreenApiChat,
    GreenApiCredentials,
} from '../greenApi.types';

export const chatsQueryKey = (credentials: GreenApiCredentials | null) =>
    ['chats', credentials] as const;

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

const fetchChats = async (
    credentials: GreenApiCredentials,
    signal?: AbortSignal,
) => {
    const { data } = await greenApiClient.get<unknown>(
        greenApiUrl(credentials, 'getChats'),
        { signal },
    );

    if (!Array.isArray(data)) throw new Error('Unexpected chats response');

    return data.flatMap((item) => {
        const chat = parseChat(item);
        return chat ? [chat] : [];
    });
};

export const useGetChats = () => {
    const credentials = useAuthStore((state) => state.credentials);

    return useQuery<GreenApiChat[]>({
        queryKey: chatsQueryKey(credentials),
        queryFn: ({ signal }) => fetchChats(credentials!, signal),
        enabled: !!credentials,
    });
};
