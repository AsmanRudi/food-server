import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "../../store/cartStore";
import { formatRupiah } from "../../utils/format";
import { getImageUrl } from "../../utils/image";

const fallbackImages = {
    bread: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
    coffee: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
    burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
    cake: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
    croissant: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80",
    food: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
    soup: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
};

const ProductCard = ({ product }) => {
    const addItem = useCartStore((state) => state.addItem);
    const category = product.category?.name?.toLowerCase() || "";
    const productName = product.name?.toLowerCase() || "";
    const fallbackImage = fallbackImages[category]
        || fallbackImages[productName.includes("croissant") ? "croissant" : "food"];

    const handleAdd = () => {
        addItem(product);
        toast.success(`${product.name} ditambahkan ke keranjang`);
    };

    return (
        <article className="group overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                    src={getImageUrl(product.image_url)}
                    alt={product.name}
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackImage;
                    }}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                {product.category?.name && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">{product.category.name}</span>}
            </div>
            <div className="p-4">
                <h3 className="truncate text-lg font-bold text-slate-900">{product.name}</h3>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">{product.description || "Makanan lezat pilihan kami."}</p>
                <div className="mt-4 flex items-center justify-between">
                    <p className="font-bold text-orange-600">{formatRupiah(product.price)}</p>
                    <button type="button" aria-label={`Tambah ${product.name} ke keranjang`} onClick={handleAdd} className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-600 text-white transition hover:bg-orange-700"><Plus size={20} /></button>
                </div>
            </div>
        </article>
    );
};

export default ProductCard;