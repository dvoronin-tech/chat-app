import Main from './pages/Main/Main';
import { useAuthStore } from './store/authStore.ts';
import Auth from './pages/Auth/Auth.tsx';

function App() {
    const credentials = useAuthStore((s) => s.credentials);

    if (!credentials) return <Auth />

    return <Main />;
}

export default App;
