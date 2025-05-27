import React, { useState, useEffect } from 'react';
import { getAllOrders, getAdminOrderDetails, updateOrderStatus, getConfirmedFoods } from '../services/api';
import { toast } from 'react-toastify';
import ReactPaginate from 'react-paginate';
import '../pagination.css';

const OrderAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [error, setError] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [confirmedFoods, setConfirmedFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const ordersPerPage = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await getAllOrders();
        // Lọc bỏ đơn hàng trạng thái 'scanned'
        const nonScannedOrders = response.filter(order => order.status !== 'scanned');
        setOrders(nonScannedOrders);
        setFilteredOrders(nonScannedOrders);
        setError(null);
        if (nonScannedOrders.length === 0) {
          toast.info('No orders found.', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Failed to load orders. Please try again later.';
        setError(errorMessage);
        setOrders([]);
        setFilteredOrders([]);
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    };

    const fetchConfirmedFoods = async () => {
      try {
        const response = await getConfirmedFoods();
        setConfirmedFoods(response);
      } catch (err) {
        console.error('Failed to load confirmed foods:', err);
        toast.error('Failed to load confirmed foods.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    };

    fetchOrders();
    fetchConfirmedFoods();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toString().includes(searchTerm) ||
          (order.ticket_code && order.ticket_code.includes(searchTerm))
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    setCurrentPage(0);
  }, [searchTerm, statusFilter, orders]);

  const handleViewDetails = async (orderId) => {
    try {
      const details = await getAdminOrderDetails(orderId);
      setOrderDetails(details);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to load order details.';
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const closeDetailsModal = () => {
    setOrderDetails(null);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      const updatedOrders = orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      );
      // Lọc lại để đảm bảo không bao gồm 'scanned'
      const nonScannedOrders = updatedOrders.filter(order => order.status !== 'scanned');
      setOrders(nonScannedOrders);
      setFilteredOrders(nonScannedOrders);
      const response = await getConfirmedFoods();
      setConfirmedFoods(response);
      toast.success(`Order ${orderId} status updated to ${newStatus}!`, {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to update status.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500';
      case 'confirmed':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'scanned':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const pageCount = Math.ceil(filteredOrders.length / ordersPerPage);
  const offset = currentPage * ordersPerPage;
  const currentOrders = filteredOrders.slice(offset, offset + ordersPerPage);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Orders</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded-lg shadow">
        {confirmedFoods.length > 0 ? (
          <ul className="list-disc pl-5">
            {confirmedFoods.map((food, index) => (
              <li key={index} className="text-gray-700">
                {food.total_quantity} {food.food_name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No confirmed foods yet.</p>
        )}
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by Order ID or Ticket Code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded w-full sm:w-1/2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded w-full sm:w-1/4"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {error ? (
        <p className="text-red-500">{error}</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-gray-500">No orders found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Order ID</th>
                  <th className="p-2 text-left">Ticket Code</th>
                  <th className="p-2 text-left">Total Price</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Created At</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="p-2">{order.id}</td>
                    <td className="p-2">{order.ticket_code || 'N/A'}</td>
                    <td className="p-2">{order.total_price} VND</td>
                    <td className={`p-2 font-semibold ${getStatusColor(order.status)}`}>{order.status}</td>
                    <td className="p-2">{new Date(order.created_at).toLocaleString()}</td>
                    <td className="p-2 flex gap-2">
                      <button
                        onClick={() => handleViewDetails(order.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition duration-200"
                      >
                        View Details
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="p-1 border rounded"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ReactPaginate
            previousLabel={'Previous'}
            nextLabel={'Next'}
            pageCount={pageCount}
            onPageChange={handlePageChange}
            containerClassName={'pagination'}
            activeClassName={'active'}
            disabledClassName={'disabled'}
          />
        </>
      )}

      {orderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">Order Details</h2>
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-gray-700">
                <span className="font-semibold">Order ID:</span> {orderDetails.order.id}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Ticket Code:</span>{' '}
                {orderDetails.order.ticket_code || 'N/A'}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Total Price:</span> {orderDetails.order.total_price} VND
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Status:</span>{' '}
                <span className={getStatusColor(orderDetails.order.status)}>
                  {orderDetails.order.status}
                </span>
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Customer:</span>{' '}
                {orderDetails.order.username} ({orderDetails.order.email})
              </p>
              <h3 className="text-lg font-semibold mt-4">Items:</h3>
              <ul className="list-disc pl-5">
                {orderDetails.items.map((item) => (
                  <li key={item.id} className="text-gray-700">
                    {item.food_name} - {item.quantity} x {item.unit_price} VND ={' '}
                    {item.quantity * item.unit_price} VND
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={closeDetailsModal}
              className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderAdmin;