import { useQuery } from '@tanstack/react-query';
import { greenApiClient, greenApiUrl } from '../../lib/green-api-client';
import { queryClient } from '../../lib/query-client';
import { useAuthStore } from '../../store/authStore';
import type { ChatMessage, GreenApiCredentials } from '../greenApi.types';
import { parseMessage } from '../parsers/parseMessage';

export type CachedChatMessage = ChatMessage & { pending?: true };

export const chatHistoryQueryKey = (
    credentials: GreenApiCredentials | null,
    chatId: string | null,
) => ['chat-history', credentials, chatId] as const;

function sortMessages(messages: CachedChatMessage[]) {
    return messages.sort((left, right) => left.timestamp - right.timestamp);
}

function mergeHistory(
    history: ChatMessage[],
    previous: CachedChatMessage[] = [],
) {
    const merged = new Map<string, CachedChatMessage>();

    for (const message of history) {
        merged.set(message.id, message);
    }

    for (const message of previous) {
        if (message.pending && !merged.has(message.id)) {
            merged.set(message.id, message);
        }
    }

    return sortMessages([...merged.values()]);
}

const fetchChatHistory = async (
    credentials: GreenApiCredentials,
    chatId: string,
    signal?: AbortSignal,
) => {
    const { data } = await greenApiClient.post<unknown>(
        greenApiUrl(credentials, 'getChatHistory'),
        { chatId, count: 5000 },
        { signal },
    );

    if (!Array.isArray(data))
        throw new Error('Unexpected chat history response');

    return data.flatMap((item) => {
        const message = parseMessage(item);
        return message ? [message] : [];
    });
};

export const useGetChatHistory = (chatId: string | null) => {
    const credentials = useAuthStore((state) => state.credentials);
    const queryKey = chatHistoryQueryKey(credentials, chatId);

    return useQuery<CachedChatMessage[]>({
        queryKey,
        queryFn: async ({ signal }) => {
            const history = await fetchChatHistory(
                credentials!,
                chatId!,
                signal,
            );
            return mergeHistory(
                history,
                queryClient.getQueryData<CachedChatMessage[]>(queryKey),
            );
        },
        enabled: !!credentials && !!chatId,
    });
};
