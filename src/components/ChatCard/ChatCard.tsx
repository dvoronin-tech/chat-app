import { memo } from 'react';
import clsx from 'clsx';
import styles from './ChatCard.module.scss';

type ChatCardProps = {
    id: string;
    name: string;
    selected: boolean;
    onSelect: (id: string) => void;
};

function chatInitial(name: string) {
    const letter = Array.from(name.trim())[0];
    return letter ? letter.toLocaleUpperCase() : '?';
}

function ChatCard({ id, name, selected, onSelect }: ChatCardProps) {
    return (
        <button
            type="button"
            className={clsx(styles.root, selected && styles.selected)}
            aria-pressed={selected}
            onClick={() => onSelect(id)}
        >
            <div className={styles.avatar} aria-hidden="true">
                {chatInitial(name)}
            </div>
            <p className={styles.name}>{name}</p>
        </button>
    );
}

export default memo(ChatCard);
