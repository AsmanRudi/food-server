import api from "./api";

export const getUsers = async () => {
    const response = await api.get("/api/users");
    return response.data;
};

export const createUser = async (data) => {
    const response = await api.post("/api/users", data);
    return response.data;
};

export const updateUserRole = async (id, role) => {
    const response = await api.patch(`/api/users/${id}/role`, { role });
    return response.data;
};
