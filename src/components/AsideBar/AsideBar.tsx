import { useState } from 'react';
import Input from '../Input/Input';
import styles from './AsideBar.module.scss';

export default function AsideBar() {
    const [query, setQuery] = useState('');

    return (
        <aside className={styles.root}>
            <div className={styles.headerControls}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Чаты</h1>
                    <button
                        type="button"
                        className={styles.add}
                        aria-label="Новый чат"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                d="M12 5v14M5 12h14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                            />
                        </svg>
                    </button>
                </header>
                <Input
                    type="search"
                    placeholder="Найти"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    aria-label="Найти"
                />
            </div>
        </aside>
    );
}
