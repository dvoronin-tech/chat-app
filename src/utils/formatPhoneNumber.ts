export const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');

    if (!digits) return '';

    return `${digits}@c.us`;
};
