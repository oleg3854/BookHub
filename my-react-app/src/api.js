import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || '/api/';
export const API_BASE_URL = rawApiUrl.endsWith('/') ? rawApiUrl : `${rawApiUrl}/`;

export const clearStoredAuth = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('username');
};

export const extractErrorMessage = (error, fallbackMessage = 'Что-то пошло не так.') => {
    const data = error?.response?.data;

    if (!data) {
        return fallbackMessage;
    }

    if (typeof data === 'string') {
        return data;
    }

    if (typeof data.error === 'string') {
        return data.error;
    }

    if (typeof data.message === 'string') {
        return data.message;
    }

    const firstValue = Object.values(data).flat().find(Boolean);
    return typeof firstValue === 'string' ? firstValue : fallbackMessage;
};

export const publicApi = axios.create({
    baseURL: API_BASE_URL,
});

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const refreshToken = localStorage.getItem('refresh');

        if (!error.response || !originalRequest) {
            return Promise.reject(error);
        }

        if (error.response.status === 401 && !originalRequest._retry && refreshToken) {
            originalRequest._retry = true;

            try {
                const response = await publicApi.post('token/refresh/', {
                    refresh: refreshToken,
                });

                localStorage.setItem('access', response.data.access);
                originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

                return api(originalRequest);
            } catch (refreshError) {
                clearStoredAuth();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
