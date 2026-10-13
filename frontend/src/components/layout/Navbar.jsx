import { LogOut, Menu, Package, ShoppingCart, User, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { toast } from "sonner";
import { logout } from "../../services/auth.service";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";


const Navbar = () => {
    const navigate = useNavigate();
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const accountMenuRef = useRef(null);

    const user = useAuthStore((state) => state.user);
    const clearAuth = useAuthStore((state) => state.clearAuth);

    const cartCount = useCartStore(
        (state) => state.getCount()
    );

    useEffect(() => {
        if (!accountMenuOpen) return undefined;

        const handlePointerDown = (event) => {
            if (!accountMenuRef.current?.contains(event.target)) {
                setAccountMenuOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") setAccountMenuOpen(false);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [accountMenuOpen]);

    const handleLogout =async () => {
        setAccountMenuOpen(false);
        try {
            await logout();

            clearAuth();

            toast.success(
                "Berhasil logout"
            );

            navigate("/login");
        } catch {
            clearAuth();
            navigate("/login");
        }
    };

    return (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4">

                <Link
                    to="/"
                    className="text-2xl font-black text-orange-500"
                    >
                        Food<span className="text-slate-900">Apps</span>
                    </Link>

                    <nav className={mobileMenuOpen
                        ? "absolute left-0 right-0 top-full z-40 flex flex-col gap-1 border-b border-slate-200 bg-white px-4 py-3 shadow-lg md:static md:flex-row md:items-center md:gap-6 md:border-0 md:bg-transparent md:p-0 md:shadow-none"
                        : "hidden items-center gap-6 md:flex"}>
                        <Link
                        to="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className="font-medium text-slate-600 hover:text-orange-500">
                            Home
                        </Link>

                        <Link
                        to="/products"
                        onClick={() => setMobileMenuOpen(false)}
                        className="font-medium text-slate-600 hover:text-orange-500">
                            Menu
                        </Link>

                        {user && (
                            <Link
                            to="/orders"
                            onClick={() => setMobileMenuOpen(false)}
                            className="font-medium text-slate-600 hover:text-orange-500">
                                Pesanan
                            </Link>
                        )}

                        {user?.role === "admin" && (
                            <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="font-medium text-orange-500">
                                Admin
                            </Link>
                        )}

                        {user?.role === "admin" && (
                            <>
                                <Link 
                                    to="/admin/ManageProducts"
                                    className="flex items-center gap-2 transition hover:text-orange-500"
                                    >
                                        <Package size={17} />
                                        <span>Kelola Produk</span>
                            </Link>

                            <Link
                                to="/admin/ManageUsers"
                                className="flex items-center gap-2 transition hover:text-orange-500"
                            >
                                <Users size={17} />
                                    <span>Kelola User</span>
                            
                            </Link>
                            </>
                            
                        )}
                    </nav>

                    <div className="flex items-center gap-2">

                        <Link
                        to="/cart"
                        className="relative rounded-xl p-2 hover:bg-slate-100">
                            <ShoppingCart size={22} />

                            {cartCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div ref={accountMenuRef} className="relative">
                                <button
                                    type="button"
                                    aria-label="Menu akun"
                                    aria-haspopup="menu"
                                    aria-expanded={accountMenuOpen}
                                    aria-controls="account-menu"
                                    onClick={() => setAccountMenuOpen((open) => !open)}
                                    className="rounded-xl p-2 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-orange-500"
                                >
                                    <User size={22} />
                                </button>

                                <div
                                    id="account-menu"
                                    role="menu"
                                    className={`absolute right-0 top-full z-50 w-56 pt-2 transition ${accountMenuOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"}`}
                                >
                                  <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-xl">

                                    <div className="border-b border-slate-100 px-3 py-2">
                                        <p className="font-semibold">
                                            {user.full_name}
                                        </p>

                                        <p className="truncate text-xs text-slate-500">
                                            {user.email}
                                        </p>
                                    </div>

                                    <Link
                                        to="/profile"
                                        role="menuitem"
                                        onClick={() => setAccountMenuOpen(false)}
                                        className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50 focus-visible:bg-slate-50">
                                        Profile
                                    </Link>
                                    <button
                                        type="button"
                                        role="menuitem"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 focus-visible:bg-red-50"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                  </div>
                                </div>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white hover:bg-orange-600">
                                    Login
                                </Link>
                        )}
                        
                        <button
                            type="button"
                            aria-label={mobileMenuOpen ? "Tutup navigasi" : "Buka navigasi"}
                            aria-expanded={mobileMenuOpen}
                            onClick={() => setMobileMenuOpen((open) => !open)}
                            className="rounded-xl p-2 hover:bg-slate-100 md:hidden"
                        >
                            <Menu size={22} />
                        </button>
                        
                    </div>

            </div>
        </header>
    );
};

export default Navbar;