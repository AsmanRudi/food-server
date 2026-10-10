import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import ProductGrid from "../components/product/ProductGrid";
import { getCategories } from "../services/category.service";
import { getProducts } from "../services/product.service";

const LIMIT = 12;

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(1);
    const [count, setCount] = useState(0);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCategories()
            .then((result) => setCategories(Array.isArray(result) ? result : result.data || []))
            .catch(() => setCategories([]));
    }, []);

    useEffect(() => {
        let active = true;
        const timer = setTimeout(() => {
            setLoading(true);
            getProducts({ q: search, category, skip: (page - 1) * LIMIT, limit: LIMIT })
                .then((result) => {
                    if (!active) return;
                    setProducts(result.data || []);
                    setCount(Number(result.count || 0));
                })
                .catch((error) => {
                    if (active) setProducts([]);
                    console.error(error);
                })
                .finally(() => { if (active) setLoading(false); });
        }, 300);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [search, category, page]);

    const totalPages = Math.ceil(count / LIMIT);

    return (
        <section className="mx-auto max-w-7xl px-4 py-12">
            <div className="mb-10">
                <p className="font-semibold text-orange-600">EXPLORE</p>
                <h1 className="mt-1 text-4xl font-black text-slate-900">Semua Menu</h1>
                <p className="mt-2 text-slate-500">Temukan makanan favoritmu</p>
            </div>
            <div className="mb-8 grid gap-4 md:grid-cols-[1fr_240px]">
                <label className="relative block">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Cari makanan..." aria-label="Cari makanan" className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100" />
                </label>
                <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} aria-label="Filter kategori" className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-500">
                    <option value="">Semua Kategori</option>
                    {categories.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}
                </select>
            </div>
            <ProductGrid products={products} loading={loading} />
            {totalPages > 1 && <nav aria-label="Navigasi halaman menu" className="mt-12 flex items-center justify-center gap-3">
                <button type="button" aria-label="Halaman sebelumnya" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 bg-white p-3 text-slate-700 disabled:opacity-40"><ChevronLeft size={20} /></button>
                <span className="px-3 text-sm font-bold text-slate-700">{page} / {totalPages}</span>
                <button type="button" aria-label="Halaman berikutnya" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 bg-white p-3 text-slate-700 disabled:opacity-40"><ChevronRight size={20} /></button>
            </nav>}
        </section>
    );
};

export default Products;