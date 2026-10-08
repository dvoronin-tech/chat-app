import { useQuery } from '@tanstack/react-query';
import { greenApiClient, greenApiUrl } from '../../lib/green-api-client';
import { queryClient } from '../../lib/query-client';
import { useAuthStore } from '../../store/authStore';
import type { ChatMessage, GreenApiCredentials } from '../greenApi.types';

export type CachedChatMessage = ChatMessage & { pending?: true };

export const chatHistoryQueryKey = (
    credentials: GreenApiCredentials | null,
    chatId: string | null,
) => ['chat-history', credentials, chatId] as const;

type MessagePayload = {
    type?: string;
    idMessage?: string;
    timestamp?: number;
    typeMessage?: string;
    textMessage?: string;
    caption?: string;
    fileName?: string;
    senderName?: string;
    senderContactName?: string;
    isDeleted?: boolean;
    downloadUrl?: string;
    extendedTextMessage?: { text?: string };
    extendedTextMessageData?: { text?: string };
    pollMessageData?: { name?: string };
};

const MESSAGE_TYPE_LABELS: Record<string, string> = {
    imageMessage: 'Изображение',
    videoMessage: 'Видео',
    documentMessage: 'Документ',
    audioMessage: 'Аудио',
    stickerMessage: 'Стикер',
    reactionMessage: 'Реакция',
    pollMessage: 'Опрос',
};

function readText(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
}

function parseMessage(value: unknown): ChatMessage | null {
    if (typeof value !== 'object' || value === null) return null;

    const message = value as MessagePayload;
    const idMessage = readText(message.idMessage);
    if (
        !idMessage ||
        (message.type !== 'incoming' && message.type !== 'outgoing')
    ) {
        return null;
    }

    const imageUrl =
        !message.isDeleted &&
        (message.typeMessage === 'imageMessage' ||
            message.typeMessage === 'stickerMessage')
            ? readText(message.downloadUrl) || null
            : null;
    const label = message.typeMessage
        ? MESSAGE_TYPE_LABELS[message.typeMessage]
        : undefined;
    let text = message.isDeleted
        ? 'Сообщение удалено'
        : readText(message.textMessage) ||
          readText(message.extendedTextMessage?.text) ||
          readText(message.caption) ||
          readText(message.pollMessageData?.name) ||
          readText(message.extendedTextMessageData?.text) ||
          (message.typeMessage === 'documentMessage'
              ? readText(message.fileName)
              : '') ||
          label ||
          'Сообщение';

    if (imageUrl && text === label) text = '';

    return {
        id: `${message.type}:${idMessage}`,
        direction: message.type,
        timestamp:
            typeof message.timestamp === 'number' &&
            Number.isFinite(message.timestamp)
                ? message.timestamp
                : 0,
        text,
        senderName:
            readText(message.senderContactName) ||
            readText(message.senderName) ||
            null,
        imageUrl,
        deliveryStatus: message.type === 'outgoing' ? 'sent' : null,
    };
}

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
