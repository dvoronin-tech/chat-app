type NotificationEnvelope = {
    receiptId?: unknown;
    body?: unknown;
};

export type ParsedNotification = {
    receiptId: number;
    body: unknown;
};

export function parseNotification(data: unknown): ParsedNotification | null {
    if (typeof data !== 'object' || data === null) return null;

    const envelope = data as NotificationEnvelope;
    if (
        typeof envelope.receiptId !== 'number' ||
        !Number.isFinite(envelope.receiptId)
    )
        return null;

    return { receiptId: envelope.receiptId, body: envelope.body };
}
