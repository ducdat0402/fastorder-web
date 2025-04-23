import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllOrders } from '../services/api';

const OrderAdmin = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const data = await getAllOrders();
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch all orders:', err);
        alert('Failed to fetch all orders: ' + (err.response?.data?.error || 'Unknown error'));
      }
    };
    fetchAllOrders();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Order Admin</h1>
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders available.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="p-4 bg-white rounded shadow">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">
                  Order #{order.id} - {order.status}
                </h2>
                <Link
                  to={`/ticket/${order.id}`}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                >
                  View Ticket
                </Link>
              </div>
              <p className="text-gray-600">Customer: {order.customer_name}</p>
              <p className="text-gray-600">Total: {order.total_price} VND</p>
              <p className="text-gray-600">
                Placed on: {new Date(order.created_at).toLocaleString()}
              </p>
              <div className="mt-2">
                <h3 className="font-medium">Items:</h3>
                <ul className="list-disc pl-5">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.name} - {item.quantity} x {item.unit_price} VND
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderAdmin;