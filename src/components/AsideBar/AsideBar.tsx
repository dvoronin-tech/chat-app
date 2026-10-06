import { type FC, memo, useState } from 'react';
import PlusIcon from '../../assets/plus.svg?react';
import {
    type ChatsStatus,
    type Chat,
    useChatsStore,
} from '../../store/chatsStore';
import Button from '../Button/Button';
import ChatCard from '../ChatCard/ChatCard';
import Input from '../Input/Input';
import styles from './AsideBar.module.scss';
import AsideBarDialog from './AsideBarDialog';
import { useShallow } from 'zustand/react/shallow';

export default function AsideBar() {
    const [isAddChatModalOpen, setIsAddChatModalOpen] = useState(false);
    const [query, setQuery] = useState('');
    const { chats, status, error } = useChatsStore(
        useShallow(({ chats, status, error }) => ({ chats, status, error })),
    );

    const normalizedQuery = query.trim().toLocaleLowerCase();
    const visibleChats = normalizedQuery
        ? chats.filter((chat) =>
              chat.name.toLocaleLowerCase().includes(normalizedQuery),
          )
        : chats;

    return (
        <>
            <aside className={styles.root}>
                <div className={styles.headerControls}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>Чаты</h1>
                        <Button
                            type="button"
                            variant="primary"
                            className={styles.add}
                            aria-label="Новый чат"
                            onClick={() => setIsAddChatModalOpen(true)}
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
                {
                    <ChatList
                        chats={visibleChats}
                        status={status}
                        error={error}
                    />
                }
            </aside>
            {isAddChatModalOpen && (
                <AsideBarDialog
                    open={isAddChatModalOpen}
                    onOpenChange={setIsAddChatModalOpen}
                />
            )}
        </>
    );
}

interface ChatListProps {
    chats: Chat[];
    status: ChatsStatus;
    error: string | null;
}

const ChatList: FC<ChatListProps> = memo(({ status, chats, error }) => {
    if (status === 'loading')
        return <span className={styles.status}>Loading</span>;
    if (status === 'error')
        return <span className={styles.status}>{error}</span>;

    return (
        <div className={styles.list}>
            {chats.map((chat) => (
                <ChatCard key={chat.id} name={chat.name} />
            ))}
        </div>
    );
});
