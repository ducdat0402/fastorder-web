import React, { useState, useEffect, useContext } from 'react';
import { getCategories, getFoods } from '../services/api';
import { CartContext } from '../context/CartContext';
import { toast } from 'react-toastify';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, foodRes] = await Promise.all([
          getCategories(),
          getFoods(selectedCategory),
        ]);
        setCategories(catRes);
        setFoods(foodRes);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, [selectedCategory]);

  const handleAddToCart = (food) => {
    addToCart(food);
    toast.success(`${food.name} has been added to your cart!`, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {foods.map((food) => (
          <div
            key={food.id}
            className={`relative p-4 bg-white rounded shadow transition-all duration-200 ${
              !food.is_available ? 'opacity-60 grayscale' : ''
            }`}
          >
            <div className="relative">
              <img
                src={food.img_url}
                alt={food.name}
                className="w-full h-40 object-cover mb-2 rounded"
              />
              {!food.is_available && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                  <span className="text-white text-lg font-bold">Đã bán hết</span>
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold">{food.name}</h3>
            <p className="text-gray-600">{food.description}</p>
            <p className="text-green-500 font-bold">{food.price} VND</p>
            <button
              onClick={() => handleAddToCart(food)}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              disabled={!food.is_available}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;