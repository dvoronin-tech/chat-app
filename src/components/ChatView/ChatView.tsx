import clsx from 'clsx';
import {
    type FC,
    type SubmitEvent,
    memo,
    useLayoutEffect,
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
import {
    useGetChatHistory,
    type CachedChatMessage,
} from '../../api/messages/getChatHistory';
import { chatFromId } from '../../api/parsers/parseChat';
import { useSendMessage } from '../../api/messages/sendMessage';
import { formatMessageTime, messageDate } from '../../utils/messageTime';
import Avatar from '../Avatar/Avatar';
import Button from '../Button/Button';
import Input from '../Input/Input';
import { useReadVisibleMessages } from './useReadVisibleMessages';
import styles from './ChatView.module.scss';

export default function ChatView() {
    const selectedChatId = useChatsStore((state) => state.selectedChatId);
    const selectChat = useChatsStore((state) => state.selectChat);
    const credentials = useAuthStore((state) => state.credentials);
    const { data: chats = [], isFetched: chatsFetched } = useGetChats();
    const chat = useMemo(() => {
        if (!selectedChatId) return null;

        return (
            chats.find((item) => item.id === selectedChatId) ??
            chatFromId(selectedChatId)
        );
    }, [chats, selectedChatId]);
    const {
        data: messages = [],
        isLoading,
        isError,
        isSuccess,
        error,
        refetch,
    } = useGetChatHistory(selectedChatId);
    const { mutateAsync: sendMessage } = useSendMessage();

    if (!chat) {
        return (
            <section className={styles.root}>
                <div className={styles.empty}>
                    <span className={styles.emptyGlyph} aria-hidden="true">
                        <ChatMark />
                    </span>
                    <p className={styles.emptyTitle}>Выберите чат</p>
                    <p className={styles.emptyHint}>
                        Переписка откроется здесь
                    </p>
                </div>
            </section>
        );
    }

    const activeChat = chat;
    const showSender = activeChat.type !== 'user';

    return (
        <section className={styles.root} aria-label={activeChat.name}>
            <header className={styles.header}>
                <button
                    type="button"
                    className={styles.back}
                    aria-label="К чатам"
                    onClick={() => selectChat(null)}
                >
                    <BackIcon />
                </button>
                <Avatar
                    name={activeChat.name}
                    rounded={
                        activeChat.type === 'group' ? 'squircle' : 'circle'
                    }
                />
                <div className={styles.heading}>
                    <h2 className={styles.title}>{activeChat.name}</h2>
                    <p className={styles.subtitle}>
                        {activeChat.type === 'group' ? 'Группа' : 'Личный чат'}
                    </p>
                </div>
            </header>
            <div className={styles.canvas}>
                <MessageList
                    key={activeChat.id}
                    chatId={activeChat.id}
                    unreadCount={activeChat.unreadCount}
                    chatsFetched={chatsFetched}
                    isLoading={isLoading}
                    isError={isError}
                    isSuccess={isSuccess}
                    messages={messages}
                    error={error?.message ?? null}
                    showSender={showSender}
                    onRetry={() => void refetch()}
                />
            </div>
            <Composer
                key={activeChat.id}
                canSend={isSuccess}
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
                    className={styles.composerInput}
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
                <Button
                    type="submit"
                    className={styles.send}
                    aria-label="Отправить"
                    disabled={submitDisabled}
                >
                    <SendIcon />
                </Button>
            </div>
            {sendError && <p className={styles.sendError}>{sendError}</p>}
        </form>
    );
}

interface MessageListProps {
    chatId: string;
    unreadCount: number;
    chatsFetched: boolean;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
    messages: CachedChatMessage[];
    error: string | null;
    showSender: boolean;
    onRetry: () => void;
}

const MessageList: FC<MessageListProps> = memo(
    ({
        chatId,
        unreadCount,
        chatsFetched,
        isLoading,
        isError,
        isSuccess,
        messages,
        error,
        showSender,
        onRetry,
    }) => {
        const listRef = useRef<HTMLDivElement>(null);
        const unreadIds = useReadVisibleMessages({
            listRef,
            chatId,
            messages,
            unreadCount,
            chatsFetched,
            isSuccess,
        });

        useLayoutEffect(() => {
            const list = listRef.current;
            if (!list || isLoading || isError) return;

            list.scrollTop = list.scrollHeight;
        }, [messages, isLoading, isError]);

        if (isLoading) {
            return (
                <div className={styles.list} aria-busy="true">
                    <span className={styles.srOnly}>Загрузка</span>
                    <div className={styles.spacer} />
                    <span className={styles.bubbleSkeleton} />
                    <span
                        className={clsx(
                            styles.bubbleSkeleton,
                            styles.bubbleRight,
                        )}
                    />
                    <span
                        className={clsx(
                            styles.bubbleSkeleton,
                            styles.bubbleWide,
                        )}
                    />
                </div>
            );
        }

        if (isError) {
            return (
                <div className={styles.empty}>
                    <p className={styles.emptyTitle}>
                        Не удалось загрузить сообщения
                    </p>
                    <p className={clsx(styles.emptyHint, styles.danger)}>
                        {error}
                    </p>
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

        if (messages.length === 0) {
            return (
                <div className={styles.empty}>
                    <p className={styles.emptyTitle}>Пока пусто</p>
                    <p className={styles.emptyHint}>
                        Напишите первое сообщение
                    </p>
                </div>
            );
        }

        return (
            <div className={styles.list} ref={listRef}>
                <div className={styles.spacer} />
                {messages.map((message, index) => {
                    const groupedWithPrevious = isSameGroup(
                        messages[index - 1],
                        message,
                    );
                    const groupedWithNext = isSameGroup(
                        message,
                        messages[index + 1],
                    );

                    return (
                        <article
                            key={message.id}
                            data-message-id={
                                unreadIds.has(message.id)
                                    ? message.id
                                    : undefined
                            }
                            className={clsx(
                                styles.message,
                                styles[message.direction],
                                groupedWithPrevious &&
                                    styles.groupedWithPrevious,
                                groupedWithNext && styles.groupedWithNext,
                            )}
                        >
                            {showSender &&
                                !groupedWithPrevious &&
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
                            {(message.timestamp > 0 ||
                                message.deliveryStatus) && (
                                <div className={styles.meta}>
                                    {message.timestamp > 0 && (
                                        <time
                                            className={styles.time}
                                            dateTime={messageDate(
                                                message.timestamp,
                                            ).toISOString()}
                                        >
                                            {formatMessageTime(
                                                message.timestamp,
                                            )}
                                        </time>
                                    )}
                                    {message.deliveryStatus && (
                                        <Receipt
                                            status={message.deliveryStatus}
                                        />
                                    )}
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        );
    },
);

function isSameGroup(left?: ChatMessage, right?: ChatMessage) {
    if (!left || !right) return false;

    return (
        left.direction === right.direction &&
        left.senderName === right.senderName
    );
}

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

function ChatMark() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M6.5 16.4 4.6 20.2V7.6A2.6 2.6 0 0 1 7.2 5h9.6A2.6 2.6 0 0 1 19.4 7.6v6.2a2.6 2.6 0 0 1-2.6 2.6H6.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function BackIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M14.5 6.5 8.5 12l6 5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
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
