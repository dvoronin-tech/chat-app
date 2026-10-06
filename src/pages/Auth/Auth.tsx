import { type SubmitEvent, useState } from 'react';
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
                <h1 className={styles.title}>Подключение</h1>
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
                <button className={styles.submit} type="submit">
                    Сохранить
                </button>
            </form>
        </main>
    );
}
