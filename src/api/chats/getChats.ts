import { useQuery } from '@tanstack/react-query';
import { greenApiClient, greenApiUrl } from '../../lib/green-api-client';
import { useAuthStore } from '../../store/authStore';
import type { GreenApiChat, GreenApiCredentials } from '../greenApi.types';
import { parseChat } from '../parsers/parseChat';

export const chatsQueryKey = (credentials: GreenApiCredentials | null) =>
    ['chats', credentials] as const;

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
