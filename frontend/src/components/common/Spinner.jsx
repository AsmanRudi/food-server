const Spinner = ({ size = "md" }) => {
    const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
    };

    return (
        <div className={`
            ${sizes[size]}
            animate-Spin
            rounded-full
            border-4
            border-slate-200
            border-t-orange-500
            `}
            />
    );
};

export default Spinner;