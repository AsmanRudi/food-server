
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
    createProduct,
    deleteProduct,
    getProducts,
    updateProduct,
} from "../../services/product.service";
import { getImageUrl } from "../../utils/image";


const initialForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
};

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const result = await getProducts({ limit: 100 });
      setProducts(result.data || []);
    } catch (err) {
      setError(err.message || "Gagal mengambil produk.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm(initialForm);
    setImageFile(null);
    setImagePreview("");
    setImagePreviewFailed(false);
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function openEdit(product) {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
    });

    setImageFile(null);
    setImagePreview(product.image_url ? getImageUrl(product.image_url) : "");
    setImagePreviewFailed(false);

    setShowForm(true);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = new FormData();
      data.append("name", form.name.trim());
      data.append("description", form.description);
      data.append("price", String(Number(form.price)));
      data.append("stock", String(Number(form.stock)));
      if (imageFile) {
        data.append("image", imageFile);
      }

      if (editingId) {
        await updateProduct(editingId, data);
        setSuccess("Produk berhasil diperbarui.");
      } else { 
        await createProduct(data);
        setSuccess("Produk berhasil ditambahkan.");
      }

      setShowForm(false);
      setForm(initialForm);
      setEditingId(null);
      setImageFile(null);
      setImagePreview("");
      setImagePreviewFailed(false);

      await loadProducts();
    } catch (err) {
        setError (
            err.response?.data?.message ||
        err.message || "Gagal menyimpan produk."
        );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Hapus produk "${product.name}"?`)) return;

    setError("");
    setSuccess("");

    try {
      await deleteProduct(product._id);
      setProducts((current) =>
        current.filter((item) => item._id !== product._id)
      );
      setSuccess("Produk berhasil dihapus.");
    } catch (err) {
      setError(err.message || "Gagal menghapus produk.");
    }
  }

  const filteredProducts = products.filter((product) =>
    `${product.name || ""} ${product.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const money = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  return (
    <main className="mx-auto min-h-screen max-w-7xl bg-slate-50 px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-bold text-orange-500">ADMINISTRASI</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Kelola Produk
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Tambah, cari, edit, dan hapus produk FoodApps.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600"
        >
          <Plus size={18} /> Tambah Produk
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3">
            <Search size={18} className="text-slate-400" />
            <input
              className="w-full py-3 outline-none"
              placeholder="Cari nama produk..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <button
            onClick={loadProducts}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
          >
            Muat Ulang
          </button>
        </div>

        {loading ? (
          <p className="py-8 text-center text-slate-500">
            Memuat produk...
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Nama Produk</th>
                  <th className="p-4">Harga</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Gambar</th>
                  <th className="p-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="border-b border-slate-100">
                    <td className="p-4">
                      <strong>{product.name}</strong>
                      <p className="mt-1 text-xs text-slate-500">
                        {product.description}
                      </p>
                    </td>
                    <td className="p-4 font-semibold">
                      {money(product.price)}
                    </td>

                    <td className="p-4 font-semibold">
                        {product.stock ?? 0}
                    </td>

                    <td className="p-4">
                     {product.image_url ? (
                        <img
                            src={getImageUrl(product.image_url)}
                             alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                            onError={(event) => {
                                event.currentTarget.style.display = "none";
                             }}
                         />
                            ) : (
                            <span className="text-slate-400">Belum ada gambar</span>
                        )}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="rounded-lg border p-2 text-blue-600"
                          title="Edit produk"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="rounded-lg border p-2 text-red-600"
                          title="Hapus produk"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      Produk tidak ditemukan.
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
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-black">
                {editingId ? "Edit Produk" : "Tambah Produk"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Nama Produk
                <input
                  required
                  className="rounded-lg border p-3 font-normal"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Deskripsi
                <textarea
                  rows="3"
                  className="rounded-lg border p-3 font-normal"
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Harga (Rp)
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  className="rounded-lg border p-3 font-normal"
                  value={form.price}
                  onChange={(event) =>
                    setForm({ ...form, price: event.target.value })
                  }
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold">
                Stok
                <input required type="number"
                    min="0"
                    step="1"
                    className="rounded-lg border p-3 font-normal"
                    value={form.stock}
                    onChange={(event) =>
                        setForm({ ...form, stock: event.target.value })
                    }
                    />
              </label>

              <label className="grid gap-2 text-sm font-semibold">
  Gambar Produk
  <input
    type="file"
    accept="image/png,image/jpeg,image/webp"
    className="rounded-lg border p-3 font-normal"
    onChange={(event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar.");
        event.target.value = "";
        return;
      }

      if (file.size > 4 * 1024 * 1024) {
        setError("Ukuran gambar maksimal 4 MB.");
        event.target.value = "";
        return;
      }

      setError("");
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImagePreviewFailed(false);
    }}
  />

  {imagePreview && (
    <img
      src={imagePreview}
      alt="Preview produk"
      className="h-36 w-36 rounded-xl border object-cover"
      onError={() => setImagePreviewFailed(true)}
    />
  )}

  {imagePreviewFailed && (
    <p className="text-sm text-amber-700">
      Gambar lama tidak dapat dimuat. Pilih gambar baru untuk menggantinya.
    </p>
  )}

  {editingId && !imageFile && (
    <p className="text-xs text-slate-500">
      Gambar lama tetap digunakan jika tidak memilih gambar baru.
    </p>
  )}
</label>

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
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
