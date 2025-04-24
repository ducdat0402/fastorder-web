import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { placeOrder, createPayment, getTicket } from '../services/api';
import { CartContext } from '../context/CartContext';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-toastify';

const Cart = () => {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
    calculateTotal,
  } = useContext(CartContext);
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentResult, setPaymentResult] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmOrder = async () => {
    try {
      const items = cart.map((item) => ({
        food_id: item.id,
        quantity: item.quantity,
      }));
      const total = calculateTotal();
      const response = await placeOrder(items);
      setOrderId(response.order_id);
      setTotalAmount(total);
      setShowPaymentModal(true);
      setShowConfirmModal(false);
      clearCart();
      toast.success('Order placed successfully! Please proceed to payment.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      alert('Failed to place order: ' + (err.response?.data?.error || 'Unknown error'));
      setShowConfirmModal(false);
    }
  };

  const cancelOrderPlacement = () => {
    setShowConfirmModal(false);
  };

  const handlePayment = async (method) => {
    setLoading(true);
    try {
      const paymentResponse = await createPayment({
        order_id: orderId,
        method,
        amount: totalAmount,
      });
      setPaymentResult(paymentResponse);

      const ticketResponse = await getTicket(orderId);
      setTicket(ticketResponse);

      toast.success('Payment processed successfully! Please show the QR code at the canteen.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      alert('Failed to process payment: ' + (err.response?.data?.error || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    setPaymentResult(null);
    setTicket(null);
    setOrderId(null);
    setTotalAmount(0);
    navigate('/orders');
  };

  const downloadQRCode = () => {
    const canvas = document.querySelector('.qr-code canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket_${ticket.ticket_code}.png`;
      link.click();
    } else {
      alert('QR Code not found. Please try again.');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      {cart.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-left">Price</th>
                  <th className="p-2 text-left">Quantity</th>
                  <th className="p-2 text-left">Total</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">{item.price} VND</td>
                    <td className="p-2">
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        className="bg-gray-300 hover:bg-gray-400 text-black px-2 py-1 rounded-l"
                      >
                        -
                      </button>
                      <span className="px-2">{item.quantity}</span>
                      <button
                        onClick={() => increaseQuantity(item.id)}
                        className="bg-gray-300 hover:bg-gray-400 text-black px-2 py-1 rounded-r"
                      >
                        +
                      </button>
                    </td>
                    <td className="p-2">{item.price * item.quantity} VND</td>
                    <td className="p-2">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Total: {calculateTotal()} VND
            </h2>
            <button
              onClick={handlePlaceOrder}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Place Order
            </button>
          </div>
        </>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Confirm Order</h2>
            <p className="text-gray-700 mb-4">
              Are you sure you want to place this order? Total: {calculateTotal()} VND
            </p>
            <div className="flex gap-4">
              <button
                onClick={confirmOrder}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200"
              >
                Confirm
              </button>
              <button
                onClick={cancelOrderPlacement}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition duration-200"
              >
                Cancel
              </button>
            </div>
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
                        onClick={downloadQRCode}
                        className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition duration-200"
                      >
                        Download QR Code
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={closeModal}
                  className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition duration-200"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4">Select Payment Method</h2>
                <p className="text-gray-700">Total Amount: {totalAmount} VND</p>
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
                    {loading ? 'Processing...' : 'Pay Online'}
                  </button>
                </div>
                <button
                  onClick={closeModal}
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

export default Cart;