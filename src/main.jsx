// main.jsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './theme/ThemeProvider';
import { useUserStore } from './store/userStore';
import api from './api'; // axios instance

function AppInitializer() {
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        // Treat this exactly like a 401
        clearUser();
        if (!token && location.pathname !== '/') {
          window.location.href = '/';
        }
        return;
      }

      try {
        const res = await api.post('/auth/profile', { token });

        if (res.data.success && res.data.data?.user) {
          const u = res.data.data.user;
          setUser({
            id: u.id,
            name: u.name,
            email: u.email,
            roleId: u.roleId,
            roleName: u.roleName,
            loaded: true
          });

          console.log("Profile fetched:", u);
        } else {
          console.error("Profile fetch failed:", res.data.message);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };

    fetchProfile();
  }, [setUser]);
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <AppInitializer />
  </ThemeProvider>
);

export default AppInitializer;
