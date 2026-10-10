
const Button = ({
    children,
    type = "button",
    loading = false,
    variant = "primary",
    disabled = false,
    onClick,
    className = "",
}) => {
    const variants = {
        primary:
            "bg-orange-500 text-white hover:bg-orange-600",

        secondary:
            "bg-slate-100 text-slate-800 hover:bg-slate-200",

        danger:
            "bg-red-500 text-white hover:bg-red-600",

        outline:
            "border border-slate-300 text-slate-700 hover:bg-slate-50",
    };

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`
                rounded-xl
                px-4 py-2.5
                font-semibold
                transition
                disabled:cursor-not-allowed
                disabled:opacity-50
                ${variants[variant]}
                ${className}
                `}
                >
                    {loading ? "Memproses..." : children}
                </button>
    );
};

export default Button;