/**
 * Returning trimmed string if the value is string, otherwise empty string
 * @param value
 * @return string
 */
export function parseText(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
}
