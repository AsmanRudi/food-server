import { useEffect, useState } from "react";

import { ArrowRight, Search } from 'lucide-react';
import { Link } from "react-router-dom";
import ProductGrid from '../components/product/ProductGrid';
import { getProducts } from "../services/product.service";

const Home = () => {
    const [products, setProducts] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const result =
                    await getProducts({
                        limit: 8,
                    });

                setProducts(
                    result.data || []
                );
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    return (
        <div>
        <section className="bg-gradient-to-br from-orange-500 via-orange-500 to-amber-400 text-white">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-2 md:items-center">
                <div>
                    <span className="inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur">
                        Fresh • Fast • Delicius
                    </span>

                    <h1 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
                        Makanan favorit,
                        <br />
                        langsung ke pintu Anda.
                    </h1>

                    <p className="mt-6 max-w-xl text-lg text-orange-50">
                        Pesan makanan favoritmu dangen mudah,
                        cepat dan nyaman.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">

                        <Link
                            to="/products"
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-orange-500 transition hover:bg-orange-50"
                        >
                            Lihat Menu
                            <ArrowRight size={18} />
                        </Link>

                        <Link
                            to="/products"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3 font-bold text-white backdrop-blur hover:bg-white/20"
                        >
                            <Search size={18} />
                            Cari Makanan
                        </Link>
                    </div>
                </div>

                <div className="hidden md:block">

                    <div className="rounded-[2rem] bg-white/10 p-5 backdrop-blur">

                    <div className="rounded-[1.5rem] bg-white p-8 text-slate-900 shadow-2xl">

                        <p className="text-sm font-semibold text-orange-500">
                            TODAY'S SPECIAL
                        </p>

                        <h2 className="mt-3 text-3xl font-black">
                            Nikmati Makanan 
                            <br />
                            terbaik hari ini.
                        </h2>

                        <p className="mt-4 text-slate-500">
                            Pilih menu favoritmu dan
                            Nikmati pengalaman order
                            yang mudah.
                        </p>
                    </div>

                    </div>

                </div>
            </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">

            <div className="mb-8 flex items-end justify-between">

                <div>
                    <p className="font-semibold text-orange-500">
                        OUR MENU
                    </p>

                    <h2 className="mt-1 text-3xl font-black text-slate-900">
                        Menu Pilihan
                    </h2>
                </div>

                <Link
                    to="/products"
                    className="hidden items-center gap-2 font-semibold text-orange-500 sm:flex"
                >
                    Lihat semua
                    <ArrowRight size={18} />
                </Link>

            </div>

            <ProductGrid
                products={products}
                loading={loading}
                />

        </section>
        </div>
    );
};

export default Home;