import { type FC, memo, useMemo, useState } from 'react';
import PlusIcon from '../../assets/plus.svg?react';
import type { GreenApiChat } from '../../api/greenApi.types';
import { useGetChats } from '../../api/chats/getChats';
import { chatFromId } from '../../api/parsers/parseChat';
import { useChatsStore } from '../../store/chatsStore';
import ChatCard from '../ChatCard/ChatCard';
import Input from '../Input/Input';
import styles from './AsideBar.module.scss';
import AsideBarDialog from './AsideBarDialog';
import { useShallow } from 'zustand/react/shallow';

const SKELETON_WIDTHS = ['72%', '54%', '66%', '48%', '78%', '58%', '44%'];

export default function AsideBar() {
    const [isAddChatModalOpen, setIsAddChatModalOpen] = useState(false);
    const [query, setQuery] = useState('');
    const { data: chats = [], isLoading, isLoadingError, error, refetch } =
        useGetChats();

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
                <header className={styles.header}>
                    <div className={styles.titleRow}>
                        <h1 className={styles.title}>Чаты</h1>
                        {!isLoading &&
                            !isLoadingError &&
                            !normalizedQuery &&
                            chatsWithSelected.length > 0 && (
                                <span className={styles.count}>
                                    {chatsWithSelected.length}
                                </span>
                            )}
                    </div>
                    <button
                        type="button"
                        className={styles.add}
                        aria-label="Новый чат"
                        onClick={() => setIsAddChatModalOpen(true)}
                    >
                        <PlusIcon />
                    </button>
                </header>
                <label className={styles.search}>
                    <SearchIcon />
                    <Input
                        className={styles.searchInput}
                        type="search"
                        placeholder="Поиск"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        aria-label="Поиск"
                    />
                    {query && (
                        <button
                            type="button"
                            className={styles.clear}
                            aria-label="Очистить поиск"
                            onClick={() => setQuery('')}
                        >
                            <ClearIcon />
                        </button>
                    )}
                </label>
                <ChatList
                    chats={visibleChats}
                    isLoading={isLoading}
                    isError={isLoadingError}
                    error={error?.message ?? null}
                    isFiltered={normalizedQuery.length > 0}
                    onRetry={() => void refetch()}
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
    isFiltered: boolean;
    onRetry: () => void;
}

const ChatList: FC<ChatListProps> = memo(
    ({ isLoading, isError, chats, error, isFiltered, onRetry }) => {
        const { selectedChatId, selectChat } = useChatsStore(
            useShallow(({ selectedChatId, selectChat }) => ({
                selectedChatId,
                selectChat,
            })),
        );

        if (isLoading) {
            return (
                <div className={styles.list} aria-busy="true">
                    <span className={styles.srOnly}>Загрузка</span>
                    {SKELETON_WIDTHS.map((width) => (
                        <div className={styles.skeleton} key={width}>
                            <span className={styles.skeletonAvatar} />
                            <span
                                className={styles.skeletonLine}
                                style={{ width }}
                            />
                        </div>
                    ))}
                </div>
            );
        }

        if (isError) {
            return (
                <div className={styles.state}>
                    <p className={styles.stateTitle}>Не удалось загрузить</p>
                    <p className={styles.stateText}>{error}</p>
                    <button
                        type="button"
                        className={styles.retry}
                        onClick={onRetry}
                    >
                        Повторить
                    </button>
                </div>
            );
        }

        if (chats.length === 0) {
            return (
                <div className={styles.state}>
                    <p className={styles.stateTitle}>
                        {isFiltered ? 'Ничего не найдено' : 'Чатов пока нет'}
                    </p>
                    <p className={styles.stateText}>
                        {isFiltered
                            ? 'Попробуйте другое имя'
                            : 'Начните новый чат по номеру телефона'}
                    </p>
                </div>
            );
        }

        return (
            <div className={styles.list}>
                {chats.map((chat) => (
                    <ChatCard
                        key={chat.id}
                        id={chat.id}
                        name={chat.name}
                        type={chat.type}
                        unreadCount={chat.unreadCount}
                        selected={chat.id === selectedChatId}
                        onSelect={selectChat}
                    />
                ))}
            </div>
        );
    },
);

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle
                cx="11"
                cy="11"
                r="6.25"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
            />
            <path
                d="M16 16.5 20 20.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </svg>
    );
}

function ClearIcon() {
    return (
        <svg viewBox="0 0 16 16" aria-hidden="true">
            <path
                d="M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
        </svg>
    );
}
