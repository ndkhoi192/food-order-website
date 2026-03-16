import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { TableProvider } from './context/TableContext';
import Layout from './components/Layout';
import TableSelect from './pages/TableSelect';
import TableJoin from './pages/TableJoin';
import Menu from './pages/Menu';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import StaffLogin from './pages/StaffLogin';
import StaffDashboard from './pages/StaffDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TableProvider>
          <CartProvider>
            <Routes>
              {/* Staff routes - no layout */}
              <Route path="/staff/login" element={<StaffLogin />} />
              <Route path="/staff/dashboard" element={<StaffDashboard />} />

              {/* QR scan landing — auto-joins table */}
              <Route path="/table/:token" element={<TableJoin />} />

              {/* Guest routes with layout */}
              <Route path="/" element={<Layout />}>
                <Route index element={<TableSelect />} />
                <Route path="menu" element={<Menu />} />
                <Route path="product/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="orders" element={<Orders />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </TableProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
