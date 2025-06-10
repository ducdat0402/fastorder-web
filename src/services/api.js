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

export const getScannedOrders = async () => {
  const response = await api.get('/api/scanned-orders');
  return response.data;
};

export const getAdminScannedOrders = async () => {
  const response = await api.get('/api/admin/scanned-orders');
  return response.data;
};

export const scanQR = async (ticket_code) => {
  try {
    if (!ticket_code) {
      throw new Error('Ticket code is required');
    }
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found. Please log in.');
    }
    console.log('Sending scanQR request with ticket_code:', ticket_code); // Debug
    const response = await api.post('/api/admin/scan-qr', { ticket_code });
    console.log('scanQR response:', response.data); // Debug
    return response.data;
  } catch (err) {
    console.error('scanQR error:', err.response?.data || err.message); // Debug
    throw err; // Ném lỗi để AdminScanQR.js xử lý
  }
};

// Lấy danh sách user
export const getAllUsers = async () => {
  const response = await api.get('/api/users');
  return response.data;
};
// Lấy tất cả món ăn cho admin
export const getAdminFoods = async () => {
  const response = await api.get('/api/admin/foods');
  return response.data;
};

// Đổi quyền user
export const updateUserRole = async (userId, role) => {
  const response = await api.put(`/api/users/${userId}/role`, { role });
  return response.data;
};

// Xóa user
export const deleteUser = async (userId) => {
  const response = await api.delete(`/api/users/${userId}`);
  return response.data;
};