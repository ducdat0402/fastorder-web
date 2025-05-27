import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScannedOrders } from '../services/api';
import { toast } from 'react-toastify';

const ScannedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScannedOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view your scanned orders.');
          toast.error('Please log in to view your scanned orders.', {
            position: 'top-right',
            autoClose: 3000,
          });
          navigate('/login');
          return;
        }

        const ordersResponse = await getScannedOrders();
        setOrders(ordersResponse);
        setError(null);
        if (ordersResponse.length === 0) {
          toast.info('You have no scanned orders yet.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      } catch (err) {
        console.error('Error fetching scanned orders:', err);
        const errorMessage = err.response?.data?.error || 'Failed to load scanned orders. Please try again later.';
        setError(errorMessage);
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
        });
        setOrders([]);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    fetchScannedOrders();
  }, [navigate]);

  const getStatusColor = (status) => {
    return status === 'scanned' ? 'text-red-500' : 'text-gray-500';
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Scanned Orders</h1>
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">You have no scanned orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Order ID</th>
                <th className="p-2 text-left">Total Price</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Created At</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="p-2">{order.id}</td>
                  <td className="p-2">{order.total_price} VND</td>
                  <td className={`p-2 font-semibold ${getStatusColor(order.status)}`}>{order.status}</td>
                  <td className="p-2">{new Date(order.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScannedOrders;