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
  api.post('/api/login', { email, password }).then((res) => res.data);

export const register = (name, email, password, phone) =>
  api.post('/api/register', { name, email, password, phone }).then((res) => res.data);

export const getCategories = () =>
  api.get('/api/categories').then((res) => res.data);

export const getFoods = (categoryId) =>
  api.get(`/api/foods${categoryId ? `?category_id=${categoryId}` : ''}`).then((res) => res.data);

export const createFood = (food) =>
  api.post('/api/foods', food).then((res) => res.data);

export const updateFood = (id, food) =>
  api.put(`/api/foods/${id}`, food).then((res) => res.data);

export const deleteFood = (id) =>
  api.delete(`/api/foods/${id}`).then((res) => res.data);

export const placeOrder = (items) =>
  api.post('/api/orders', { items }).then((res) => res.data);

export const getOrders = () =>
  api.get('/api/orders').then((res) => res.data);

export const getAllOrders = () =>
  api.get('/api/admin/orders').then((res) => res.data);

export const createPayment = (payment) =>
  api.post('/api/payments', payment).then((res) => res.data);

export const getTicket = (orderId) =>
  api.get(`/api/tickets/${orderId}`).then((res) => res.data);

// API mới: Lấy chi tiết đơn hàng
export const getAdminOrderDetails = (orderId) =>
  api.get(`/api/admin/orders/${orderId}`).then((res) => res.data);

// API mới: Cập nhật trạng thái đơn hàng
export const updateOrderStatus = (orderId, status) =>
  api.put(`/api/admin/orders/${orderId}/status`, { status }).then((res) => res.data);

//số lượng món ăn đã xác nhận
export const getConfirmedFoods = () => api.get('/api/admin/foods-confirmed').then((res) => res.data);

export const getPaymentByOrder = (orderId) =>
  api.get(`/api/payments/order/${orderId}`).then((res) => res.data);

export const cancelOrder = (orderId) =>
  api.delete(`/api/orders/${orderId}/cancel`).then((res) => res.data);