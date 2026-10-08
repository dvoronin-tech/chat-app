import clsx from 'clsx';
import {
    type FC,
    type SubmitEvent,
    memo,
    useEffect,
    useRef,
    useState,
    useMemo,
} from 'react';
import type {
    ChatMessage,
    MessageDeliveryStatus,
} from '../../api/greenApi.types';
import { useChatsStore } from '../../store/chatsStore';
import { useAuthStore } from '../../store/authStore';
import { useGetChats } from '../../api/chats/getChats';
import { useGetChatHistory } from '../../api/messages/getChatHistory';
import { useSendMessage } from '../../api/messages/sendMessage';
import { formatMessageTime, messageDate } from '../../utils/messageTime';
import Button from '../Button/Button';
import Input from '../Input/Input';
import styles from './ChatView.module.scss';

export default function ChatView() {
    const selectedChatId = useChatsStore((state) => state.selectedChatId);
    const credentials = useAuthStore((state) => state.credentials);
    const { data: chats = [] } = useGetChats();
    const chat = useMemo(
        () => chats.find((item) => item.id === selectedChatId) ?? null,
        [selectedChatId],
    );
    const {
        data: messages = [],
        isFetching,
        isError,
        isSuccess,
        error,
        refetch,
    } = useGetChatHistory(selectedChatId);
    const { mutateAsync: sendMessage } = useSendMessage();

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
                    disabled={isFetching}
                    onClick={() => void refetch()}
                >
                    Обновить
                </Button>
            </header>
            <MessageList
                isLoading={isFetching}
                isError={isError}
                messages={messages}
                error={error?.message ?? null}
                showSender={showSender}
            />
            <Composer
                key={activeChat.id}
                canSend={isSuccess && !isFetching}
                onSend={async (text) => {
                    if (!credentials) return;

                    await sendMessage({
                        credentials,
                        recipientsPhoneNumber: activeChat.id,
                        message: text,
                    });
                }}
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
    isLoading: boolean;
    isError: boolean;
    messages: ChatMessage[];
    error: string | null;
    showSender: boolean;
}

const MessageList: FC<MessageListProps> = memo(
    ({ isLoading, isError, messages, error, showSender }) => {
        const listRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const list = listRef.current;
            if (!list || isLoading || isError) return;

            list.scrollTop = list.scrollHeight;
        }, [messages, isLoading, isError]);

        if (isLoading) return <p className={styles.placeholder}>Загрузка</p>;
        if (isError) return <p className={styles.placeholder}>{error}</p>;
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
};

function Receipt({ status }: { status: MessageDeliveryStatus }) {
    return (
        <span
            className={styles.receipt}
            role="img"
            aria-label={RECEIPT_LABEL[status]}
            title={RECEIPT_LABEL[status]}
        >
            {status === 'sending' ? <ClockIcon /> : <CheckIcon />}
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
