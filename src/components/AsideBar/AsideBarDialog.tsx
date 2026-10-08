import { type ChangeEvent, useState } from 'react';
import { useCheckWhatsapp } from '../../api/chats/checkWhatsapp';
import { useGetChats } from '../../api/chats/getChats';
import { useAuthStore } from '../../store/authStore';
import { useChatsStore } from '../../store/chatsStore';
import { formatPhoneNumber } from '../../utils/formatPhoneNumber.ts';
import Button from '../Button/Button';
import Dialog from '../Dialog/Dialog.tsx';
import Input from '../Input/Input.tsx';
import styles from './AsideBar.module.scss';

interface AsideBarDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AsideBarDialog({
    open,
    onOpenChange,
}: AsideBarDialogProps) {
    const credentials = useAuthStore((state) => state.credentials);
    const selectChat = useChatsStore((state) => state.selectChat);
    const { data: chats = [] } = useGetChats();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [validationError, setValidationError] = useState('');
    const { isPending, error, mutate } = useCheckWhatsapp();

    const openChat = (chatId: string) => {
        selectChat(chatId);
        onOpenChange(false);
    };

    const onOpenChat = () => {
        if (isPending || !credentials) return;

        if (!phoneNumber.trim()) {
            setValidationError('Phone number is required');
            return;
        }

        const formattedPhoneNumber = formatPhoneNumber(phoneNumber.trim());

        if (!formattedPhoneNumber) {
            setValidationError('Invalid phone number');
            return;
        }

        const digits = formattedPhoneNumber.split('@')[0];
        const existing = chats.find(
            (chat) =>
                chat.id === formattedPhoneNumber ||
                chat.id.split('@')[0] === digits,
        );

        setValidationError('');
        if (existing) {
            openChat(existing.id);
            return;
        }

        mutate(
            { credentials, phoneNumber: digits },
            {
                onSuccess: (exists) => {
                    if (!exists) {
                        setValidationError(
                            'This phone number is not on WhatsApp',
                        );
                        return;
                    }

                    openChat(formattedPhoneNumber);
                },
            },
        );
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setValidationError('');
        setPhoneNumber(event.target.value);
    };

    const visibleError = validationError || error?.message;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Title>Open chat</Dialog.Title>
            <Dialog.Description>
                Enter the phone number of the person you want to write to
            </Dialog.Description>
            <div className={styles.dialogContent}>
                <Input
                    name="phone"
                    placeholder="Recipients phone number"
                    type="tel"
                    value={phoneNumber}
                    onChange={handleChange}
                    disabled={isPending}
                />
                {visibleError && (
                    <span className={styles.error}>{visibleError}</span>
                )}
            </div>
            <Dialog.Actions className={styles.actions}>
                <Button
                    type="button"
                    onClick={() => {
                        onOpenChange(false);
                    }}
                    variant="simple"
                >
                    Close
                </Button>
                <Button
                    type="button"
                    variant="primary"
                    onClick={onOpenChat}
                    disabled={isPending}
                >
                    {isPending ? 'Opening' : 'Open'}
                </Button>
            </Dialog.Actions>
        </Dialog>
    );
}
