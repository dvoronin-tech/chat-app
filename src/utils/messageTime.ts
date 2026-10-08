export function messageDate(timestamp: number) {
    const milliseconds =
        timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;

    return new Date(milliseconds);
}

export function formatMessageTime(timestamp: number) {
    return new Intl.DateTimeFormat('ru', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(messageDate(timestamp));
}
