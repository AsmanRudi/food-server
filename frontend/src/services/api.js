import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 15000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    const isPublicAuthRequest = ["/auth/login", "/auth/register"].includes(config.url);

    if (token && !isPublicAuthRequest) {
        config.headers.Authorization = `Bearer ${token
        }`;
    }

        return config;
    
},
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().clearAuth();
        }

        return Promise.reject(error);
        
    }
    );

    export default api;
