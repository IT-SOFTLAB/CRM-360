
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCurrentOrganizationId = () => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("crm_user");

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.organizationId || null;
      } catch (e) {
        return null;
      }
    }
  }

  return null;
};

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const orgId = getCurrentOrganizationId();
  if (
      orgId &&
      config.url &&
      !config.url.startsWith('/auth') &&
      !config.url.startsWith('/bootstrap') &&
      !config.url.startsWith('/ai') &&
      !config.url.startsWith('/org/')
    ) {
      const path = config.url.startsWith('/') ? config.url : `/${config.url}`;
      config.url = `/org/${orgId}${path}`;
    }
  }

  return config;
});

// Track whether a refresh is already in progress
let isRefreshing = false;

// Queue requests during refresh
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

// Auto refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const hasUserSession =
      typeof window !== 'undefined' &&
      localStorage.getItem('crm_user');

    const isTokenExpired =
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !!hasUserSession &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh');

    if (isTokenExpired) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        const refreshRes = await api.post('/auth/refresh', { refreshToken: storedRefreshToken });

        if (refreshRes.data?.accessToken) {
          localStorage.setItem('token', refreshRes.data.accessToken);
        }
        if (refreshRes.data?.refreshToken) {
          localStorage.setItem('refreshToken', refreshRes.data.refreshToken);
        }

        processQueue(null);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        if (typeof window !== 'undefined') {
          localStorage.removeItem('crm_user');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');

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

