const Input = ({
    label,
    error,
    className = "",
    ...props    
}) => {
    return (
        <div className= "space-y-2">
            {label && (
                <label className="block text-sm font semibold text-slate-700">
                    {label}
                </label>
            )}

            <input
            {...props}
            className={`
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                outline-none
                transition
                focus:border-orange-500
                focus:ring-4
                focus:ring-orange-100
                ${className}
                `}
                />

                {error && (
                    <p className="text-sm text-red-500">
                        {error}
                    </p>
                )}
        </div>
    );
};

export default Input;