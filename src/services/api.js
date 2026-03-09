/**
 * Admin Panel API Service
 * 
 * Centralized HTTP client for admin backend operations
 * Implements JWT authentication and token management
 * Provides methods for:
 * - Admin login and session management
 * - Product CRUD operations (admin only)
 * - Order management and status updates
 * - Customer conversations
 * - User management
 * - Analytics and reports
 * 
 * Base URL: http://localhost:5001/api
 * 
 * Authentication:
 * - Token stored in localStorage as 'adminToken'
 * - Refresh token stored as 'adminRefreshToken'
 * - Tokens sent in Authorization header: Bearer <token>
 */

// 🌍 Admin API Service
// we were importing axios earlier for a single method but never set up an instance
// since the rest of the file uses fetch we can drop it and standardise on a base URL

// Use VITE_API_BASE_URL from environment variables (.env file)
// Fallback to localhost for development if not defined
const API_BASE = 
  // import.meta.env.VITE_API_BASE_URL || 
  // 'http://localhost:5001/api';



   import.meta.env.VITE_API_BASE_URL ;
// debug output so developers can immediately see which base URL is being used
console.log('🔧 admin API base URL =', API_BASE);

// utility helpers for token management
const getToken = () => localStorage.getItem('adminToken');
const setToken = (token) => localStorage.setItem('adminToken', token);
const removeToken = () => localStorage.removeItem('adminToken');

// ============================================
// AUTHENTICATION
// ============================================

export const authAPI = {
  login: async (email, password) => {
    try {
      console.log('🟡 [AUTH] Logging in with:', email);
      const response = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      console.log('✅ [AUTH] Response:', data);
      
      if (data.success && data.token) {
        setToken(data.token);
        localStorage.setItem('adminRefreshToken', data.refreshToken || '');
        console.log('✅ [AUTH] Token stored successfully');
      } else {
        console.error('🔴 [AUTH] Login failed');
      }
      return data;
    } catch (error) {
      console.error('🔴 [AUTH] Network error:', error.message);
      return { success: false, error: 'Connection failed' };
    }
  },

  logout: () => {
    removeToken();
    localStorage.removeItem('adminRefreshToken');
  }
};

// ============================================
// PRODUCTS & ADMIN API
// ============================================

