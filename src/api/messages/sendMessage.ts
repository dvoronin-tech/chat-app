import { useMutation } from '@tanstack/react-query';
import { greenApiClient, greenApiUrl } from '../../lib/green-api-client';
import { queryClient } from '../../lib/query-client';
import type {
    GreenApiCredentials,
    SendMessagePayload,
    SendMessageResponse,
} from '../greenApi.types';
import { chatHistoryQueryKey, type CachedChatMessage } from './getChatHistory';

export type SendMessageRequest = SendMessagePayload & {
    credentials: GreenApiCredentials;
};

function parseMessageId(value: unknown) {
    if (typeof value !== 'object' || value === null) return null;

    const response = value as SendMessageResponse;
    if (
        typeof response.idMessage !== 'string' ||
        response.idMessage.length === 0
    ) {
        return null;
    }

    return response.idMessage;
}

const sendMessageRequest = async ({
    credentials,
    recipientsPhoneNumber,
    message,
}: SendMessageRequest) => {
    const { data } = await greenApiClient.post<unknown>(
        greenApiUrl(credentials, 'sendMessage'),
        { chatId: recipientsPhoneNumber, message: message.trim() },
    );
    const idMessage = parseMessageId(data);

    if (!idMessage) throw new Error('Unexpected send message response');
    return idMessage;
};

export const useSendMessage = () => {
    return useMutation({
        mutationFn: sendMessageRequest,
        onMutate: async ({ credentials, recipientsPhoneNumber, message }) => {
            const queryKey = chatHistoryQueryKey(
                credentials,
                recipientsPhoneNumber,
            );
            const optimistic: CachedChatMessage = {
                id: `local:${crypto.randomUUID()}`,
                direction: 'outgoing',
                timestamp: Math.floor(Date.now() / 1000),
                text: message.trim(),
                senderName: null,
                imageUrl: null,
                deliveryStatus: 'sending',
                pending: true,
            };

            if (queryClient.getQueryData(queryKey) !== undefined) {
                await queryClient.cancelQueries({ queryKey, exact: true });
                queryClient.setQueryData<CachedChatMessage[]>(
                    queryKey,
                    (messages) => messages && [...messages, optimistic],
                );
            }

            return { queryKey, optimistic };
        },
        onSuccess: async (idMessage, _request, context) => {
            if (!context) return;
            const { queryKey, optimistic } = context;

            if (queryClient.getQueryData(queryKey) !== undefined) {
                await queryClient.cancelQueries({ queryKey, exact: true });
                queryClient.setQueryData<CachedChatMessage[]>(
                    queryKey,
                    (messages) => {
                        if (!messages) return undefined;

                        const sent: CachedChatMessage = {
                            ...optimistic,
                            id: `outgoing:${idMessage}`,
                            deliveryStatus: 'sent',
                        };
                        const existing = messages.find(
                            (message) => message.id === sent.id,
                        );
                        const confirmed: CachedChatMessage = existing
                            ? { ...existing, deliveryStatus: 'sent' }
                            : sent;

                        return [
                            ...messages.filter(
                                (message) =>
                                    message.id !== optimistic.id &&
                                    message.id !== sent.id,
                            ),
                            confirmed,
                        ].sort(
                            (left, right) => left.timestamp - right.timestamp,
                        );
                    },
                );
            }
        },
        onError: async (_error, _request, context) => {
            if (!context) return;
            const { queryKey, optimistic } = context;

            if (queryClient.getQueryData(queryKey) !== undefined) {
                await queryClient.cancelQueries({ queryKey, exact: true });
                queryClient.setQueryData<CachedChatMessage[]>(
                    queryKey,
                    (messages) =>
                        messages?.filter(
                            (message) => message.id !== optimistic.id,
                        ),
                );
            }
        },
    });
};
