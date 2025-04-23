import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm token vào header cho các request cần xác thực
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý lỗi toàn cục
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = (email, password) =>
  api.post('/login', { email, password }).then((res) => res.data);

export const register = (name, email, password, phone) =>
  api.post('/register', { name, email, password, phone }).then((res) => res.data);

export const getCategories = () =>
  api.get('/categories').then((res) => res.data);

export const getFoods = (categoryId) =>
  api.get(`/foods${categoryId ? `?category_id=${categoryId}` : ''}`).then((res) => res.data);

export const createFood = (food) =>
  api.post('/foods', food).then((res) => res.data);

export const updateFood = (id, food) =>
  api.put(`/foods/${id}`, food).then((res) => res.data);

export const deleteFood = (id) =>
  api.delete(`/foods/${id}`).then((res) => res.data);

export const placeOrder = (items) =>
  api.post('/orders', { items }).then((res) => res.data);

export const getOrders = () =>
  api.get('/orders').then((res) => res.data);

export const getAllOrders = () =>
  api.get('/admin/orders').then((res) => res.data);

export const createPayment = (payment) =>
  api.post('/payments', payment).then((res) => res.data);

export const getTicket = (orderId) =>
  api.get(`/tickets/${orderId}`).then((res) => res.data);