import clsx from 'clsx';
import { type FC, memo, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { ChatMessage } from '../../api/greenApi.types';
import { useChatsStore } from '../../store/chatsStore';
import {
    type MessagesStatus,
    useMessagesStore,
} from '../../store/messagesStore';
import { formatMessageTime, messageDate } from '../../utils/messageTime';
import Button from '../Button/Button';
import styles from './ChatView.module.scss';

export default function ChatView() {
    const { selectedChatId, chats } = useChatsStore(
        useShallow((state) => ({
            selectedChatId: state.selectedChatId,
            chats: state.chats,
        })),
    );
    const chat = useMemo(
        () => chats.find((item) => item.id === selectedChatId) ?? null,
        [chats, selectedChatId],
    );
    const { loadedChatId, messages, status, error, loadMessages } =
        useMessagesStore(
            useShallow(({ chatId, messages, status, error, loadMessages }) => ({
                loadedChatId: chatId,
                messages,
                status,
                error,
                loadMessages,
            })),
        );
    const isCurrentChat = loadedChatId === selectedChatId;
    const visibleStatus = isCurrentChat ? status : 'loading';
    const visibleMessages = isCurrentChat ? messages : [];

    useEffect(() => {
        if (!selectedChatId) return;

        const controller = new AbortController();
        void loadMessages(selectedChatId, controller.signal);

        return () => controller.abort();
    }, [selectedChatId, loadMessages]);

    if (!chat) {
        return (
            <section className={styles.root}>
                <p className={styles.placeholder}>Выберите чат</p>
            </section>
        );
    }

    const showSender = chat.type !== 'user';

    return (
        <section className={styles.root} aria-label={chat.name}>
            <header className={styles.header}>
                <h2 className={styles.title}>{chat.name}</h2>
                <Button
                    type="button"
                    variant="simple"
                    className={styles.refresh}
                    disabled={visibleStatus === 'loading'}
                    onClick={() => void loadMessages(chat.id)}
                >
                    Обновить
                </Button>
            </header>
            <MessageList
                status={visibleStatus}
                messages={visibleMessages}
                error={error}
                showSender={showSender}
            />
        </section>
    );
}

interface MessageListProps {
    status: MessagesStatus;
    messages: ChatMessage[];
    error: string | null;
    showSender: boolean;
}

const MessageList: FC<MessageListProps> = memo(
    ({ status, messages, error, showSender }) => {
        const listRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const list = listRef.current;
            if (!list || status !== 'ready') return;

            list.scrollTop = list.scrollHeight;
        }, [messages, status]);

        if (status === 'loading')
            return <p className={styles.placeholder}>Загрузка</p>;
        if (status === 'error')
            return <p className={styles.placeholder}>{error}</p>;
        if (status !== 'idle') return null;
        if (messages.length === 0)
            return <p className={styles.placeholder}>Нет сообщений</p>;

        return (
            <div className={styles.list} ref={listRef}>
                <div className={styles.spacer} />
                {messages.map((message) => (
                    <article
                        key={message.id}
                        className={clsx(
                            styles.message,
                            styles[message.direction],
                        )}
                    >
                        {showSender &&
                            message.direction === 'incoming' &&
                            message.senderName && (
                                <p className={styles.sender}>
                                    {message.senderName}
                                </p>
                            )}
                        {message.imageUrl && (
                            <img
                                className={styles.media}
                                src={message.imageUrl}
                                alt={message.text || 'Изображение'}
                            />
                        )}
                        {message.text && (
                            <p className={styles.text}>{message.text}</p>
                        )}
                        {message.timestamp > 0 && (
                            <time
                                className={styles.time}
                                dateTime={messageDate(
                                    message.timestamp,
                                ).toISOString()}
                            >
                                {formatMessageTime(message.timestamp)}
                            </time>
                        )}
                    </article>
                ))}
            </div>
        );
    },
);
