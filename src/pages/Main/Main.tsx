import clsx from 'clsx';
import { useReceiveMessages } from '../../api/messages/receiveMessages';
import AsideBar from '../../components/AsideBar/AsideBar';
import ChatView from '../../components/ChatView/ChatView';
import { useChatsStore } from '../../store/chatsStore';
import styles from './Main.module.scss';

export default function Main() {
    useReceiveMessages();
    const chatOpen = useChatsStore((state) => state.selectedChatId !== null);

    return (
        <div className={clsx(styles.root, chatOpen && styles.chatOpen)}>
            <div className={styles.sidebar}>
                <AsideBar />
            </div>
            <div className={styles.thread}>
                <ChatView />
            </div>
        </div>
    );
}
