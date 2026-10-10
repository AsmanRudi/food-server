import Spinner from "../common/Spinner";
import ProductCard from './ProductCard';



const ProductGrid = ({
    products,
    loading,
}) => {
    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!products.length) {
        return (
            <div className="py-20 text-center">
                <p className="text-lg font-semibold text-slate-700">
                    Product tidak ditemukan
                </p>

                <p className="mt-2 text-sm text-slate-500">
                    Coba gunakan pencarian lain
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
                <ProductCard
                key={product._id}
                product={product} />
            ))}
        </div>
    );
};

export default ProductGrid;