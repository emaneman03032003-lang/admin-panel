// Auth service replaced to use backend APIs (MongoDB + JWT)

// Admin email list - you can add multiple admin emails here
const ADMIN_EMAILS = [
  "admin@gmail.com",
  "admin@gnsons.com",
  "owner@gnsons.com"
  // Add more admin emails as needed
];

/**
 * Check if user is admin
 */
export const isAdminEmail = (email) => {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
};

/**
 * CHECK IF USER HAS ADMIN CUSTOM CLAIMS
 * Note: Not implemented in MongoDB version - relies on email check
 */
export const hasAdminClaims = async (user) => {
  // MongoDB version uses email-based admin check only
  return isAdminEmail(user?.email);
};

/**
 * ADMIN LOGIN - Using Backend API
 */
export const adminLogin = async (email, password) => {
  try {
    // Check if email is admin email
    if (!isAdminEmail(email)) {
      throw new Error("❌ Access Denied: Only admin emails can login");
    }
    // Use backend API (no Firebase)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${apiUrl}/auth/admin-login`, {
    
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');

    if (data.token) {
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminEmail', email);
    }

    return { success: true, user: { uid: data.admin?.id || email, email: data.admin?.email || email, displayName: data.admin?.name || '' } };
  } catch (error) {
    console.error("Admin login error:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * ADMIN LOGOUT
 */
export const adminLogout = async () => {
  try {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * GET CURRENT ADMIN USER
 */
export const getCurrentAdminUser = () => {
  // Simple localStorage-based check; frontend should validate token with backend
  const token = localStorage.getItem('adminToken');
  const email = localStorage.getItem('adminEmail');
  if (token && email && isAdminEmail(email)) {
    return Promise.resolve({ uid: email, email, displayName: '' });
  }
  return Promise.resolve(null);
};

/**
 * WATCH AUTH STATE (For real-time updates)
 */
export const watchAdminAuth = (callback) => {
  // Check localStorage for admin token and email
  const token = localStorage.getItem('adminToken');
  const email = localStorage.getItem('adminEmail');
  
  if (token && email && isAdminEmail(email)) {
    // User is authenticated
    callback({
      uid: email,
      email: email,
      displayName: '',
      isAdmin: true
    });
  } else {
    // User is not authenticated
    callback(null);
  }
  
  // Return unsubscribe function (no-op for localStorage approach)
  return () => {};
};

/**
 * CREATE NEW ADMIN (Backend Only)
 * Note: In MongoDB version, admin creation should be done via backend API
 * This is a placeholder that calls the backend endpoint
 */
export const createNewAdmin = async (email, password, displayName) => {
  try {
    if (!isAdminEmail(email)) {
      throw new Error("❌ Invalid: Only admin emails can be created");
    }

    // Call backend API to create admin
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${apiUrl}/auth/admin-register`, {
   
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: displayName })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create admin');

    return {
      success: true,
      user: {
        uid: data.admin?.id || email,
        email: data.admin?.email || email,
        displayName: data.admin?.name || displayName
      }
    };
  } catch (error) {
    console.error("Create admin error:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * VERIFY ADMIN ACCESS
 * Simple email-based verification for MongoDB version
 */
export const verifyAdminAccess = async (user) => {
  if (!user) {
    return false;
  }

  // Check if email is in admin list
  return isAdminEmail(user.email);
};

/**
 * EXAMPLE USAGE IN COMPONENTS
 * 
 * // In Login Component
 * const handleAdminLogin = async () => {
 *   const result = await adminLogin(email, password);
 *   if (result.success) {
 *     console.log("Admin logged in:", result.user);
 *     // Redirect to dashboard
 *   } else {
 *     console.error(result.error);
 *     // Show error message
 *   }
 * };
 * 
 * // In Admin Dashboard
 * useEffect(() => {
 *   const unsubscribe = watchAdminAuth((user) => {
 *     if (user) {
 *       setCurrentUser(user);
 *     } else {
 *       // Redirect to login
 *       navigate("/login");
 *     }
 *   });
 *   
 *   return unsubscribe;
 * }, []);
 * 
 * // Logout
 * const handleLogout = async () => {
 *   await adminLogout();
 *   navigate("/login");
 * };
 */
