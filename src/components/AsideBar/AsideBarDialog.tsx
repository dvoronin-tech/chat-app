import { type ChangeEvent, useState } from 'react';
import { useSendMessage } from '../../api/messages/sendMessage';
import { useAuthStore } from '../../store/authStore';
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
    const [phoneNumber, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');
    const [validationError, setValidationError] = useState('');
    const { isPending, error, mutate } = useSendMessage();

    const onSendMessage = () => {
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

        const trimmedMessage = message.trim();

        if (!trimmedMessage) {
            setValidationError('Message is required');
            return;
        }

        if (trimmedMessage.length >= 4000) {
            setValidationError('Message must be less then 4000 characters');
            return;
        }

        setValidationError('');
        mutate(
            {
                credentials,
                recipientsPhoneNumber: formattedPhoneNumber,
                message: trimmedMessage,
            },
            { onSuccess: () => onOpenChange(false) },
        );
    };

    const handleChange = (
        event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
    ) => {
        const target = event.target;
        const { name, value } = target;

        setValidationError('');

        if (name === 'phone') setPhoneNumber(value);
        if (name === 'message') {
            if (value.trim().length >= 4000)
                return setValidationError(
                    'Message must be less then 4000 characters',
                );
            setMessage(value);
        }
    };

    const visibleError = validationError || error?.message;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Title>Create new chat</Dialog.Title>
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
                <Input
                    name="message"
                    placeholder="Enter message"
                    as="textarea"
                    className={styles.textArea}
                    onChange={handleChange}
                    value={message}
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
                    onClick={onSendMessage}
                    disabled={isPending}
                >
                    {isPending ? 'Sending' : 'Send'}
                </Button>
            </Dialog.Actions>
        </Dialog>
    );
}
