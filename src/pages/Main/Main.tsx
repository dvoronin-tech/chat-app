import { useEffect } from 'react';
import AsideBar from '../../components/AsideBar/AsideBar';
import ChatView from '../../components/ChatView/ChatView';
import { useAuthStore } from '../../store/authStore';
import { useChatsStore } from '../../store/chatsStore';
import styles from './Main.module.scss';

export default function Main() {
    const credentials = useAuthStore((state) => state.credentials);
    const loadChats = useChatsStore((state) => state.loadChats);

    useEffect(() => {
        if (!credentials) return;

        const controller = new AbortController();
        void loadChats(controller.signal);

        return () => controller.abort();
    }, [credentials, loadChats]);

    return (
        <div className={styles.root}>
            <AsideBar />
            <ChatView />
        </div>
    );
}
