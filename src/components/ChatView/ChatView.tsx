import clsx from 'clsx';
import {
    type FC,
    type SubmitEvent,
    memo,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import type {
    ChatMessage,
    MessageDeliveryStatus,
} from '../../api/greenApi.types';
import { useChatsStore } from '../../store/chatsStore';
import {
    type MessagesStatus,
    useMessagesStore,
} from '../../store/messagesStore';
import { formatMessageTime, messageDate } from '../../utils/messageTime';
import Button from '../Button/Button';
import Input from '../Input/Input';
import styles from './ChatView.module.scss';

const STATUS_POLL_MS = 5000;

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
    const {
        loadedChatId,
        messages,
        status,
        error,
        loadMessages,
        sendMessage,
        refreshOutgoingStatuses,
    } = useMessagesStore(
        useShallow(
            ({
                chatId,
                messages,
                status,
                error,
                loadMessages,
                sendMessage,
                refreshOutgoingStatuses,
            }) => ({
                loadedChatId: chatId,
                messages,
                status,
                error,
                loadMessages,
                sendMessage,
                refreshOutgoingStatuses,
            }),
        ),
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

    useEffect(() => {
        if (!selectedChatId || visibleStatus !== 'ready') return;

        const controller = new AbortController();
        const tick = () => {
            void refreshOutgoingStatuses(selectedChatId, controller.signal);
        };
        const timer = window.setInterval(tick, STATUS_POLL_MS);
        tick();

        return () => {
            controller.abort();
            window.clearInterval(timer);
        };
    }, [selectedChatId, visibleStatus, refreshOutgoingStatuses]);

    if (!chat) {
        return (
            <section className={styles.root}>
                <p className={styles.placeholder}>Выберите чат</p>
            </section>
        );
    }

    const activeChat = chat;
    const showSender = activeChat.type !== 'user';

    return (
        <section className={styles.root} aria-label={activeChat.name}>
            <header className={styles.header}>
                <h2 className={styles.title}>{activeChat.name}</h2>
                <Button
                    type="button"
                    variant="simple"
                    className={styles.refresh}
                    disabled={visibleStatus === 'loading'}
                    onClick={() => void loadMessages(activeChat.id)}
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
            <Composer
                key={activeChat.id}
                canSend={visibleStatus === 'ready'}
                onSend={(text) => sendMessage(activeChat.id, text)}
            />
        </section>
    );
}

function Composer({
    canSend,
    onSend,
}: {
    canSend: boolean;
    onSend: (text: string) => Promise<void>;
}) {
    const [draft, setDraft] = useState('');
    const [sendError, setSendError] = useState<string | null>(null);
    const trimmed = draft.trim();
    const submitDisabled = !canSend || trimmed.length === 0;

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (submitDisabled) return;

        setDraft('');
        setSendError(null);

        try {
            await onSend(trimmed);
        } catch (submitError) {
            setDraft(trimmed);
            setSendError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Не удалось отправить сообщение',
            );
        }
    }

    return (
        <form className={styles.composer} onSubmit={handleSubmit}>
            <div className={styles.field}>
                <Input
                    value={draft}
                    onChange={(event) => {
                        setDraft(event.target.value);
                        if (sendError) setSendError(null);
                    }}
                    placeholder="Сообщение"
                    aria-label="Сообщение"
                    autoComplete="off"
                    enterKeyHint="send"
                    maxLength={4000}
                />
            </div>
            <Button
                type="submit"
                className={styles.send}
                aria-label="Отправить"
                disabled={submitDisabled}
            >
                <SendIcon />
            </Button>
            {sendError && <p className={styles.sendError}>{sendError}</p>}
        </form>
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
                        {(message.timestamp > 0 || message.deliveryStatus) && (
                            <div className={styles.meta}>
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
                                {message.deliveryStatus && (
                                    <Receipt status={message.deliveryStatus} />
                                )}
                            </div>
                        )}
                    </article>
                ))}
            </div>
        );
    },
);

const RECEIPT_LABEL: Record<MessageDeliveryStatus, string> = {
    sending: 'Отправляется',
    sent: 'Отправлено',
    checked: 'Прочитано',
};

function Receipt({ status }: { status: MessageDeliveryStatus }) {
    return (
        <span
            className={clsx(
                styles.receipt,
                status === 'checked' && styles.checked,
            )}
            role="img"
            aria-label={RECEIPT_LABEL[status]}
            title={RECEIPT_LABEL[status]}
        >
            {status === 'sending' ? (
                <ClockIcon />
            ) : status === 'checked' ? (
                <ChecksIcon />
            ) : (
                <CheckIcon />
            )}
        </span>
    );
}

function SendIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M20.5 4.5 10.8 14.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M20.5 4.5 13.8 20.2 10.8 14.2 4.8 11.2 20.5 4.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg viewBox="0 0 16 16" aria-hidden="true">
            <circle
                cx="8"
                cy="8"
                r="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
            />
            <path
                d="M8 4.6V8.2l2.3 1.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 16 16" aria-hidden="true">
            <path
                d="M3.2 8.3 6.4 11.5 12.8 4.7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ChecksIcon() {
    return (
        <svg viewBox="0 0 20 16" aria-hidden="true">
            <path
                d="M1.4 8.3 4.4 11.3 10.2 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7.2 8.3 10.2 11.3 16.6 4.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
