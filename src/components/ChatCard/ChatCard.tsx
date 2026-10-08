import { memo } from 'react';
import clsx from 'clsx';
import type { GreenApiChat } from '../../api/greenApi.types';
import Avatar from '../Avatar/Avatar';
import styles from './ChatCard.module.scss';

type ChatCardProps = {
    id: string;
    name: string;
    type: GreenApiChat['type'];
    unreadCount: number;
    selected: boolean;
    onSelect: (id: string) => void;
};

function ChatCard({
    id,
    name,
    type,
    unreadCount,
    selected,
    onSelect,
}: ChatCardProps) {
    const badge = unreadCount > 99 ? '99+' : String(unreadCount);

    return (
        <button
            type="button"
            className={clsx(styles.root, selected && styles.selected)}
            aria-pressed={selected}
            onClick={() => onSelect(id)}
        >
            <Avatar
                name={name}
                rounded={type === 'group' ? 'squircle' : 'circle'}
            />
            <span className={styles.body}>
                <span className={styles.name}>{name}</span>
                {type === 'group' && <span className={styles.kind}>Группа</span>}
            </span>
            {unreadCount > 0 && <span className={styles.badge}>{badge}</span>}
        </button>
    );
}

export default memo(ChatCard);
