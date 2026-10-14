import { useEffect, useState } from "react";

import {
    Link,
} from "react-router-dom";

import {
    getOrders,
} from "../services/order.service";

import {
    formatDate,
    formatRupiah,
} from "../utils/format";

const statusLabel = {
  waiting_payment: "Menunggu Pembayaran",
  processing: "Diproses",
  in_delivery: "Sedang Diantar",
  delivered: "Selesai",
};

const Orders = () => {
  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);
  const [loadError, setLoadError] =
    useState("");

  useEffect(() => {
    let active = true;

    getOrders()
      .then((result) => {
        if (!active) return;
        setOrders(result.data || []);
        setLoadError("");
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(
          error.response?.data?.message || "Gagal memuat pesanan. Silakan coba lagi."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">

      <h1 className="text-4xl font-black">
        Pesanan Saya
      </h1>

      <div className="mt-8 space-y-4">

        {loading && (
          <p>Memuat pesanan...</p>
        )}

        {!loading &&
          loadError && (
            <div role="alert" className="rounded-2xl bg-red-50 p-6 text-red-700">
              {loadError}
            </div>
          )}

        {!loading &&
          !loadError &&
          !orders.length && (
            <div className="rounded-2xl bg-white p-10 text-center">
              Belum ada pesanan.
            </div>
          )}

        {orders.map((order) => {

          const subtotal =
            order.order_items?.reduce(
              (total, item) =>
                total +
                Number(item.price || 0) *
                  Number(item.qty || 0),
              0
            ) || 0;

          const total =
            subtotal +
            Number(
              order.delivery_fee || 0
            );

          return (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
            >

              <div className="flex flex-wrap items-start justify-between gap-4">

                <div>

                  <p className="font-black">
                    Order #
                    {order.order_number}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(
                      order.createdAt
                    )}
                  </p>

                </div>

                <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600">
                  Status:{" "}
                  {
                    statusLabel[
                      order.status
                    ] ||
                    order.status
                  }
                </span>

              </div>

              <div className="mt-5 flex justify-between border-t pt-5">

                <span className="text-slate-500">
                  {order.order_items?.length || 0} item
                </span>

                <strong className="text-orange-500">
                  {formatRupiah(total)}
                </strong>

              </div>

            </Link>
          );
        })}

      </div>

    </div>
  );
};

export default Orders;