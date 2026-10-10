import { create } from "zustand";


const getStoredUser = () => {
    try {
        const user = localStorage.getItem("user");

        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

export const useAuthStore = create((set) => ({
    user: getStoredUser(),
    token: localStorage.getItem("token"),

    setAuth: (user, token) => {
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);

        set({
            user,
            token,
        });
    },

    setUser: (user) => {
        localStorage.setItem("user", JSON.stringify(user));

        set({
            user,
        });
    },


    clearAuth: () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");


        set({
            user: null,
            token: null,
        });
    },
}));