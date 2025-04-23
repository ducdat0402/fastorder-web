import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import OrderAdmin from './pages/OrderAdmin';
import Ticket from './pages/Ticket';
import Admin from './pages/Admin';
import { CartProvider } from './context/CartContext'; // Import CartProvider

// Component để xử lý chuyển hướng sau khi đăng nhập
const RedirectAfterLogin = ({ user, setUser }) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      // Nếu là admin, chuyển hướng đến /admin, nếu không thì đến /
      navigate(user.role === 'admin' ? '/admin' : '/');
    }
  }, [user, navigate]);

  return null;
};

const App = () => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

  useEffect(() => {
    // Kiểm tra token hợp lệ khi tải ứng dụng
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get(`${process.env.REACT_APP_API_URL}/foods`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch((err) => {
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser({});
            window.location.href = '/login';
          }
        });
    }
  }, []);

  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Header setUser={setUser} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={user?.id ? <RedirectAfterLogin user={user} setUser={setUser} /> : <Login setUser={setUser} />} />
            <Route path="/register" element={user?.id ? <RedirectAfterLogin user={user} setUser={setUser} /> : <Register setUser={setUser} />} />
            <Route path="/cart" element={user?.id ? <Cart /> : <Login setUser={setUser} />} />
            <Route path="/orders" element={user?.id ? <Orders /> : <Login setUser={setUser} />} />
            <Route path="/order-admin" element={user?.role === 'admin' ? <OrderAdmin /> : <Login setUser={setUser} />} />
            <Route path="/ticket/:orderId" element={user?.id ? <Ticket /> : <Login setUser={setUser} />} />
            <Route path="/admin" element={user?.role === 'admin' ? <Admin /> : <Login setUser={setUser} />} />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
};

export default App;