import api from "./api";

export const register = async (data) => {
    const response = await api.post("/auth/register", data);

    return response.data;
}


export const login = async (data) => {
    const response = await api.post("/auth/login", data);

    const { token, user } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return response.data;

};

export const getMe = async () => {
    const response = await api.get("/auth/me");

    return response.data;
};

export const logout = async () => { 
    try {
        await api.post("/auth/logout");
    } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    }
};

