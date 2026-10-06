import { memo } from 'react';
import styles from './ChatCard.module.scss';

type ChatCardProps = {
    name: string;
};

function chatInitial(name: string) {
    const letter = Array.from(name.trim())[0];
    return letter ? letter.toLocaleUpperCase() : '?';
}

function ChatCard({ name }: ChatCardProps) {
    return (
        <article className={styles.root}>
            <div className={styles.avatar} aria-hidden="true">
                {chatInitial(name)}
            </div>
            <p className={styles.name}>{name}</p>
        </article>
    );
}

export default memo(ChatCard);
