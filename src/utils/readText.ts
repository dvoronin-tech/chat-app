export function readText(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
}
