import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminScannedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Hàm retry với delay
  const fetchWithRetry = async (url, options, retries = 3, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url, options);
        return response;
      } catch (err) {
        if (err.response?.status === 429 && i < retries - 1) {
          console.warn(`Retry ${i + 1}/${retries} after ${delay}ms due to 429 error`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
  };

  const fetchScannedOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Kiểm tra quyền admin
      if (!token || user.role !== 'admin') {
        setError('Please log in as admin to view scanned orders.');
        toast.error('Please log in as admin to view scanned orders.', {
          position: 'top-right',
          autoClose: 3000,
        });
        navigate('/login');
        return;
      }

      const apiUrl = `${process.env.REACT_APP_API_URL}/api/admin/scanned-orders`;
      console.log('Fetching scanned orders from:', apiUrl); // Debug URL
      const response = await fetchWithRetry(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Scanned orders response:', response.data); // Debug dữ liệu
      setOrders(response.data);
      setError(null);
      if (response.data.length === 0) {
        toast.info('No scanned orders found.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error('Error fetching scanned orders:', err);
      let errorMessage = err.response?.data?.error || 'Failed to load scanned orders. Please try again later.';
      if (err.response?.status === 404) {
        errorMessage = 'Scanned orders endpoint not found. Please ensure the backend is running and the endpoint /api/admin/scanned-orders is configured.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        errorMessage = 'Session expired. Please log in again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Unauthorized access. Please log in with an admin account.';
      }
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchScannedOrders();
  }, [fetchScannedOrders]);

  const getStatusColor = (status) => {
    return status === 'scanned' ? 'text-red-500' : 'text-gray-500';
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Scanned Orders</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No scanned orders to display.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Order ID</th>
                <th className="p-2 text-left">Customer Email</th>
                <th className="p-2 text-left">Total Amount</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Created At</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="p-2">{order.id}</td>
                  <td className="p-2">{order.email || 'N/A'}</td>
                  <td className="p-2">{order.total_amount ? `${order.total_amount} VND` : 'N/A'}</td>
                  <td className={`p-2 font-semibold ${getStatusColor(order.status)}`}>{order.status}</td>
                  <td className="p-2">
                    {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminScannedOrders;