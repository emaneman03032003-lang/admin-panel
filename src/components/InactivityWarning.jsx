/**
 * InactivityWarning Component
 * 
 * Displays a warning modal when user is about to be logged out due to inactivity
 * Shows countdown timer
 * Allows user to dismiss warning and continue session
 */

import React from 'react';
import './InactivityWarning.css';

function InactivityWarning({ show, remainingSeconds, onDismiss, onLogout }) {
  if (!show) return null;

  return (
    <div className="inactivity-overlay">
      <div className="inactivity-modal">
        {/* Icon */}
        <div className="inactivity-icon">
          <span className="icon-clock">⏰</span>
        </div>

        {/* Title */}
        <h2 className="inactivity-title">Session Timeout Warning</h2>

        {/* Message */}
        <p className="inactivity-message">
          You have been inactive for <strong>4 minutes and 30 seconds</strong>
        </p>

        {/* Countdown */}
        <div className="inactivity-countdown">
          <div className="countdown-circle">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(212, 175, 55, 0.1)"
                strokeWidth="2"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#d4af37"
                strokeWidth="2"
                strokeDasharray={`${(remainingSeconds / 30) * 283} 283`}
                style={{
                  transition: 'stroke-dasharray 1s linear',
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%'
                }}
              />
            </svg>
            <div className="countdown-text">
              <div className="countdown-number">{remainingSeconds}</div>
              <div className="countdown-label">seconds</div>
            </div>
          </div>
        </div>

        {/* Info */}
        <p className="inactivity-info">
          Your session will automatically logout in <strong>{remainingSeconds} seconds</strong> for security reasons.
        </p>

        {/* Buttons */}
        <div className="inactivity-buttons">
          <button
            className="inactivity-btn btn-primary"
            onClick={onDismiss}
            title="Continue your session"
          >
            Stay Logged In
          </button>
          <button
            className="inactivity-btn btn-secondary"
            onClick={onLogout}
            title="Logout now"
          >
            Logout Now
          </button>
        </div>

        {/* Footer */}
        <p className="inactivity-footer">
          Move your mouse or press any key to remain logged in
        </p>
      </div>
    </div>
  );
}

export default InactivityWarning;
