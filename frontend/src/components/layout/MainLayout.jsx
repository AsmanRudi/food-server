import { Outlet } from "react-router-dom";

import Navbar from "./Navbar";

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50">

            <Navbar />

            <main>
                <Outlet />
            </main>

            <footer className="mt-20 border-t border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-slate-500">
                    © 2026 FoodApp. By Rudi Asman Salim All reserved. Eduwork MERN
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;