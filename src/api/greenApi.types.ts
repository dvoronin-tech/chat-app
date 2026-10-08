export type GreenApiCredentials = {
    idInstance: string;
    apiTokenInstance: string;
};

export type GreenApiChat = {
    id: string;
    name: string;
    type: 'user' | 'group';
    unreadCount: number;
    archive: boolean;
};

export type ChatPayload = {
    id?: string;
    name?: string;
    type?: string;
    unreadCount?: number;
    archive?: boolean;
    newChatId?: string;
};

export type SendMessagePayload = {
    recipientsPhoneNumber: string;
    message: string;
};

export type SendMessageResponse = {
    idMessage?: string;
};

export type MessageDeliveryStatus = 'sending' | 'sent' | 'checked';

export type ChatMessage = {
    id: string;
    direction: 'incoming' | 'outgoing';
    timestamp: number;
    text: string;
    senderName: string | null;
    imageUrl: string | null;
    deliveryStatus: MessageDeliveryStatus | null;
};

export type Method =
    'getChats' | 'sendMessage' | 'getChatHistory' | 'getMessage';
