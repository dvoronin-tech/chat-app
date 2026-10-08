import { useMutation } from '@tanstack/react-query';
import { greenApiClient, greenApiUrl } from '../../lib/green-api-client';
import type { GreenApiCredentials } from '../greenApi.types';
import { parseWhatsappExists } from '../parsers/parseWhatsappExists';

type CheckWhatsappRequest = {
    credentials: GreenApiCredentials;
    phoneNumber: string;
};

const checkWhatsappRequest = async ({
    credentials,
    phoneNumber,
}: CheckWhatsappRequest) => {
    const { data } = await greenApiClient.post<unknown>(
        greenApiUrl(credentials, 'checkWhatsapp'),
        { phoneNumber: Number(phoneNumber) },
    );
    const exists = parseWhatsappExists(data);

    if (exists === null) throw new Error('Unexpected check WhatsApp response');

    return exists;
};

export const useCheckWhatsapp = () => {
    return useMutation({
        mutationFn: checkWhatsappRequest,
    });
};
