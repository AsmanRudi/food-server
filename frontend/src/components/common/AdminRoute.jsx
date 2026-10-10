import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";


const AdminRoute = () => {
    const user = useAuthStore(
        (state) => state.user
    );

    if (!user) {
        return (
            <Navigate to="/login"
            replace
            />
        );
    }

    if (user.role !== "admin") {
        return (
            <Navigate to="/"
            replace
            />
        );
    }

    return <Outlet />;
};

export default AdminRoute;