import axios from 'axios';

const getBaseURL = () => {
  
  // return "http://localhost:5000/api";
  return "https://crm-360-wvd1.onrender.com/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track whether a refresh is already in progress to prevent multiple simultaneous refresh calls
let isRefreshing = false;
// Queue of requests that failed with 401 and are waiting for token refresh
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor: auto-refresh access token on 401 TOKEN_EXPIRED
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors with TOKEN_EXPIRED code, and only retry once
    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry;

    if (isTokenExpired) {
      if (isRefreshing) {
        // If refresh is already happening, queue this request to retry after
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh endpoint — server sets new httpOnly cookies automatically
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token also expired — clear saved user and redirect to login
        processQueue(refreshError);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('crm_user');
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;