export function parseWhatsappExists(value: unknown) {
    if (typeof value !== 'object' || value === null) return null;

    if ('existsWhatsapp' in value) {
        const exists = value.existsWhatsapp;
        return typeof exists === 'boolean' ? exists : null;
    }
    return null;
}
