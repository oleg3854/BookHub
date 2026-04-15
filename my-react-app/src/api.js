import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: `${BASE_URL}/api/`,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh');
                
                const response = await axios.post(`${BASE_URL}/api/token/refresh/`, {
                    refresh: refreshToken
                });

                localStorage.setItem('access', response.data.access);

                originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                return api(originalRequest);
                
            } catch (refreshError) {
                console.error("Сессия истекла, нужно заново войти в систему");
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;