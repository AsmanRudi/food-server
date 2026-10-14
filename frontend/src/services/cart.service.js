import api from "./api";

export const getCart = async () => {
    const response = await api.get("/api/carts");

    return response.data;
};

export const updateCart = async (items) => {
    const response = await api.put(
        "/api/carts",
        {
            items,
        }
    );

    return response.data;
}