export const adminAPI = {
  products: {
    getAll: async () => {
      try {
        const response = await fetch(`${API_BASE}/products`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        return await response.json();
      } catch (error) {
        console.error('Error fetching products:', error);
        return { success: false, products: [] };
      }
    },

    add: async (productData) => {
      try {
        console.log('🟢 [PRODUCT_ADD] Sending to:', `${API_BASE}/products`);
        console.log('🟢 [PRODUCT_ADD] Data:', productData);
        
        const response = await fetch(`${API_BASE}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify(productData)
        });
        
        console.log('🟢 [PRODUCT_ADD] Status:', response.status);
        console.log('🟢 [PRODUCT_ADD] Status OK:', response.ok);
        console.log('🟢 [PRODUCT_ADD] Status Text:', response.statusText);

        // Check if response has content
        const contentType = response.headers.get('content-type');
        console.log('🟢 [PRODUCT_ADD] Content-Type:', contentType);

        let data;
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else if (response.status === 204) {
          // 204 No Content - treat as success but no data
          data = {
            success: true,
            message: 'Product added successfully',
            product: productData
          };
        } else {
          const text = await response.text();
          console.error('🔴 [PRODUCT_ADD] Non-JSON response:', text);
          data = {
            success: false,
            error: 'Invalid server response',
            message: text
          };
        }

        console.log('🟢 [PRODUCT_ADD] Response data:', data);
        
        if (!response.ok) {
          const errorMsg = data?.error || data?.message || `HTTP ${response.status}`;
          console.error('🔴 [PRODUCT_ADD] Error from backend:', errorMsg);
          throw new Error(errorMsg);
        }
        
        if (!data?.success && data?.success !== undefined) {
          const errorMsg = data?.error || data?.message || 'Unknown error';
          console.error('🔴 [PRODUCT_ADD] Backend error:', errorMsg);
          throw new Error(errorMsg);
        }

        console.log('✅ [PRODUCT_ADD] SUCCESS!');
        return data;
      } catch (error) {
        console.error('🔴 [PRODUCT_ADD] Fetch error:', error.message);
        throw error;
      }
    },

    update: async (id, productData) => {
      try {
        const response = await fetch(`${API_BASE}/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Failed to update product');
        return await response.json();
      } catch (error) {
        console.error('Error updating product:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        const response = await fetch(`${API_BASE}/products/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!response.ok) throw new Error('Failed to delete product');
        return await response.json();
      } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
      }
    }
  },

  orders: {
  },
  categories: {
    getAll: async () => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE}/categories`, {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('Error fetching categories, status', response.status);
          return { success: false, categories: [] };
        }

        // parse body carefully to avoid "Unexpected end of JSON input"
        const text = await response.text();
        if (!text) return { success: true, categories: [] };

        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse categories response as JSON:', text);
          return { success: false, categories: [] };
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        return { success: false, categories: [] };
      }
    },
    add: async (categoryData) => {
      try {
        const response = await fetch(`${API_BASE}/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
          console.error('Error adding category, status', response.status);
        }

        // attempt to parse even if status is not ok, to provide better error messages
        const data = await response.text();
        try {
          return JSON.parse(data);
        } catch {
          // response was empty or not JSON
          return { success: response.ok, message: data };
        }
      } catch (error) {
        console.error('Error adding category:', error);
        throw error;
      }
    },
    update: async (id, categoryData) => {
      try {
        const response = await fetch(`${API_BASE}/categories/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify(categoryData)
        });
        return await response.json();
      } catch (error) {
        console.error('Error updating category:', error);
        throw error;
      }
    },
    delete: async (id) => {
      try {
        const response = await fetch(`${API_BASE}/categories/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        return await response.json();
      } catch (error) {
        console.error('Error deleting category:', error);
        throw error;
      }
    }
  },
  orders: {
    getAll: async () => {
      try {
        console.log('🟡 [ORDERS] Fetching all orders from:', `${API_BASE}/orders/admin/all`);
        const token = getToken();
        console.log('🔐 Token present:', !!token);
        
        const response = await fetch(`${API_BASE}/orders/admin/all`, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 Response status:', response.status);
        const data = await response.json();
        console.log('✅ Orders fetched:', data);
        
        return data;
      } catch (error) {
        console.error('❌ Error fetching orders:', error);
        return { success: false, orders: [] };
      }
    },

    updateStatus: async (id, status) => {
      try {
        const response = await fetch(`${API_BASE}/orders/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify({ status })
        });
        if (!response.ok) throw new Error('Failed to update order');
        return await response.json();
      } catch (error) {
        console.error('Error updating order:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        console.log('🗑️ [DELETE ORDER] Deleting order:', id);
        const response = await fetch(`${API_BASE}/orders/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          }
        });
        if (!response.ok) throw new Error('Failed to delete order');
        const data = await response.json();
        console.log('✅ [DELETE ORDER] Success:', data);
        return data;
      } catch (error) {
        console.error('❌ [DELETE ORDER] Error:', error);
        throw error;
      }
    }
  },

  chats: {
    getAllConversations: async () => {
      try {
        const response = await fetch(`${API_BASE}/chat/admin/conversations`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch conversations');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }
    },

    sendMessage: async (data) => {
      const response = await fetch(`${API_BASE}/chat/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      return response.json();
    },

    getConversation: async (conversationId) => {
      const response = await fetch(`${API_BASE}/chat/conversation/${conversationId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch conversation');
      }
      
      return response.json();
    }
  },

  contacts: {
    getAll: async () => {
      try {
        const response = await fetch(`${API_BASE}/contact/admin/all`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          }
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch contacts');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching contacts:', error);
        return { success: false, contacts: [] };
      }
    },

    updateStatus: async (id, status) => {
      try {
        const response = await fetch(`${API_BASE}/contact/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify({ status })
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update contact status');
        }
        return await response.json();
      } catch (error) {
        console.error('Error updating contact status:', error);
        return { success: false };
      }
    }
    ,
    delete: async (id) => {
      try {
        const response = await fetch(`${API_BASE}/contact/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          }
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete contact');
        }
        return await response.json();
      } catch (error) {
        console.error('Error deleting contact:', error);
        return { success: false };
      }
    }
  }
};

export const productAPI = adminAPI.products;