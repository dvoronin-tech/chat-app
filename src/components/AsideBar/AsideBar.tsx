import { useState } from 'react';
import PlusIcon from '../../assets/plus.svg?react';
import Button from '../Button/Button';
import Input from '../Input/Input';
import styles from './AsideBar.module.scss';

export default function AsideBar() {
    const [query, setQuery] = useState('');

    return (
        <aside className={styles.root}>
            <div className={styles.headerControls}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Чаты</h1>
                    <Button
                        type="button"
                        variant="primary"
                        className={styles.add}
                        aria-label="Новый чат"
                    >
                        <PlusIcon />
                    </Button>
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
