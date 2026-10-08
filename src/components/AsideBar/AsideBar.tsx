import { type FC, memo, useMemo, useState } from 'react';
import PlusIcon from '../../assets/plus.svg?react';
import type { GreenApiChat } from '../../api/greenApi.types';
import { useGetChats } from '../../api/chats/getChats';
import { chatFromId } from '../../api/parsers/parseChat';
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
        isLoading,
        isLoadingError,
        error,
        refetch,
    } = useGetChats();

    const selectedChatId = useChatsStore((state) => state.selectedChatId);
    const chatsWithSelected = useMemo(() => {
        if (
            !selectedChatId ||
            chats.some((chat) => chat.id === selectedChatId)
        ) {
            return chats;
        }

        return [chatFromId(selectedChatId), ...chats];
    }, [chats, selectedChatId]);
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const visibleChats = useMemo(() => {
        if (!normalizedQuery) return chatsWithSelected;

        return chatsWithSelected.filter((chat) =>
            chat.name.toLocaleLowerCase().includes(normalizedQuery),
        );
    }, [chatsWithSelected, normalizedQuery]);

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
                                disabled={isLoading}
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

                <ChatList
                    chats={visibleChats}
                    isLoading={isLoading}
                    isError={isLoadingError}
                    error={error?.message ?? null}
                />
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
