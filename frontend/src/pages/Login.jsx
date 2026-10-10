import { useState } from "react";

import { Link, useNavigate, } from "react-router-dom";
import { toast } from "sonner";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

import { login, } from "../services/auth.service";
import { useAuthStore } from "../store/authStore";

const Login = () => {
    const navigate = useNavigate();

    const setAuth = 
        useAuthStore((state) => state.setAuth
    );

    const [form, setForm] = 
        useState({
            email: "",
            password: "",
        });

    const [loading, setLoading] =
        useState(false);

    const handleSubmit = async (e) => {
       e.preventDefault();
       
       try {
            setLoading(true);
             const result =
                await login(form);

            setAuth (
                result.user,
                result.token
            );

            toast.success(
                "Login Berhasil"
            );

            navigate("/"); 
       } catch (error) {
            toast.error (
                error.response?.data?.message ||
                "Email atau Password Salah"
            );
       } finally {
            setLoading(false);
       }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-slate-100 px-4">

            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

                <div className="mb-8 text-center">

                    <Link 
                        to="/"
                        className="text-3xl font-black text-orange-500"
                        >
                            Food<span className="text-slate-900">
                                App
                            </span>
                        </Link>

                        <h1 className="mt-6 text-2xl font-black">
                            Selamat Datang
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Login untuk melanjutkan, Terimakasih.
                        </p>

                </div>

                <form 
                onSubmit={handleSubmit}
                className="space-y-5">

                    <Input
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={(e) => 
                            setForm({
                                ...form,
                                email: e.target.value,
                            })
                        }
                        placeholder="nama@email.com"
                        required
                        />

                    <Input
                        label="Password"
                        type="password"
                        autoComplete="current-password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        />

                    <Button
                        type="submit"
                        loading={loading}
                        className="w-full"
                        >
                            Login
                        </Button>

                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Belum punya akun?{" "}
                    <Link
                        to="/register"
                        className="font-bold text-orange-500"
                        >
                            Daftar Sekarang
                    </Link>
                </p>

            </div>
        </div>
    );

};

export default Login;