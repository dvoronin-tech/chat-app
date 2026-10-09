export function parseSetRead(value: unknown) {
    if (typeof value !== 'object' || value === null) return false;
    if (!('setRead' in value)) return false;

    return value.setRead === true;
}
