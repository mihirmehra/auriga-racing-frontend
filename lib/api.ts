import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://auriga-racing-backend.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  forgotPassword: (data: any) => api.post('/auth/forgot-password', data),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: any) => api.put('/users/profile', data),
  changePassword: (data: any) => api.put('/users/change-password', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Categories API
export const categoriesAPI = {
  getAll: (params?: any) => api.get('/categories', { params }),
  getBySlug: (slug: string) => api.get(`/categories/slug/${slug}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
  getSubCategories: (categoryId: string, params?: any) => 
    api.get(`/categories/${categoryId}/subcategories`, { params }),
  createSubCategory: (categoryId: string, data: any) => 
    api.post(`/categories/${categoryId}/subcategories`, data),
  updateSubCategory: (id: string, data: any) => 
    api.put(`/categories/subcategories/${id}`, data),
  deleteSubCategory: (id: string) => 
    api.delete(`/categories/subcategories/${id}`),
};

// Products API
export const productsAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
  getById: (id: string) => api.get(`/products/${id}`),
  getRelated: (id: string) => api.get(`/products/${id}/related`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Orders API
export const ordersAPI = {
  getMyOrders: (params?: any) => api.get('/orders/my-orders', { params }),
  getAll: (params?: any) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  updateStatus: (id: string, data: any) => api.put(`/orders/${id}/status`, data),
  cancel: (id: string) => api.put(`/orders/${id}/cancel`),
};

// Addresses API
export const addressesAPI = {
  getAll: () => api.get('/addresses'),
  getById: (id: string) => api.get(`/addresses/${id}`),
  create: (data: any) => api.post('/addresses', data),
  update: (id: string, data: any) => api.put(`/addresses/${id}`, data),
  delete: (id: string) => api.delete(`/addresses/${id}`),
  setDefault: (id: string) => api.put(`/addresses/${id}/default`),
};

// Cart API
export const cartAPI = {
  get: () => api.get('/cart'),
  add: (data: any) => api.post('/cart/add', data),
  update: (productId: string, data: any) => api.put(`/cart/update/${productId}`, data),
  remove: (productId: string) => api.delete(`/cart/remove/${productId}`),
  clear: () => api.delete('/cart/clear'),
};

// Wishlist API
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  add: (data: any) => api.post('/wishlist/add', data),
  remove: (productId: string) => api.delete(`/wishlist/remove/${productId}`),
  clear: () => api.delete('/wishlist/clear'),
  moveToCart: (productId: string, data?: any) => 
    api.post(`/wishlist/move-to-cart/${productId}`, data),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  create: (data: any) => api.post('/notifications', data),
  broadcast: (data: any) => api.post('/notifications/broadcast', data),
};

// Settings API
export const settingsAPI = {
  getAll: (params?: any) => api.get('/settings', { params }),
  getPublic: () => api.get('/settings/public'),
  getByKey: (key: string) => api.get(`/settings/${key}`),
  update: (key: string, data: any) => api.put(`/settings/${key}`, data),
  delete: (key: string) => api.delete(`/settings/${key}`),
  initialize: () => api.post('/settings/initialize'),
};

// Reviews API
export const reviewsAPI = {
  getByProduct: (productId: string, params?: any) => 
    api.get(`/reviews/product/${productId}`, { params }),
  getAll: (params?: any) => api.get('/reviews', { params }),
  create: (data: any) => api.post('/reviews', data),
  update: (id: string, data: any) => api.put(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
  approve: (id: string, data: any) => api.put(`/reviews/${id}/approve`, data),
  respond: (id: string, data: any) => api.put(`/reviews/${id}/respond`, data),
  markHelpful: (id: string) => api.put(`/reviews/${id}/helpful`),
  report: (id: string) => api.put(`/reviews/${id}/report`),
};