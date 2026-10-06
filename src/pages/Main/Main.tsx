import AsideBar from '../../components/AsideBar/AsideBar';
import styles from './Main.module.scss';

export default function Main() {
    return (
        <div className={styles.root}>
            <AsideBar />
        </div>
    );
}
