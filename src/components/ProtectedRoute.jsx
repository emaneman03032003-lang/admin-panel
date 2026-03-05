import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { watchAdminAuth } from '../services/authService';
import useInactivityLogout from '../hooks/useInactivityLogout';
import InactivityWarning from './InactivityWarning';

/**
 * ProtectedRoute Component
 * 
 * This component ensures only authenticated admins can access protected pages
 * If user is not authenticated or not admin, redirects to login
 * 
 * Features:
 * - Authentication verification
 * - Inactivity-based automatic logout (5 minutes)
 * - Warning modal before logout (30 seconds before)
 * - Token and session clearing on logout
 */
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading, true/false = result
  const [user, setUser] = useState(null);
  
  // Use inactivity logout hook
  const { showWarning, remainingSeconds, handleLogout, dismissWarning } = useInactivityLogout();

  useEffect(() => {
    // Watch for auth state changes
    const unsubscribe = watchAdminAuth((authUser) => {
      if (authUser) {
        setUser(authUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #0a0e27 40%, #1a1f3a 100%)',
        color: '#d4af37',
        fontSize: '1.1rem',
        fontFamily: 'Inter, sans-serif',
        letterSpacing: '0.5px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(212, 175, 55, 0.2)',
            borderTopColor: '#d4af37',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }}></div>
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated and is admin, render children with inactivity warning modal
  return (
    <>
      {/* Inactivity Warning Modal */}
      <InactivityWarning
        show={showWarning}
        remainingSeconds={remainingSeconds}
        onDismiss={dismissWarning}
        onLogout={handleLogout}
      />
      
      {/* Protected Content */}
      {children}
    </>
  );
}

export default ProtectedRoute;

/**
 * CSS for spinner animation
 * Add this to your global CSS if not already present:
 * 
 * @keyframes spin {
 *   to { transform: rotate(360deg); }
 * }
 */
