import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getOrders, getTicket, getPaymentByOrder, createPayment, cancelOrder } from '../services/api';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-toastify';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrdersAndPayments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view your orders.');
          navigate('/login');
          return;
        }

        const ordersResponse = await getOrders();
        setOrders(ordersResponse);
        setError(null);

        const paymentInfos = {};
        for (const order of ordersResponse) {
          try {
            const payment = await getPaymentByOrder(order.id);
            paymentInfos[order.id] = { status: payment.status, method: payment.method };
          } catch (err) {
            paymentInfos[order.id] = null;
          }
        }
        setPaymentInfo(paymentInfos);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.error || 'Failed to load orders. Please try again later.');
        setOrders([]);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    fetchOrdersAndPayments();

    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Payment successful! Your order is completed.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } else if (paymentStatus === 'failed') {
      toast.error('Payment failed. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } else if (paymentStatus === 'cancelled') {
      toast.warn('Payment was cancelled. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  }, [location, navigate]);

  const handleViewTicket = async (orderId) => {
    try {
      const ticket = await getTicket(orderId);
      setSelectedTicket({ ...ticket, orderId });
    } catch (err) {
      setError('Failed to load ticket: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  const handlePayOrder = (order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await cancelOrder(orderId);
        setOrders(orders.filter((order) => order.id !== orderId));
        setPaymentInfo((prev) => {
          const updated = { ...prev };
          delete updated[orderId];
          return updated;
        });
        toast.success('Order cancelled successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });
      } catch (err) {
        toast.error('Failed to cancel order: ' + (err.response?.data?.error || 'Unknown error'), {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    }
  };

  const handlePayment = async (method) => {
    setLoading(true);
    try {
      const paymentResponse = await createPayment({
        order_id: selectedOrder.id,
        method,
        amount: selectedOrder.total_price,
      });

      if (method === 'online' && paymentResponse.payment_url) {
        window.location.href = paymentResponse.payment_url;
        return;
      }

      setPaymentResult(paymentResponse);

      // Lấy ticket và kiểm tra
      const ticketResponse = await getTicket(selectedOrder.id);
      if (!ticketResponse || !ticketResponse.ticket_code) {
        throw new Error('Failed to retrieve a valid ticket code.');
      }
      setTicket(ticketResponse);
      console.log('Ticket retrieved:', ticketResponse); // Debug

      setPaymentInfo((prev) => ({
        ...prev,
        [selectedOrder.id]: { status: paymentResponse.status, method: paymentResponse.method },
      }));

      // Cập nhật trạng thái đơn hàng
      const updatedOrders = orders.map((o) =>
        o.id === selectedOrder.id
          ? { ...o, status: method === 'online' ? 'completed' : 'confirmed' }
          : o
      );
      setOrders(updatedOrders);

      toast.success('Payment processed successfully! Please show the QR code at the canteen.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Payment error:', err); // Debug
      toast.error('Failed to process payment: ' + (err.response?.data?.error || err.message || 'Unknown error'), {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const closeTicketModal = () => {
    setSelectedTicket(null);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentResult(null);
    setTicket(null);
    setSelectedOrder(null);
  };

  const downloadQRCode = (ticketCode) => {
    const canvas = document.querySelector('.qr-code canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket_${ticketCode}.png`;
      link.click();
    } else {
      toast.error('QR Code not found. Please try again.', {
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
      case 'cancelled':
        return 'text-red-500';
      case 'scanned':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Orders</h1>
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">You have no orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Order ID</th>
                <th className="p-2 text-left">Total Price</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Created At</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="p-2">{order.id}</td>
                  <td className="p-2">{order.total_price} VND</td>
                  <td className={`p-2 font-semibold ${getStatusColor(order.status)}`}>{order.status}</td>
                  <td className="p-2">{new Date(order.created_at).toLocaleString()}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => handleViewTicket(order.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition duration-200"
                    >
                      View Ticket
                    </button>
                    {(order.status === 'pending' || order.status === 'cancelled' || (order.status === 'confirmed' && paymentInfo[order.id]?.method === 'cash')) && (
                      <button
                        onClick={() => handlePayOrder(order)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition duration-200"
                      >
                        Payment
                      </button>
                    )}
                    {(order.status === 'pending' || order.status === 'cancelled') && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition duration-200"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">Your Ticket</h2>
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-gray-700">
                <span className="font-semibold">Order ID:</span> {selectedTicket.orderId}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Ticket Code:</span> {selectedTicket.ticket_code}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Issued At:</span>{' '}
                {new Date(selectedTicket.issued_at).toLocaleString()}
              </p>
              <div className="mt-4 flex justify-center">
                <div className="qr-code">
                  <QRCodeCanvas
                    value={selectedTicket.ticket_code}
                    size={200}
                    className="border p-2 bg-white rounded-lg"
                  />
                </div>
              </div>
              <p className="text-gray-500 text-center mt-2">
                Show this QR code at the canteen to receive your order.
              </p>
              <button
                onClick={() => downloadQRCode(selectedTicket.ticket_code)}
                className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200"
              >
                Download QR Code
              </button>
            </div>
            <button
              onClick={closeTicketModal}
              className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            {paymentResult ? (
              <>
                <h2 className="text-2xl font-bold mb-4 text-green-600">Payment Successful</h2>
                <div className="border-t border-b py-2 mb-4">
                  <p className="text-gray-700">
                    <span className="font-semibold">Payment ID:</span> {paymentResult.payment_id}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Order ID:</span> {paymentResult.order_id}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Amount:</span> {paymentResult.amount} VND
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Method:</span> {paymentResult.method}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Status:</span> {paymentResult.status}
                  </p>
                  {paymentResult.transaction_id && (
                    <p className="text-gray-700">
                      <span className="font-semibold">Transaction ID:</span> {paymentResult.transaction_id}
                    </p>
                  )}
                </div>
                {ticket && (
                  <div className="mt-4">
                    <h3 className="text-xl font-semibold text-blue-600">Your Ticket</h3>
                    <div className="border rounded-lg p-4 bg-gray-50 mt-2">
                      <p className="text-gray-700">
                        <span className="font-semibold">Ticket Code:</span> {ticket.ticket_code}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">Issued At:</span>{' '}
                        {new Date(ticket.issued_at).toLocaleString()}
                      </p>
                      <div className="mt-4 flex justify-center">
                        <div className="qr-code">
                          <QRCodeCanvas
                            value={ticket.ticket_code}
                            size={200}
                            className="border p-2 bg-white rounded-lg"
                          />
                        </div>
                      </div>
                      <p className="text-gray-500 text-center mt-2">
                        Show this QR code at the canteen to receive your order.
                      </p>
                      <button
                        onClick={() => downloadQRCode(ticket.ticket_code)}
                        className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200"
                      >
                        Download QR Code
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={closePaymentModal}
                  className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4">Select Payment Method</h2>
                <p className="text-gray-700">Total Amount: {selectedOrder.total_price} VND</p>
                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => handlePayment('cash')}
                    disabled={loading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 transition duration-200"
                  >
                    {loading ? 'Processing...' : 'Pay with Cash'}
                  </button>
                  <button
                    onClick={() => handlePayment('online')}
                    disabled={loading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400 transition duration-200"
                  >
                    {loading ? 'Processing...' : 'Pay Online (VNPay)'}
                  </button>
                </div>
                <button
                  onClick={closePaymentModal}
                  className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition duration-200"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;