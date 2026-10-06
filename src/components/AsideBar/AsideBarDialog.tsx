import Button from '../Button/Button';
import Dialog from '../Dialog/Dialog.tsx';
import styles from './AsideBar.module.scss';
import Input from '../Input/Input.tsx';
import { useState } from 'react';

interface AsideBarDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AsideBarDialog({
    open,
    onOpenChange,
}: AsideBarDialogProps) {
    const [phoneNumber, setPhoneNumber] = useState('');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <Dialog.Title>Create new chat</Dialog.Title>
            <Dialog.Description>
                Enter the phone number of the person you want to write to
            </Dialog.Description>
            <div className={styles.content}>
                <Input
                    placeholder="Recipients phone number"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                />
            </div>
            <Dialog.Actions>
                <Button
                    onClick={() => {
                        onOpenChange(false);
                    }}
                    variant="simple"
                >
                    Close
                </Button>
                <Button variant="primary">Create</Button>
            </Dialog.Actions>
        </Dialog>
    );
}
