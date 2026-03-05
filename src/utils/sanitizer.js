/**
 * Security Sanitizer Utility - Admin Panel
 * 
 * Provides functions to sanitize and validate user input
 * Prevents XSS attacks and other injection vulnerabilities
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHTML = (html) => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    KEEP_CONTENT: true
  });
};

/**
 * Sanitize plain text (removes all HTML)
 * @param {string} text - Text content to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (text) => {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requires: min 8 chars, 1 uppercase, 1 number, 1 special char
 * @param {string} password - Password to validate
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate product name
 * @param {string} name - Product name
 * @returns {boolean} - True if valid
 */
export const validateProductName = (name) => {
  if (!name) return false;
  if (name.length > 100) return false;
  if (name.length < 3) return false;
  return /^[a-zA-Z0-9\s\-_()]+$/.test(name);
};

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export const escapeHTML = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate product price
 * @param {number|string} price - Price to validate
 * @returns {boolean} - True if valid
 */
export const validatePrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num > 0;
};

/**
 * Validate stock quantity
 * @param {number|string} stock - Stock to validate
 * @returns {boolean} - True if valid
 */
export const validateStock = (stock) => {
  const num = parseInt(stock);
  return !isNaN(num) && num >= 0;
};

export default {
  sanitizeHTML,
  sanitizeText,
  validateEmail,
  validatePassword,
  validateProductName,
  escapeHTML,
  validateURL,
  validatePrice,
  validateStock
};
