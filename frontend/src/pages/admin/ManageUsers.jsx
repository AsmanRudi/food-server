import { Pencil, Plus, RefreshCw, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createUser,
  getUsers,
  updateUserRole,
} from "../../services/user.service";

const initialForm = { full_name: "", email: "", password: "" };

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("user");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const result = await getUsers();
      setUsers(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Gagal memuat pengguna."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getUsers()
      .then((result) => {
        if (active) setUsers(Array.isArray(result.data) ? result.data : []);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Gagal memuat pengguna."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function handleReload() {
    loadUsers();
  }

  function openAddForm() {
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openRoleEditor(user) {
    setEditingUser(user);
    setSelectedRole(user.role);
    setError("");
    setSuccess("");
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await createUser({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setShowForm(false);
      setForm(initialForm);
      setSuccess("Pengguna berhasil ditambahkan.");
      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Gagal menambahkan pengguna."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleUpdate(event) {
    event.preventDefault();
    if (!editingUser || selectedRole === editingUser.role) {
      setEditingUser(null);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedUser = await updateUserRole(editingUser._id, selectedRole);
      setUsers((current) =>
        current.map((user) =>
          user._id === updatedUser._id ? { ...user, ...updatedUser } : user
        )
      );
      setSuccess(`Role ${updatedUser.full_name} berhasil diperbarui.`);
      setEditingUser(null);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Gagal memperbarui role."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredUsers = users.filter((user) =>
    [user.full_name, user.email, user.role]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="mx-auto min-h-screen max-w-7xl bg-slate-50 px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold text-orange-500">ADMINISTRASI</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Kelola User
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {users.length} pengguna terdaftar. Tambah pengguna dan atur role
            akun.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReload}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Muat Ulang
          </button>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600"
          >
            <Plus size={18} />
            Tambah User
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-slate-200 px-3">
          <Search size={18} className="text-slate-400" />
          <input
            className="w-full py-3 outline-none"
            placeholder="Cari nama, email, atau role..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading ? (
          <p className="py-8 text-center text-slate-500">Memuat pengguna...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Nama</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Terdaftar</th>
                  <th className="p-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-slate-100">
                    <td className="p-4 font-semibold">{user.full_name}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">
                      <span className="rounded-lg bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => openRoleEditor(user)}
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-blue-600 hover:bg-blue-50"
                        title={`Edit role ${user.full_name}`}
                      >
                        <Pencil size={16} />
                        Edit Role
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      {users.length
                        ? "Tidak ada pengguna yang cocok dengan pencarian."
                        : "Belum ada pengguna terdaftar."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/50 p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black">Tambah User</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Tutup form"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Nama Lengkap
                <input
                  required
                  minLength={3}
                  maxLength={255}
                  autoComplete="name"
                  className="rounded-lg border p-3 font-normal"
                  value={form.full_name}
                  onChange={(event) =>
                    setForm({ ...form, full_name: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Email
                <input
                  required
                  type="email"
                  maxLength={255}
                  autoComplete="email"
                  className="rounded-lg border p-3 font-normal"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Password
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  className="rounded-lg border p-3 font-normal"
                  value={form.password}
                  onChange={(event) =>
                    setForm({ ...form, password: event.target.value })
                  }
                />
              </label>
              <p className="text-xs text-slate-500">
                Akun baru dibuat dengan role user. Role dapat diubah setelah
                akun tersimpan.
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border px-4 py-3"
                disabled={saving}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-orange-500 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleRoleUpdate}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Edit Role</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingUser.full_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Tutup edit role"
              >
                <X size={20} />
              </button>
            </div>
            <label className="grid gap-2 text-sm font-semibold">
              Role
              <select
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
                className="rounded-lg border bg-white p-3 font-normal"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-xl border px-4 py-3"
                disabled={saving}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-orange-500 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Role"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
