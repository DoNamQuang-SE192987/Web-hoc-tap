import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Request Interceptor: Tự động đính kèm JWT Token vào Header của mọi request
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

// Axios Response Interceptor: Xử lý lỗi tập trung (ví dụ: Token hết hạn -> logout)
api.interceptors.response.use(
  (response) => {
    // Trả về directly data nếu response là JSON ( ApiResponse format )
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Token hết hạn hoặc không hợp lệ -> xóa token và chuyển hướng về trang login
      if (error.response.status === 401 || error.response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
          }
        }
      }
      return Promise.reject(error.response.data);
    }
    return Promise.reject({ success: false, message: 'Kết nối tới máy chủ thất bại.' });
  }
);
