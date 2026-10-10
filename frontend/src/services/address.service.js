import api from "./api";

export const getAddresses = async (data) => {
    const response = await api.get(
        "/api/delivery-addresses"
    );

    return response.data;
}

export const createAddress = async (data) => {
    const response = await api.post(
        "/api/delivery-addresses",
        data
    );

    return response.data;
};

export const updateAddress = async (id, data) => {
    const response = await api.put(
        `/api/delivery-addresses/${id}`,
        data
    );

    return response.data;
};

export const deleteAddress = async (id) => {
    const response = await api.delete(
        `/api/delivery-addresses/${id}`,
    );

    return response.data;
};