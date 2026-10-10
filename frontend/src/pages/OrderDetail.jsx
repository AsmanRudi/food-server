import { useEffect, useState } from "react";

import {
    Link,
    useParams,
} from "react-router-dom";

import {
    getOrders,
} from "../services/order.service";

import {
    getInvoice,
} from "../services/invoice.service";
import { getPaymentOptions } from "../services/payment.service";

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

const paymentMethodLabel = {
  cod: "Bayar di tempat",
  bank_transfer: "Transfer bank",
  midtrans: "Midtrans",
};

const OrderDetail = () => {
  const { id } = useParams();

  const [order, setOrder] =
    useState(null);

  const [invoice, setInvoice] =
    useState(null);

  const [paymentOptions, setPaymentOptions] = useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    load();
    getPaymentOptions().then(setPaymentOptions).catch(() => {});
  }, [id]);

  const load = async () => {
    try {
      const orders =
        await getOrders({
          limit: 100,
        });

      const found =
        orders.data?.find(
          (item) =>
            String(item._id) ===
            String(id)
        );

      setOrder(found || null);

      try {
        const invoiceData =
          await getInvoice(id);

        setInvoice(
          invoiceData
        );
      } catch {
        setInvoice(null);
      }

    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20">
        Memuat...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h1 className="text-2xl font-black">
          Pesanan tidak ditemukan
        </h1>

        <Link
          to="/orders"
          className="mt-5 inline-block text-orange-500"
        >
          Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div>

          <p className="text-sm text-slate-500">
            Pesanan #{order.order_number}
          </p>

          <h1 className="mt-1 text-3xl font-black">
            Detail Pesanan
          </h1>

        </div>

        <span className="rounded-full bg-orange-50 px-4 py-2 font-semibold text-orange-600">
          {statusLabel[
            order.status
          ] || order.status}
        </span>

      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-black">
              Produk
            </h2>

            <div className="mt-5 space-y-4">

              {order.order_items?.map(
                (item) => (
                  <div
                    key={item._id}
                    className="flex justify-between border-b pb-4 last:border-0"
                  >

                    <div>

                      <p className="font-semibold">
                        {item.name}
                      </p>

                      <p className="text-sm text-slate-500">
                        {item.qty} ×{" "}
                        {formatRupiah(
                          item.price
                        )}
                      </p>

                    </div>

                    <strong>
                      {formatRupiah(
                        Number(
                          item.price
                        ) *
                          Number(
                            item.qty
                          )
                      )}
                    </strong>

                  </div>
                )
              )}

            </div>

          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">

            <h2 className="text-xl font-black">
              Alamat Pengiriman
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              {order.delivery_address?.detail}
              <br />
              {order.delivery_address?.kelurahan},{" "}
              {order.delivery_address?.kecamatan}
              <br />
              {order.delivery_address?.kabupaten},{" "}
              {order.delivery_address?.provinsi}
            </p>

          </div>

        </div>

        <div className="h-fit rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-black">
            Invoice
          </h2>

          {invoice ? (
            <div className="mt-5 space-y-4">

              <div className="rounded-xl bg-orange-50 p-4">
                <p className="text-sm text-slate-500">Metode pembayaran</p>
                <p className="mt-1 font-bold">
                  {paymentMethodLabel[invoice.payment_method] || invoice.payment_method}
                </p>
                {invoice.payment_method === "cod" && invoice.payment_status !== "paid" && (
                  <p className="mt-2 text-sm text-slate-600">Bayar tunai kepada kurir saat pesanan diterima.</p>
                )}
                {invoice.payment_method === "bank_transfer" && invoice.payment_status !== "paid" && (
                  <div className="mt-2 text-sm text-slate-600">
                    <p>Transfer ke {paymentOptions?.bank_transfer?.bank || "rekening toko"} atas nama {paymentOptions?.bank_transfer?.account_name || "admin"}.</p>
                    {paymentOptions?.bank_transfer?.account_number && <p className="mt-1 font-bold text-slate-900">{paymentOptions.bank_transfer.account_number}</p>}
                    <p className="mt-1">Pesanan diproses setelah admin mengonfirmasi pembayaran.</p>
                  </div>
                )}
                {invoice.payment_method === "midtrans" && invoice.payment_url && invoice.payment_status !== "paid" && (
                  <a href={invoice.payment_url} className="mt-3 inline-flex rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700">Lanjutkan pembayaran</a>
                )}
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Subtotal
                </span>

                <span>
                  {formatRupiah(
                    invoice.sub_total
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Ongkir
                </span>

                <span>
                  {formatRupiah(
                    invoice.delivery_fee
                  )}
                </span>
              </div>

              <div className="border-t pt-4">

                <div className="flex justify-between font-black">

                  <span>Total</span>

                  <span className="text-orange-500">
                    {formatRupiah(
                      invoice.total
                    )}
                  </span>

                </div>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-sm text-slate-500">
                  Status Pembayaran
                </p>

                <p className="mt-1 font-bold">
                  {invoice.payment_status === "waiting_payment" ? "Menunggu pembayaran" :
                    invoice.payment_status === "cod_due" ? "Bayar ke kurir saat pesanan diterima" :
                      invoice.payment_status === "paid" ? "Lunas" : "Pembayaran gagal"}
                </p>

              </div>

              <p className="text-xs text-slate-400">
                {formatDate(
                  invoice.createdAt
                )}
              </p>

            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-500">
              Invoice belum tersedia.
            </p>
          )}

        </div>

      </div>

    </div>
  );
};

export default OrderDetail;