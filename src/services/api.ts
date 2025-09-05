const API_BASE_URL = 'http://localhost:5001/api';

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '알 수 없는 오류가 발생했습니다.' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const productAPI = {
  getAll: () => apiCall('/products'),
  getById: (id: string) => apiCall(`/products/${id}`),
  create: (data: any) => apiCall('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiCall(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/products/${id}`, {
    method: 'DELETE',
  }),
};

export const orderAPI = {
  getAll: () => apiCall('/orders'),
  create: (data: any) => apiCall('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStatus: (id: string, status: string) => apiCall(`/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ orderStatus: status }),
  }),
  delete: (id: string) => apiCall(`/orders/${id}`, {
    method: 'DELETE',
  }),
};

export const adminAPI = {
  getUsers: () => apiCall('/admin/users'),
  testConnection: () => apiCall('/admin/test'),
};
