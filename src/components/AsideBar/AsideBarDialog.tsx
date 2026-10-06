import Button from '../Button/Button';
import Dialog from '../Dialog/Dialog.tsx';
import styles from './AsideBar.module.scss';
import Input from '../Input/Input.tsx';
import { type ChangeEvent, useState } from 'react';

interface AsideBarDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AsideBarDialog({
    open,
    onOpenChange,
}: AsideBarDialogProps) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const onSendMessage = () => {
        if (!phoneNumber) return setErrorMessage('Phone number is required');
    };

    const handleChange = (
        event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
    ) => {
        const target = event.target;
        const { name, value } = target;

        setErrorMessage('');

        if (name === 'phone') setPhoneNumber(value);
        if (name === 'message') setMessage(value);
    };

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
                />
                <Input
                    name="message"
                    placeholder="Enter message"
                    as="textarea"
                    className={styles.textArea}
                    onChange={handleChange}
                    value={message}
                />
                {errorMessage && (
                    <span className={styles.error}>{errorMessage}</span>
                )}
            </div>
            <Dialog.Actions className={styles.actions}>
                <Button
                    onClick={() => {
                        onOpenChange(false);
                    }}
                    variant="simple"
                >
                    Close
                </Button>
                <Button variant="primary" onClick={onSendMessage}>
                    Send
                </Button>
            </Dialog.Actions>
        </Dialog>
    );
}
