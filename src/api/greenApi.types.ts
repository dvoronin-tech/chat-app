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

export type SendMessagePayload = {
    recipientsPhoneNumber: string;
    message: string;
};

export type MessageDeliveryStatus = 'sending' | 'sent';

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
    | 'getChats'
    | 'checkWhatsapp'
    | 'sendMessage'
    | 'getChatHistory'
    | 'getMessage'
    | 'receiveNotification'
    | 'deleteNotification';
