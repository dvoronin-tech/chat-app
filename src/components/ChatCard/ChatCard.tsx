import { memo } from 'react';
import styles from './ChatCard.module.scss';

type ChatCardProps = {
    name: string;
    lastMessage: string;
};

function chatInitial(name: string) {
    const letter = Array.from(name.trim())[0];
    return letter ? letter.toLocaleUpperCase() : '?';
}

function ChatCard({ name, lastMessage }: ChatCardProps) {
    return (
        <article className={styles.root}>
            <div className={styles.avatar} aria-hidden="true">
                {chatInitial(name)}
            </div>
            <div className={styles.body}>
                <p className={styles.name}>{name}</p>
                <p className={styles.preview}>{lastMessage || '\u00a0'}</p>
            </div>
        </article>
    );
}

export default memo(ChatCard);
