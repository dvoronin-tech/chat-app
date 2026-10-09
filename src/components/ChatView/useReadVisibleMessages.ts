import { useEffect, useRef, useState, type RefObject } from 'react';
import type { CachedChatMessage } from '../../api/messages/getChatHistory';
import { readChatMessage } from '../../api/messages/readChat';
import { useAuthStore } from '../../store/authStore';

const READ_VISIBLE_RATIO = 0.4;

function incomingMessageId(message: CachedChatMessage | undefined) {
    if (!message || message.direction !== 'incoming') return null;

    const prefix = 'incoming:';
    if (!message.id.startsWith(prefix)) return null;

    const idMessage = message.id.slice(prefix.length);
    return idMessage || null;
}

function unreadMessageIds(messages: CachedChatMessage[], unreadCount: number) {
    const unreadIds = new Set<string>();
    const badgeIds = new Set<string>();
    let remaining = unreadCount;

    for (
        let index = messages.length - 1;
        index >= 0 && remaining > 0;
        index -= 1
    ) {
        const message = messages[index];
        if (!incomingMessageId(message)) continue;

        unreadIds.add(message.id);
        badgeIds.add(message.id);
        remaining -= 1;
    }

    for (const message of messages) {
        if (message.pending && incomingMessageId(message)) {
            unreadIds.add(message.id);
        }
    }

    return { unreadIds, badgeIds };
}

type UseReadVisibleMessagesParams = {
    listRef: RefObject<HTMLDivElement | null>;
    chatId: string;
    messages: CachedChatMessage[];
    unreadCount: number;
    chatsFetched: boolean;
    isSuccess: boolean;
};

export function useReadVisibleMessages({
    listRef,
    chatId,
    messages,
    unreadCount,
    chatsFetched,
    isSuccess,
}: UseReadVisibleMessagesParams) {
    const credentials = useAuthStore((state) => state.credentials);
    const [unreadIds, setUnreadIds] = useState<ReadonlySet<string>>(
        () => new Set(),
    );
    const unreadIdsRef = useRef(new Set<string>());
    const badgeIdsRef = useRef(new Set<string>());
    const knownIdsRef = useRef(new Set<string>());
    const seededRef = useRef(false);
    const failedRef = useRef(new Set<string>());
    const inFlightRef = useRef(new Set<string>());
    const messagesRef = useRef(messages);
    const credentialsRef = useRef(credentials);
    const chatIdRef = useRef(chatId);

    useEffect(() => {
        messagesRef.current = messages;
        credentialsRef.current = credentials;
        chatIdRef.current = chatId;
    }, [chatId, credentials, messages]);

    useEffect(() => {
        if (seededRef.current || !isSuccess || !chatsFetched) return;

        const next = unreadMessageIds(messages, unreadCount);
        seededRef.current = true;
        knownIdsRef.current = new Set(messages.map((message) => message.id));
        badgeIdsRef.current = next.badgeIds;
        unreadIdsRef.current = next.unreadIds;
        setUnreadIds(next.unreadIds);
    }, [chatsFetched, isSuccess, messages, unreadCount]);

    useEffect(() => {
        if (!seededRef.current) return;

        const nextUnread = new Set(unreadIdsRef.current);
        let changed = false;

        for (const message of messages) {
            if (knownIdsRef.current.has(message.id)) continue;

            knownIdsRef.current.add(message.id);
            if (!incomingMessageId(message)) continue;

            nextUnread.add(message.id);
            changed = true;
        }

        if (!changed) return;

        unreadIdsRef.current = nextUnread;
        setUnreadIds(nextUnread);
    }, [messages]);

    useEffect(() => {
        const list = listRef.current;
        if (!list || unreadIds.size === 0) return;

        async function markVisibleMessageRead(messageId: string) {
            if (failedRef.current.has(messageId)) return;
            if (inFlightRef.current.has(messageId)) return;
            if (!unreadIdsRef.current.has(messageId)) return;

            const idMessage = incomingMessageId(
                messagesRef.current.find((message) => message.id === messageId),
            );
            const currentCredentials = credentialsRef.current;
            if (!idMessage || !currentCredentials) return;

            const decreaseUnread = badgeIdsRef.current.has(messageId);
            inFlightRef.current.add(messageId);

            try {
                await readChatMessage({
                    credentials: currentCredentials,
                    chatId: chatIdRef.current,
                    idMessage,
                    decreaseUnread,
                });

                inFlightRef.current.delete(messageId);
                badgeIdsRef.current.delete(messageId);
                if (!unreadIdsRef.current.has(messageId)) return;

                const nextUnread = new Set(unreadIdsRef.current);
                nextUnread.delete(messageId);
                unreadIdsRef.current = nextUnread;
                setUnreadIds(nextUnread);
            } catch {
                inFlightRef.current.delete(messageId);
                failedRef.current.add(messageId);
            }
        }

        function readEntries(entries: IntersectionObserverEntry[]) {
            if (document.visibilityState !== 'visible') return;

            const latest = new Map<Element, IntersectionObserverEntry>();
            for (const entry of entries) latest.set(entry.target, entry);

            for (const entry of latest.values()) {
                const messageId = (entry.target as HTMLElement).dataset
                    .messageId;
                if (!messageId) continue;

                if (entry.intersectionRatio < READ_VISIBLE_RATIO) {
                    failedRef.current.delete(messageId);
                    continue;
                }

                void markVisibleMessageRead(messageId);
            }
        }

        const observer = new IntersectionObserver(readEntries, {
            root: list,
            threshold: [0, READ_VISIBLE_RATIO],
        });
        const nodes = list.querySelectorAll<HTMLElement>('[data-message-id]');

        for (const node of nodes) observer.observe(node);

        function handleVisibilityChange() {
            if (document.visibilityState !== 'visible') return;

            for (const node of nodes) {
                observer.unobserve(node);
                observer.observe(node);
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            observer.disconnect();
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
        };
    }, [listRef, messages, unreadIds]);

    return unreadIds;
}
