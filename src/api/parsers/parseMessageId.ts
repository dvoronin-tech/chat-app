export type SendMessageResponse = {
    idMessage?: string;
};

export function parseMessageId(value: unknown) {
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
