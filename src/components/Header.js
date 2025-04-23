import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext'; // Import CartContext

const Header = ({ setUser }) => {
  const navigate = useNavigate();
  const { getCartCount } = useContext(CartContext); // Sử dụng CartContext để lấy số lượng giỏ hàng
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    setUser({});
    setIsMenuOpen(false);
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-gray-800 text-white p-4 sticky top-0 z-50">
      <div className="flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold">
          FastOrder
        </Link>

        {/* Hamburger Icon for Small Screens */}
        <div className="sm:hidden">
          <button onClick={toggleMenu} className="focus:outline-none">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'}
              />
            </svg>
          </button>
        </div>

        {/* Menu for Larger Screens */}
        <div className="hidden sm:flex items-center space-x-4">
          {user?.id ? (
            <>
              <span className="mr-4">Hello, {user.name}</span>
              {user.role !== 'admin' && (
                <Link
                  to="/cart"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Cart ({getCartCount()})
                </Link>
              )}
              <Link
                to={user.role === 'admin' ? '/order-admin' : '/orders'}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
              >
                {user.role === 'admin' ? 'Order Admin' : 'Orders'}
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Dropdown Menu for Small Screens */}
      {isMenuOpen && (
        <div className="sm:hidden mt-2 bg-gray-700 rounded-md shadow-lg">
          {user?.id ? (
            <div className="flex flex-col">
              <span className="px-4 py-2 text-gray-300">Hello, {user.name}</span>
              {user.role !== 'admin' && (
                <Link
                  to="/cart"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-2 hover:bg-gray-600 rounded-t-md"
                >
                  Cart ({getCartCount()})
                </Link>
              )}
              <Link
                to={user.role === 'admin' ? '/order-admin' : '/orders'}
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 hover:bg-gray-600"
              >
                {user.role === 'admin' ? 'Order Admin' : 'Orders'}
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-2 hover:bg-gray-600"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-left px-4 py-2 hover:bg-gray-600 rounded-b-md"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-2 hover:bg-gray-600 rounded-md"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;