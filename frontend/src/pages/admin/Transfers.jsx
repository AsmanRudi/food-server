import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { confirmTransfer, getPendingTransfers } from "../../services/payment.service";
import { formatDate, formatRupiah } from "../../utils/format";

const Transfers = () => {
    const pageSize = 10;
    const [invoices, setInvoices] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState("");

    useEffect(() => {
        let active = true;
        getPendingTransfers({ page, limit: pageSize })
            .then((result) => {
                if (!active) return;
                setInvoices(result.data || []);
                setTotal(Number(result.count || 0));
            })
            .catch((error) => {
                if (active) toast.error(error.response?.data?.message || "Daftar transfer gagal dimuat");
            })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [page, pageSize, refreshKey]);

    const handleConfirm = async (orderId) => {
        try {
            setConfirming(orderId);
            await confirmTransfer(orderId);
            setInvoices((current) => current.filter((invoice) => invoice.order?._id !== orderId));
            setTotal((current) => Math.max(0, current - 1));
            if (invoices.length === 1 && page > 1) setPage((current) => current - 1);
            else setRefreshKey((current) => current + 1);
            toast.success("Transfer dikonfirmasi dan pesanan diproses");
        } catch (error) {
            toast.error(error.response?.data?.message || "Konfirmasi transfer gagal");
        } finally {
            setConfirming("");
        }
    };

    return (
        <section className="mx-auto max-w-6xl px-4 py-12">
            <p className="text-sm font-bold uppercase text-orange-600">Administrasi</p>
            <h1 className="mt-2 text-3xl font-black">Konfirmasi Transfer</h1>
            {loading ? <p className="py-12 text-center text-slate-500">Memuat transfer...</p> : !invoices.length ? (
                <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">Tidak ada transfer yang menunggu konfirmasi.</p>
            ) : (
                <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
                    {invoices.map((invoice) => (
                        <article key={invoice._id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-bold">Pesanan #{invoice.order?.order_number || invoice.order?._id}</h2>
                                <p className="mt-1 text-sm text-slate-500">{invoice.user?.full_name} · {invoice.user?.email}</p>
                                <p className="mt-1 text-sm text-slate-500">{formatDate(invoice.createdAt)} · {formatRupiah(invoice.total)}</p>
                            </div>
                            <button type="button" disabled={confirming === invoice.order?._id} onClick={() => handleConfirm(invoice.order?._id)} className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50">
                                {confirming === invoice.order?._id ? "Memproses..." : "Konfirmasi dibayar"}
                            </button>
                        </article>
                    ))}
                </div>
            )}
            {!loading && total > 0 && (
                <nav aria-label="Halaman konfirmasi transfer" className="mt-8 flex flex-wrap items-center justify-center gap-2">
                    <button
                        type="button"
                        aria-label="Halaman sebelumnya"
                        disabled={page === 1}
                        onClick={() => setPage((current) => current - 1)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    {Array.from({ length: Math.ceil(total / pageSize) }, (_, index) => index + 1).map((pageNumber) => (
                        <button
                            key={pageNumber}
                            type="button"
                            aria-current={page === pageNumber ? "page" : undefined}
                            onClick={() => setPage(pageNumber)}
                            className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold ${page === pageNumber ? "border-orange-600 bg-orange-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"}`}
                        >
                            {pageNumber}
                        </button>
                    ))}
                    <button
                        type="button"
                        aria-label="Halaman berikutnya"
                        disabled={page >= Math.ceil(total / pageSize)}
                        onClick={() => setPage((current) => current + 1)}
                        className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ChevronRight size={18} />
                    </button>
                </nav>
            )}
        </section>
    );
};

export default Transfers;