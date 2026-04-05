import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  
  // Don't add branchId to auth and admin-only endpoints
  const superAdminOnlyEndpoints = ['/auth/', '/audit-logs', '/branches'];
  const isAdminEndpoint = superAdminOnlyEndpoints.some(endpoint => config.url.includes(endpoint));
  
  if (!isAdminEndpoint) {
    // Add branch ID to query params if available (for branch-specific operations)
    const currentBranch = localStorage.getItem('currentBranch');
    if (currentBranch) {
      const branchId = JSON.parse(currentBranch);
      if (branchId && !config.params) {
        config.params = {};
      }
      if (branchId && !config.params?.branchId) {
        config.params.branchId = branchId;
      }
    }
  }
  
  return config;
});

// Handle global errors
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('branches');
      localStorage.removeItem('currentBranch');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
