import {
    Minus,
    Plus,
    Trash2,
} from "lucide-react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import { toast } from "sonner";

import {
    useCartStore,
} from "../store/cartStore";

import {
    updateCart,
} from "../services/cart.service";

import {
    formatRupiah,
} from "../utils/format";

import {
    getImageUrl,
} from "../utils/image";

const Cart = () => {
  const navigate = useNavigate();

  const {
    items,
    increase,
    decrease,
    removeItem,
    getTotal,
  } = useCartStore();

  const total = getTotal();

  const saveCart = async () => {
    try {
      await updateCart(
        items.map((item) => ({
          product:
            item.product?._id ||
            item.product,
          qty: item.qty,
        }))
      );

      toast.success(
        "Keranjang diperbarui"
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Gagal menyimpan keranjang"
      );
    }
  };

  if (!items.length) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">

        <div className="mx-auto max-w-md rounded-3xl bg-white p-10 shadow-sm">

          <h1 className="text-3xl font-black">
            Keranjang kosong
          </h1>

          <p className="mt-3 text-slate-500">
            Yuk pilih makanan favoritmu.
          </p>

          <Link
            to="/products"
            className="mt-6 inline-block rounded-xl bg-orange-500 px-6 py-3 font-bold text-white"
          >
            Lihat Menu
          </Link>

        </div>

      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">

      <h1 className="text-4xl font-black">
        Keranjang
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_350px]">

        <div className="space-y-4">

          {items.map((item) => {
            const product =
              item.product;

            return (
              <div
                key={
                  product?._id ||
                  product
                }
                className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm"
              >

                <img
                  src={getImageUrl(
                    product?.image_url ||
                    item.image_url
                  )}
                  alt={
                    product?.name ||
                    item.name
                  }
                  className="h-24 w-24 rounded-xl object-cover"
                />

                <div className="flex flex-1 flex-col">

                  <h3 className="font-bold">
                    {product?.name ||
                      item.name}
                  </h3>

                  <p className="mt-1 font-semibold text-orange-500">
                    {formatRupiah(
                      product?.price ||
                      item.price
                    )}
                  </p>

                  <div className="mt-auto flex items-center justify-between">

                    <div className="flex items-center gap-2">

                      <button
                        onClick={() =>
                          decrease(
                            product?._id ||
                              product
                          )
                        }
                        className="rounded-lg bg-slate-100 p-2"
                      >
                        <Minus size={16} />
                      </button>

                      <span className="w-8 text-center font-bold">
                        {item.qty}
                      </span>

                      <button
                        onClick={() =>
                          increase(
                            product?._id ||
                              product
                          )
                        }
                        className="rounded-lg bg-slate-100 p-2"
                      >
                        <Plus size={16} />
                      </button>

                    </div>

                    <button
                      onClick={() =>
                        removeItem(
                          product?._id ||
                            product
                        )
                      }
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>

                  </div>

                </div>

              </div>
            );
          })}

          <button
            onClick={saveCart}
            className="rounded-xl border border-orange-500 px-5 py-3 font-bold text-orange-500"
          >
            Simpan Keranjang
          </button>

        </div>

        <div className="h-fit rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-black">
            Ringkasan
          </h2>

          <div className="mt-6 flex justify-between">
            <span className="text-slate-500">
              Subtotal
            </span>

            <strong>
              {formatRupiah(total)}
            </strong>
          </div>

          <div className="my-5 border-t" />

          <div className="flex justify-between text-lg">
            <strong>Total</strong>

            <strong className="text-orange-500">
              {formatRupiah(total)}
            </strong>
          </div>

          <button
            onClick={async () => {
              await saveCart();
              navigate("/checkout");
            }}
            className="mt-6 w-full rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600"
          >
            Checkout
          </button>

        </div>

      </div>

    </div>
  );
};

export default Cart;