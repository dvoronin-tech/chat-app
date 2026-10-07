import type { SendMessagePayload } from '../api/greenApi.types.ts';
import { useState } from 'react';
import { greenApi } from '../api/greenApi.ts';

interface UseSendMessageProps {
    onSuccess?: () => void;
    onError?: () => void;
}

export const useSendMessage = ({ onSuccess, onError }: UseSendMessageProps) => {
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (data: SendMessagePayload) => {
        setError(null);
        setIsSending(true);

        try {
            const messageId = await greenApi.sendMessage(data);

            onSuccess?.();
            return messageId;
        } catch (error: unknown) {
            console.error(error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to send message',
            );
            onError?.();
        }

        setIsSending(false);
    };

    return {
        isPending: isSending,
        errorMessage: error,
        onSubmit
    }
};
