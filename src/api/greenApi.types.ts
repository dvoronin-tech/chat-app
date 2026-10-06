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

export type HistoryMessage = {
    typeMessage?: unknown;
    textMessage?: unknown;
    caption?: unknown;
    fileName?: unknown;
    isDeleted?: unknown;
};

export type Method = 'getChats' | 'getChatHistory';
