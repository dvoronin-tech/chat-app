import axios from 'axios';
import type { GreenApiCredentials, Method } from '../api/greenApi.types';

export const greenApiClient = axios.create({
    baseURL: 'https://api.greenapi.com',
    headers: { 'Content-Type': 'application/json' },
});

export function greenApiUrl(
    { idInstance, apiTokenInstance }: GreenApiCredentials,
    method: Method,
) {
    return `/waInstance${idInstance}/${method}/${apiTokenInstance}`;
}
