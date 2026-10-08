import { type FC, memo, useState } from 'react';
import PlusIcon from '../../assets/plus.svg?react';
import type { GreenApiChat } from '../../api/greenApi.types';
import { useGetChats } from '../../api/chats/getChats';
import { useChatsStore } from '../../store/chatsStore';
import Button from '../Button/Button';
import ChatCard from '../ChatCard/ChatCard';
import Input from '../Input/Input';
import styles from './AsideBar.module.scss';
import AsideBarDialog from './AsideBarDialog';
import { useShallow } from 'zustand/react/shallow';

export default function AsideBar() {
    const [isAddChatModalOpen, setIsAddChatModalOpen] = useState(false);
    const [query, setQuery] = useState('');
    const {
        data: chats = [],
        isFetching,
        isError,
        error,
        refetch,
    } = useGetChats();

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
                                disabled={isFetching}
                                onClick={() => void refetch()}
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
                        isLoading={isFetching}
                        isError={isError}
                        error={error?.message ?? null}
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
    chats: GreenApiChat[];
    isLoading: boolean;
    isError: boolean;
    error: string | null;
}

const ChatList: FC<ChatListProps> = memo(
    ({ isLoading, isError, chats, error }) => {
        const { selectedChatId, selectChat } = useChatsStore(
            useShallow(({ selectedChatId, selectChat }) => ({
                selectedChatId,
                selectChat,
            })),
        );

        if (isLoading) return <span className={styles.status}>Loading</span>;
        if (isError) return <span className={styles.status}>{error}</span>;

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
    },
);
