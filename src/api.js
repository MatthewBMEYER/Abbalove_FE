import axios from 'axios';
import { useUserStore } from './store/userStore';

const api = axios.create({
    baseURL: 'http://localhost:801',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        //console.log(token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            useUserStore.getState().clearUser();
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);


export default api;
