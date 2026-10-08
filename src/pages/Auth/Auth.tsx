import { type SubmitEvent, useState } from 'react';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import { useAuthStore } from '../../store/authStore';
import styles from './Auth.module.scss';

export default function Auth() {
    const setCredentials = useAuthStore((state) => state.setCredentials);
    const [idInstance, setIdInstance] = useState('');
    const [apiTokenInstance, setApiTokenInstance] = useState('');

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const nextIdInstance = idInstance.trim();
        const nextApiTokenInstance = apiTokenInstance.trim();

        if (!nextIdInstance || !nextApiTokenInstance) {
            return;
        }

        setCredentials({
            idInstance: nextIdInstance,
            apiTokenInstance: nextApiTokenInstance,
        });
    }

    return (
        <main className={styles.root}>
            <form className={styles.form} onSubmit={handleSubmit}>
                <span className={styles.mark} aria-hidden="true">
                    <ChatMark />
                </span>
                <div className={styles.intro}>
                    <h1 className={styles.title}>Подключение</h1>
                    <p className={styles.lead}>
                        Данные инстанса Green API останутся только в этом
                        браузере.
                    </p>
                </div>
                <label className={styles.field}>
                    <span className={styles.label}>idInstance</span>
                    <Input
                        name="idInstance"
                        value={idInstance}
                        onChange={(event) => setIdInstance(event.target.value)}
                        autoComplete="off"
                        required
                    />
                </label>
                <label className={styles.field}>
                    <span className={styles.label}>apiTokenInstance</span>
                    <Input
                        name="apiTokenInstance"
                        type="password"
                        value={apiTokenInstance}
                        onChange={(event) =>
                            setApiTokenInstance(event.target.value)
                        }
                        autoComplete="off"
                        required
                    />
                </label>
                <Button className={styles.submit} type="submit">
                    Подключить
                </Button>
            </form>
        </main>
    );
}

function ChatMark() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M6.5 16.4 4.6 20.2V7.6A2.6 2.6 0 0 1 7.2 5h9.6A2.6 2.6 0 0 1 19.4 7.6v6.2a2.6 2.6 0 0 1-2.6 2.6H6.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
            />
        </svg>
    );
}
