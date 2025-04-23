import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { placeOrder } from '../services/api';
import { CartContext } from '../context/CartContext'; // Import CartContext

const Cart = () => {
  const {
    cart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
    calculateTotal,
  } = useContext(CartContext); // Sử dụng CartContext
  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    try {
      const items = cart.map((item) => ({
        food_id: item.id,
        quantity: item.quantity,
      }));
      const response = await placeOrder(items);
      clearCart(); // Xóa giỏ hàng sau khi đặt hàng thành công
      alert('Order placed successfully! Order ID: ' + response.order_id);
      navigate('/orders');
    } catch (err) {
      alert('Failed to place order: ' + (err.response?.data?.error || 'Unknown error'));
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
    </div>
  );
};

export default Cart;