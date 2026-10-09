import { greenApiClient, greenApiUrl } from '../../lib/green-api-client';
import { queryClient } from '../../lib/query-client';
import type { GreenApiChat, GreenApiCredentials } from '../greenApi.types';
import { chatsQueryKey } from '../chats/getChats';
import { parseSetRead } from '../parsers/parseSetRead';

type ReadChatMessageParams = {
    credentials: GreenApiCredentials;
    chatId: string;
    idMessage: string;
    decreaseUnread: boolean;
};

const readRequests = new Map<string, Promise<void>>();

function readKey({ credentials, chatId, idMessage }: ReadChatMessageParams) {
    return `${credentials.idInstance}:${chatId}:${idMessage}`;
}

function decreaseUnreadCount(credentials: GreenApiCredentials, chatId: string) {
    queryClient.setQueryData<GreenApiChat[]>(
        chatsQueryKey(credentials),
        (chats) => {
            if (!chats) return chats;

            return chats.map((chat) =>
                chat.id === chatId
                    ? {
                          ...chat,
                          unreadCount: Math.max(0, chat.unreadCount - 1),
                      }
                    : chat,
            );
        },
    );
}

async function performRead(params: ReadChatMessageParams) {
    const { credentials, chatId, idMessage, decreaseUnread } = params;

    try {
        const { data } = await greenApiClient.post<unknown>(
            greenApiUrl(credentials, 'readChat'),
            { chatId, idMessage },
        );

        if (!parseSetRead(data)) {
            throw new Error('Unexpected read chat response');
        }

        if (decreaseUnread) decreaseUnreadCount(credentials, chatId);
    } catch (error) {
        readRequests.delete(readKey(params));
        throw error;
    }
}

export function readChatMessage(params: ReadChatMessageParams) {
    const key = readKey(params);
    const existing = readRequests.get(key);
    if (existing) return existing;

    const request = performRead(params);
    readRequests.set(key, request);
    return request;
}
