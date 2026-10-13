
import { RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("access_token");

      const response = await fetch(`${API_URL}/api/users`, {
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      setUsers(
        Array.isArray(result)
          ? result
          : result.data || result.users || []
      );
    } catch (err) {
      setError(err.message || "Gagal memuat pengguna.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    [
      user.full_name,
      user.fullname,
      user.name,
      user.username,
      user.email,
      user.role,
    ]
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
            Lihat dan cari data pengguna FoodApps.
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold"
        >
          <RefreshCw size={16} />
          Muat Ulang
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <p className="mt-1">
            Periksa endpoint pengguna dan izin admin pada backend.
          </p>
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
          <p className="py-8 text-center text-slate-500">
            Memuat pengguna...
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Nama</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id || user.id}
                    className="border-b border-slate-100"
                  >
                    <td className="p-4 font-semibold">
                      {user.full_name ||
                        user.fullname ||
                        user.name ||
                        user.username ||
                        "-"}
                    </td>
                    <td className="p-4">{user.email || "-"}</td>
                    <td className="p-4">
                      <span className="rounded-lg bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
                        {user.role || "user"}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-slate-500">
                      Tidak ada pengguna ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
