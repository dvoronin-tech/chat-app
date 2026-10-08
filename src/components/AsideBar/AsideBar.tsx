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
    const { chats, status, error, loadChats } = useChatsStore(
        useShallow(({ chats, status, error, loadChats }) => ({
            chats,
            status,
            error,
            loadChats,
        })),
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
                        <div className={styles.headerActions}>
                            <Button
                                type="button"
                                variant="simple"
                                disabled={status === 'loading'}
                                onClick={() => void loadChats()}
                            >
                                Обновить
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                className={styles.add}
                                aria-label="Новый чат"
                                onClick={() => setIsAddChatModalOpen(true)}
                            >
                                <PlusIcon />
                            </Button>
                        </div>
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
    const { selectedChatId, selectChat } = useChatsStore(
        useShallow(({ selectedChatId, selectChat }) => ({
            selectedChatId,
            selectChat,
        })),
    );

    if (status === 'loading')
        return <span className={styles.status}>Loading</span>;
    if (status === 'error')
        return <span className={styles.status}>{error}</span>;

    return (
        <div className={styles.list}>
            {chats.map((chat) => (
                <ChatCard
                    key={chat.id}
                    id={chat.id}
                    name={chat.name}
                    selected={chat.id === selectedChatId}
                    onSelect={selectChat}
                />
            ))}
        </div>
    );
});
