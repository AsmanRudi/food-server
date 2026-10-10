import { create } from "zustand";

export const useCartStore = create ((set, get) => ({
    items: [],
    loading: false,

    setItems: (items) => {
        set({
            items,
        });
    },

    addItem: (product) => {
        const items = [...get().items];

        const existing = items.find(
            (items) => 
                String(items.product?._id || items.product) ===
            String(product._id)
        );

        if (existing) {
            existing.qty += 1;
        } else {
            items.push({
                product,
                qty: 1,
            });
        }

        set({
            items,
        });
    },

    increase: (productId) => {
        const items = get().items.map((item) => {
            const id =
            item.product?._id || item.product;

            if (String(id) === String(productId)) {
                return {
                    ...item,
                    qty: item.qty + 1,
                };
            }

            return item;
        });

        set({
            items,
        });
    },

    decrease: (productId) => {
        const items = get()
        .items
        .map((item) => {
            const id =
            item.product?._id || item.product;

            if (String(id) === String(productId)) {
                return {
                    ...item,
                    qty: item.qty - 1,
                };
            }

            return item;
        })
        .filter((item) => item.qty > 0);

        set({
            items,
        });
    },

    removeItem: (productId) => {
        const items = get().items.filter((item) => {
            const id =
            item.product?._id || item.product;

            return String(id) !== String(productId);
        });

        set({
            items,
        });
    },

    clearCart: () => {
        set({
            items: [],
        });
    },

    getTotal: () => {
        return get().items.reduce((total, item) => {
            const product = item.product;

            return (
                total +
                Number(product?.price || item.price || 0) *
                    Number(item.qty || 0)
            );
        }, 0);
    },

    getCount: () => {
        return get().items.reduce(
            (total, item) =>
                total + Number(item.qty || 0),
            0
        );
    },
}));