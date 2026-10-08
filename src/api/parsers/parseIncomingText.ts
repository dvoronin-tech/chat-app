import { parseText } from './parseText.ts';

export type IncomingNotification = {
    typeWebhook?: unknown;
    timestamp?: unknown;
    idMessage?: unknown;
    senderData?: {
        chatId?: unknown;
        senderName?: unknown;
        senderContactName?: unknown;
        senderPhoneNumber?: unknown;
    };
    messageData?: {
        typeMessage?: unknown;
        textMessageData?: { textMessage?: unknown };
    };
};

export type IncomingText = {
    idMessage: string;
    chatId: string;
    phone: string;
    text: string;
    timestamp: number;
    senderName: string | null;
};

export function parseIncomingText(body: unknown): IncomingText | null {
    if (typeof body !== 'object' || body === null) return null;

    const notification = body as IncomingNotification;

    if (notification.typeWebhook !== 'incomingMessageReceived') return null;
    if (notification.messageData?.typeMessage !== 'textMessage') return null;

    const text = parseText(
        notification.messageData.textMessageData?.textMessage,
    );
    const chatId = parseText(notification.senderData?.chatId);
    const idMessage = parseText(notification.idMessage);
    if (!text || !chatId || !idMessage) return null;

    const phoneNumber = notification.senderData?.senderPhoneNumber;
    const phone =
        typeof phoneNumber === 'number' && phoneNumber > 0
            ? String(phoneNumber)
            : '';
    const senderName =
        parseText(notification.senderData?.senderContactName) ||
        parseText(notification.senderData?.senderName) ||
        null;

    return {
        idMessage,
        chatId,
        phone,
        text,
        timestamp:
            typeof notification.timestamp === 'number' &&
            Number.isFinite(notification.timestamp)
                ? notification.timestamp
                : Math.floor(Date.now() / 1000),
        senderName,
    };
}
