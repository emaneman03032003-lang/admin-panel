/**
 * AdminApp Component - Main entry point for GN SONS Admin Panel
 * 
 * Features:
 * - Admin login with JWT authentication
 * - Protected routes (products, orders, chats, analytics)
 * - Dashboard overview
 * - Product management (CRUD)
 * - Order tracking and status updates
 * - Customer conversations
 * - Analytics and reports
 * 
 * All routes except /login are protected by ProtectedRoute middleware
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminHeader from './components/AdminHeader';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import ChatsPage from './pages/ChatsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CategoriesPage from './pages/CategoriesPage';
import ContactMessages from './pages/ContactMessages';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/global.css';

function AdminApp() {
  return (
    <Router>
      <Routes>
        {/* Public Route - Login */}
        <Route path="/login" element={<AdminLoginPage />} />

        {/* Protected Routes - Admin Only */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="admin-app">
                <AdminHeader />
                <main className="admin-main">
                  <AdminDashboard />
                </main>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <div className="admin-app">
                <AdminHeader />
                <main className="admin-main">
                  <ProductsPage />
                </main>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <div className="admin-app">
                <AdminHeader />
                <main className="admin-main">
                  <CategoriesPage />
                </main>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <div className="admin-app">
                <AdminHeader />
                <main className="admin-main">
                  <OrdersPage />
                </main>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chats"
          element={
            <ProtectedRoute>
              <div className="admin-app">
                <AdminHeader />
                <main className="admin-main">
                  <ChatsPage />
                </main>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <div className="admin-app">
                <AdminHeader />
                <main className="admin-main">
                  <ContactMessages />
                </main>
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <div className="admin-app">
                <AdminHeader />
                <main className="admin-main">
                  <AnalyticsPage />
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default AdminApp;
