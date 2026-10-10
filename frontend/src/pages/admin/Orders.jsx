import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getAdminOrders, markAdminOrderPaid, updateAdminOrderStatus } from "../../services/order.service";
import { formatDate, formatRupiah } from "../../utils/format";

const orderStatuses = [
    { value: "processing", label: "Diproses" },
    { value: "in_delivery", label: "Sedang dikirim kurir" },
    { value: "delivered", label: "Selesai" },
];

const statusLabels = {
    waiting_payment: "Menunggu pembayaran",
    processing: "Diproses",
    in_delivery: "Sedang dikirim kurir",
    delivered: "Selesai",
};

const paymentMethodLabels = {
    cod: "Bayar di tempat",
    bank_transfer: "Transfer bank",
    midtrans: "Midtrans",
};

const paymentStatusLabels = {
    waiting_payment: "Belum dibayar",
    cod_due: "Bayar ke kurir",
    paid: "Sudah dibayar",
    failed: "Pembayaran gagal",
};

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState("");

    useEffect(() => {
        let active = true;
        getAdminOrders()
            .then((result) => { if (active) setOrders(result.data || []); })
            .catch((error) => { if (active) toast.error(error.response?.data?.message || "Pesanan gagal dimuat"); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const handleStatusChange = async (order, status) => {
        try {
            setUpdating(order._id);
            const updated = await updateAdminOrderStatus(order._id, status);
            setOrders((current) => current.map((item) => item._id === order._id ? { ...item, status: updated.status } : item));
            toast.success("Status pengiriman diperbarui");
        } catch (error) {
            toast.error(error.response?.data?.message || "Status gagal diperbarui");
        } finally {
            setUpdating("");
        }
    };

    const handleMarkPaid = async (order) => {
        try {
            setUpdating(order._id);
            await markAdminOrderPaid(order._id);
            setOrders((current) => current.map((item) => item._id === order._id ? {
                ...item,
                status: item.status === "waiting_payment" ? "processing" : item.status,
                invoice: { ...item.invoice, payment_status: "paid" },
            } : item));
            toast.success("Pembayaran ditandai sudah dibayar");
        } catch (error) {
            toast.error(error.response?.data?.message || "Pembayaran gagal diperbarui");
        } finally {
            setUpdating("");
        }
    };

    return (
        <section className="mx-auto max-w-7xl px-4 py-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-bold uppercase text-orange-600">Administrasi</p>
                    <h1 className="mt-2 text-3xl font-black text-slate-900">Kelola Pesanan</h1>
                </div>
                <Link to="/admin/transfers" className="text-sm font-bold text-orange-600 hover:text-orange-700">Konfirmasi transfer</Link>
            </div>

            {loading ? <p className="py-16 text-center text-slate-500">Memuat pesanan...</p> : !orders.length ? (
                <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">Belum ada pesanan.</p>
            ) : (
                <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
                    {orders.map((order) => {
                        const invoice = order.invoice;
                        const itemCount = (order.order_items || []).reduce((total, item) => total + Number(item.qty || 0), 0);
                        const canManuallyMarkPaid = invoice && invoice.payment_status !== "paid" && order.payment_method !== "midtrans";

                        return (
                            <article key={order._id} className="grid gap-5 py-6 lg:grid-cols-[1fr_220px_230px] lg:items-center">
                                <div>
                                    <h2 className="font-bold text-slate-900">Pesanan #{order.order_number || order._id.slice(-6)}</h2>
                                    <p className="mt-1 text-sm text-slate-600">{order.user?.full_name || "Pelanggan"} · {order.user?.email}</p>
                                    <p className="mt-1 text-sm text-slate-500">{formatDate(order.createdAt)} · {itemCount} item · {formatRupiah(invoice?.total)}</p>
                                    <p className="mt-2 text-sm text-slate-500">{paymentMethodLabels[order.payment_method] || order.payment_method}: {paymentStatusLabels[invoice?.payment_status] || "Status invoice tidak tersedia"}</p>
                                </div>

                                <label className="text-sm font-medium text-slate-600">
                                    Status pesanan
                                    <select
                                        value={order.status === "waiting_payment" ? "waiting_payment" : order.status}
                                        disabled={updating === order._id || order.status === "waiting_payment"}
                                        onChange={(event) => handleStatusChange(order, event.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                                    >
                                        {order.status === "waiting_payment" && <option value="waiting_payment">Menunggu pembayaran</option>}
                                        {!orderStatuses.some((status) => status.value === order.status) && order.status !== "waiting_payment" && <option value={order.status}>{statusLabels[order.status] || order.status}</option>}
                                        {orderStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                                    </select>
                                </label>

                                <div>
                                    {canManuallyMarkPaid ? (
                                        <button type="button" disabled={updating === order._id} onClick={() => handleMarkPaid(order)} className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
                                            {updating === order._id ? "Memproses..." : "Tandai sudah dibayar"}
                                        </button>
                                    ) : order.payment_method === "midtrans" ? (
                                        <span className="text-sm text-slate-500">Pembayaran Midtrans diperbarui otomatis</span>
                                    ) : (
                                        <span className="text-sm font-semibold text-emerald-700">Sudah dibayar</span>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default AdminOrders;