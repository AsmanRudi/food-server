import { Navigate, Route, Routes } from "react-router-dom";
import AdminRoute from "./components/common/AdminRoute";
import ProtectedRoute from "./components/common/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import AdminOrders from "./pages/admin/Orders";
import Transfers from "./pages/admin/Transfers";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import OrderDetail from "./pages/OrderDetail";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Profile from "./pages/Profile";
import Register from "./pages/Register";

const App = () => (
  <Routes>
    <Route element={<MainLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/chekout" element={<Navigate to="/checkout" replace />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Route>
    <Route element={<MainLayout />}>
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<Navigate to="/admin/orders" replace />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/transfers" element={<Transfers />} />
      </Route>
    </Route>
  </Routes>
);

export default App;