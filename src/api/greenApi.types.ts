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
};

export type SendMessagePayload = {
    recipientsPhoneNumber: string;
    message: string;
};

export type SendMessageResponse = {
    idMessage?: string;
};

export type Method = 'getChats' | 'sendMessage';
