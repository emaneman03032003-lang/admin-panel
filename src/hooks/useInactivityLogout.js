/**
 * useInactivityLogout Hook
 * 
 * Monitors user activity and automatically logs out after specified inactivity period.
 * Tracks: mouse movement, keyboard input, clicks, and scrolling
 * Shows optional warning modal before logout
 * Clears token and redirects to login on logout
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
const WARNING_TIME = 30 * 1000; // Show warning 30 seconds before logout

function useInactivityLogout() {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null); // stores the warning setTimeout id
  const countdownIntervalRef = useRef(null); // stores the countdown interval id
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  /**
   * Handle logout - clear storage and redirect to login
   */
  const handleLogout = () => {
    console.log('🚪 [INACTIVITY LOGOUT] User logged out due to inactivity');
    
    // Clear token and any auth data
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('refreshToken');
    sessionStorage.clear();
    
    // Close warning modal if open
    setShowWarning(false);
    
    // Redirect to login
    navigate('/login', { replace: true });
  };

  /**
   * Show warning modal with countdown
   */
  const showInactivityWarning = () => {
    console.log('⏰ [INACTIVITY WARNING] User will be logged out in 30 seconds due to inactivity');
    setShowWarning(true);

    // Start countdown from WARNING_TIME (in seconds)
    let secondsLeft = Math.floor(WARNING_TIME / 1000);
    setRemainingSeconds(secondsLeft);

    // Clear any previous interval just in case
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      secondsLeft--;
      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }, 1000);
  };

  /**
   * Reset inactivity timer
   */
  const resetInactivityTimer = () => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    
    // Close warning if open
    if (showWarning) {
      console.log('✅ [INACTIVITY TIMER RESET] User activity detected, timer reset');
      setShowWarning(false);
    }
    
    // Set warning timeout (INACTIVITY_TIMEOUT - WARNING_TIME)
    warningTimeoutRef.current = setTimeout(() => {
      showInactivityWarning();
    }, INACTIVITY_TIMEOUT - WARNING_TIME);
    
    // Set final logout timeout (5 minutes)
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT);
  };

  /**
   * Setup activity listeners
   */
  useEffect(() => {
    // Check if user is authenticated (support both token keys)
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (!token) {
      return; // Don't set up timers if not logged in
    }

    console.log('👁️ [INACTIVITY MONITOR] Setting up inactivity monitoring (5 min timeout)');
    
    // List of events that count as user activity
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'keypress'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // Initialize timer on first load
    resetInactivityTimer();

    // Cleanup function
    return () => {
      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });

      // Clear timeouts and intervals
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      
      console.log('👁️ [INACTIVITY MONITOR] Cleaning up inactivity monitoring');
    };
  }, []);

  return {
    showWarning,
    remainingSeconds,
    handleLogout,
    dismissWarning: () => setShowWarning(false)
  };
}

export default useInactivityLogout;
