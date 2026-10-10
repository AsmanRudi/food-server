import { useState } from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import { toast } from "sonner";

import Button from "../components/common/Button";
import Input from "../components/common/Input";

import {
    register,
} from "../services/auth.service";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] =
    useState({
      full_name: "",
      email: "",
      password: "",
    });

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await register(form);

      toast.success(
        "Registrasi berhasil. Silakan login."
      );

      navigate("/login");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Registrasi gagal"
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
            Buat akun
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Daftar untuk mulai memesan.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <Input
            label="Nama Lengkap"
            value={form.full_name}
            onChange={(e) =>
              setForm({
                ...form,
                full_name:
                  e.target.value,
              })
            }
            required
          />

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
            required
          />

          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password:
                  e.target.value,
              })
            }
            required
          />

          <Button
            type="submit"
            loading={loading}
            className="w-full"
          >
            Daftar
          </Button>

        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link
            to="/login"
            className="font-bold text-orange-500"
          >
            Login
          </Link>
        </p>

      </div>

    </div>
  );
};

export default Register;