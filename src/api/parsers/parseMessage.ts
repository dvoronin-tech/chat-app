import { parseText } from './parseText.ts';
import type { ChatMessage } from '../greenApi.types';

export type MessagePayload = {
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

function parseMessageText(message: MessagePayload) {
    let text =
        parseText(message.textMessage) ||
        parseText(message.extendedTextMessage?.text) ||
        parseText(message.caption) ||
        parseText(message.pollMessageData?.name) ||
        parseText(message.extendedTextMessageData?.text);

    if (!text) {
        if (message.typeMessage === 'documentMessage') {
            text = parseText(message.fileName);
        }
    }

    return text || '';
}

export function parseMessage(value: unknown): ChatMessage | null {
    if (typeof value !== 'object' || value === null) return null;

    const message = value as MessagePayload;
    const idMessage = parseText(message.idMessage);
    if (
        !idMessage ||
        (message.type !== 'incoming' && message.type !== 'outgoing') ||
        message.isDeleted ||
        message.typeMessage === 'deletedMessage'
    ) {
        return null;
    }

    const imageUrl =
        message.typeMessage === 'imageMessage' ||
        message.typeMessage === 'stickerMessage'
            ? parseText(message.downloadUrl) || null
            : null;
    const label = message.typeMessage
        ? MESSAGE_TYPE_LABELS[message.typeMessage]
        : undefined;
    let text = parseMessageText(message);

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
            parseText(message.senderContactName) ||
            parseText(message.senderName) ||
            null,
        imageUrl,
        deliveryStatus: message.type === 'outgoing' ? 'sent' : null,
    };
}
