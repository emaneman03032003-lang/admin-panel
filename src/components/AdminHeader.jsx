import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './AdminHeader.css';

const AdminHeader = ({ onLogout }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    // Call logout API
    authAPI.logout();
    
    // Notify parent component
    if (onLogout) {
      onLogout();
    }
    
    // Navigate to login
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="admin-header">
      <div className="container admin-header-container">
        <div className="logo">
          <Link to="/">
            <span className="logo-text">GN SONS ADMIN</span>
          </Link>
        </div>

        <button className="hamburger-menu" onClick={toggleMenu} aria-label="Toggle menu">
          <span className={`hamburger-line ${menuOpen ? 'active' : ''}`}></span>
          <span className={`hamburger-line ${menuOpen ? 'active' : ''}`}></span>
          <span className={`hamburger-line ${menuOpen ? 'active' : ''}`}></span>
        </button>

        <nav className={`admin-nav ${menuOpen ? 'mobile-active' : ''}`}>
          <Link to="/" onClick={closeMenu}>Dashboard</Link>
          <Link to="/products" onClick={closeMenu}>Products</Link>
          <Link to="/categories" onClick={closeMenu}>Categories</Link>
          <Link to="/analytics" onClick={closeMenu}>Analytics</Link>
          <Link to="/orders" onClick={closeMenu}>Orders</Link>
          <Link to="/contacts" onClick={closeMenu}>Contacts</Link>
          <Link to="/chats" onClick={closeMenu}>Messages</Link>
        </nav>

        <div className={`admin-user ${menuOpen ? 'mobile-active' : ''}`}>
          
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
