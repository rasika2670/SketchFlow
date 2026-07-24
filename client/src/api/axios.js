import axios from 'axios';
import { env } from '@/config/env';

// Create Axios instance
const api = axios.create({
  baseURL: env.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Auth Store Accessor ───────────────────────────────────────────────────────
// Lazy accessor to break circular dependency (axios ↔ authStore)
let getAuthStore = null;

export const setAuthStoreAccessor = (accessor) => {
  getAuthStore = accessor;
};

// ─── Refresh Token Queue ───────────────────────────────────────────────────────
// Prevents multiple simultaneous refresh calls when multiple 401s arrive
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ─── Request Interceptor ───────────────────────────────────────────────────────
// Attach Bearer token from auth store to every request
api.interceptors.request.use(
  (config) => {
    if (getAuthStore) {
      const token = getAuthStore().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ──────────────────────────────────────────────────────
// On 401: attempt silent token refresh, then retry the original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry the refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request — it will be replayed after refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Silent refresh — httpOnly cookie is sent automatically
        const { data } = await axios.post(
          `${env.API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.accessToken;

        // Update token in store
        if (getAuthStore) {
          getAuthStore().setAccessToken(newToken);
        }

        // Replay all queued requests with new token
        processQueue(null, newToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — logout user
        processQueue(refreshError, null);

        if (getAuthStore) {
          getAuthStore().logout();
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
