import AsideBar from '../../components/AsideBar/AsideBar';
import ChatView from '../../components/ChatView/ChatView';
import styles from './Main.module.scss';

export default function Main() {
    return (
        <div className={styles.root}>
            <AsideBar />
            <ChatView />
        </div>
    );
}
