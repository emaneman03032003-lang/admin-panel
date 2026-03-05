import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import './AdminDashboard.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#f0e68c', textAlign: 'center' }}>
          <h3>⚠️ Error loading dashboard</h3>
          <p>{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedView, setSelectedView] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching dashboard stats...');

      // Fetch products
      console.log('📦 Fetching products...');
      const productsData = await adminAPI.products.getAll();
      console.log('✅ Products response:', productsData);
      
      let productsList = [];
      if (productsData && (productsData.success || Array.isArray(productsData))) {
        productsList = Array.isArray(productsData) ? productsData : (productsData.products || productsData.data || []);
        console.log('✅ Products loaded:', productsList.length, 'items');
        setProducts(productsList || []);
      } else {
        console.warn('⚠️ Invalid products response format');
        setProducts([]);
      }

      // Fetch orders
      console.log('📋 Fetching orders...');
      const ordersData = await adminAPI.orders.getAll();
      console.log('✅ Orders response:', ordersData);
      
      let ordersList = [];
      if (ordersData && (ordersData.success || Array.isArray(ordersData))) {
        ordersList = Array.isArray(ordersData) ? ordersData : (ordersData.orders || ordersData.data || []);
        console.log('✅ Orders loaded:', ordersList.length, 'items');
        setOrders(ordersList || []);
      } else {
        console.warn('⚠️ Invalid orders response format');
        setOrders([]);
      }

      // Calculate stats with safe operations
      const validOrders = Array.isArray(ordersList) ? ordersList : [];
      const totalRevenue = validOrders.reduce((sum, order) => {
        const price = order.totalPrice || order.finalPrice || order.total || 0;
        return sum + (typeof price === 'number' ? price : 0);
      }, 0);
      
      const pendingOrdersCount = validOrders.filter(o => 
        (o.status || '').toLowerCase() === 'pending' || 
        (o.status || '').toLowerCase() === 'processing'
      ).length;

      const newStats = {
        totalProducts: productsList?.length || 0,
        totalOrders: ordersList?.length || 0,
        pendingOrders: pendingOrdersCount,
        totalRevenue: totalRevenue || 0
      };

      console.log('📊 Calculated stats:', newStats);
      setStats(newStats);

    } catch (error) {
      console.error('❌ Error fetching stats:', error);
      setError(`Failed to load dashboard: ${error.message}`);
      setStats({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0
      });
      setProducts([]);
      setOrders([]);
    } finally {
      setLoading(false);
      console.log('✅ Dashboard fetch complete');
    }
  };

  const openView = (view) => {
    setSelectedView(view);
    setExpandedItem(null);
    document.body.classList.add('modal-open');
  };

  const closeView = () => {
    setSelectedView(null);
    setExpandedItem(null);
    document.body.classList.remove('modal-open');
  };

  const toggleExpanded = (id) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const renderModalContent = () => {
    if (!selectedView) return null;

    switch (selectedView) {
      case 'products': {
        return (
          <div className="modal-content-view">
            <h3>📦 Total Products ({products.length})</h3>
            <div className="list-view">
              {products.length === 0 ? (
                <p className="empty-message">No products found</p>
              ) : (
                products.map(p => (
                  <div
                    key={p._id || p.id}
                    className={`list-item ${expandedItem === (p._id || p.id) ? 'expanded' : ''}`}
                  >
                    <div 
                      className="list-item-header"
                      onClick={() => toggleExpanded(p._id || p.id)}
                    >
                      <div className="item-basic">
                        <h4>{p.name}</h4>
                        <p className="item-category">{p.category}</p>
                      </div>
                      <div className="item-summary">
                        <span className="price">Rs. {p.price}</span>
                        <span className={`stock-badge ${p.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                          {p.stock} units
                        </span>
                      </div>
                      <span className="expand-icon">{expandedItem === (p._id || p.id) ? '▼' : '▶'}</span>
                    </div>
                    {expandedItem === (p._id || p.id) && (
                      <div className="list-item-details">
                        <div className="detail-row">
                          <span className="label">Description:</span>
                          <span className="value">{p.shortDescription || p.fullDescription || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Category:</span>
                          <span className="value">{p.category}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Price:</span>
                          <span className="value">Rs. {p.price}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Original Price:</span>
                          <span className="value">Rs. {p.originalPrice || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Stock:</span>
                          <span className="value">{p.stock} units</span>
                        </div>
                        {p.images?.length > 0 && (
                          <div className="detail-row">
                            <span className="label">Images:</span>
                            <div className="image-thumbs">
                              {p.images.map((img, idx) => (
                                <img key={idx} src={img} alt={`${p.name} ${idx + 1}`} className="thumb" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      }
      case 'orders': {
        return (
          <div className="modal-content-view">
            <h3>📋 Total Orders ({orders.length})</h3>
            <div className="list-view">
              {orders.length === 0 ? (
                <p className="empty-message">No orders found</p>
              ) : (
                orders.map(o => (
                  <div
                    key={o._id || o.id}
                    className={`list-item ${expandedItem === (o._id || o.id) ? 'expanded' : ''}`}
                  >
                    <div 
                      className="list-item-header"
                      onClick={() => toggleExpanded(o._id || o.id)}
                    >
                      <div className="item-basic">
                        <h4>{o._id?.slice(-8) || o.id?.slice(-8) || 'Order'}</h4>
                        <p className="item-category">{o.userEmail || o.user?.email || 'No email'}</p>
                      </div>
                      <div className="item-summary">
                        <span className="price">Rs. {o.totalPrice || o.finalPrice || o.total || 0}</span>
                        <span className={`status-badge ${o.status?.toLowerCase()}`}>
                          {o.status || 'Unknown'}
                        </span>
                      </div>
                      <span className="expand-icon">{expandedItem === (o._id || o.id) ? '▼' : '▶'}</span>
                    </div>
                    {expandedItem === (o._id || o.id) && (
                      <div className="list-item-details">
                        <div className="detail-row">
                          <span className="label">Order ID:</span>
                          <span className="value">{o._id || o.id}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Customer:</span>
                          <span className="value">{o.userEmail || o.user?.email || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Total:</span>
                          <span className="value">Rs. {o.totalPrice || o.finalPrice || o.total || 0}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Status:</span>
                          <span className={`status-badge ${o.status?.toLowerCase()}`}>{o.status || 'Unknown'}</span>
                        </div>
                        {o.items?.length > 0 && (
                          <div className="detail-row">
                            <span className="label">Items ({o.items.length}):</span>
                            <div className="items-list">
                              {o.items.map((item, idx) => (
                                <div key={idx} className="item-detail">
                                  {item.name} x {item.quantity}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      }
      case 'pending': {
        const pending = orders.filter(o => (o.status || '').toLowerCase() === 'pending' || (o.status || '').toLowerCase() === 'processing');
        return (
          <div className="modal-content-view">
            <h3>⏳ Pending Orders ({pending.length})</h3>
            <div className="list-view">
              {pending.length === 0 ? (
                <p className="empty-message">No pending orders</p>
              ) : (
                pending.map(o => (
                  <div
                    key={o._id || o.id}
                    className={`list-item ${expandedItem === (o._id || o.id) ? 'expanded' : ''}`}
                  >
                    <div 
                      className="list-item-header"
                      onClick={() => toggleExpanded(o._id || o.id)}
                    >
                      <div className="item-basic">
                        <h4>{o._id?.slice(-8) || o.id?.slice(-8) || 'Order'}</h4>
                        <p className="item-category">{o.userEmail || o.user?.email || 'No email'}</p>
                      </div>
                      <div className="item-summary">
                        <span className="price">Rs. {o.totalPrice || o.finalPrice || o.total || 0}</span>
                        <span className={`status-badge ${o.status?.toLowerCase()}`}>
                          {o.status}
                        </span>
                      </div>
                      <span className="expand-icon">{expandedItem === (o._id || o.id) ? '▼' : '▶'}</span>
                    </div>
                    {expandedItem === (o._id || o.id) && (
                      <div className="list-item-details">
                        <div className="detail-row">
                          <span className="label">Order ID:</span>
                          <span className="value">{o._id || o.id}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Customer:</span>
                          <span className="value">{o.userEmail || o.user?.email || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Total:</span>
                          <span className="value">Rs. {o.totalPrice || o.finalPrice || o.total || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      }
      case 'revenue': {
        const validOrders = Array.isArray(orders) ? orders : [];
        const avgOrderValue = validOrders.length > 0 ? Math.round((stats.totalRevenue || 0) / validOrders.length) : 0;
        
        return (
          <div className="modal-content-view">
            <h3>💹 Total Revenue</h3>
            <div className="revenue-summary">
              <div className="revenue-stat">
                <span className="label">Total Revenue</span>
                <span className="amount">Rs. {(stats.totalRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="revenue-stat">
                <span className="label">Orders</span>
                <span className="amount">{validOrders.length}</span>
              </div>
              <div className="revenue-stat">
                <span className="label">Average Order Value</span>
                <span className="amount">Rs. {avgOrderValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>📊 Dashboard Overview</h1>
          <p className="text-light">Welcome back! Here's your business at a glance.</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p className="loading-text">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="stats-grid">
              <div
                className="stat-card"
                role="button"
                tabIndex={0}
                onClick={() => openView('products')}
                onKeyDown={(e) => { if (e.key === 'Enter') openView('products'); }}
              >
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <h3 className="stat-label">Total Products</h3>
                  <p className="stat-value">{stats.totalProducts}</p>
                  <p className="stat-subtitle">Items in catalog</p>
                </div>
              </div>

              <div
                className="stat-card"
                role="button"
                tabIndex={0}
                onClick={() => openView('orders')}
                onKeyDown={(e) => { if (e.key === 'Enter') openView('orders'); }}
              >
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3 className="stat-label">Total Orders</h3>
                  <p className="stat-value">{stats.totalOrders}</p>
                  <p className="stat-subtitle">All orders placed</p>
                </div>
              </div>

              <div
                className="stat-card"
                role="button"
                tabIndex={0}
                onClick={() => openView('pending')}
                onKeyDown={(e) => { if (e.key === 'Enter') openView('pending'); }}
              >
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <h3 className="stat-label">Pending Orders</h3>
                  <p className="stat-value text-warning">{stats.pendingOrders}</p>
                  <p className="stat-subtitle">Awaiting processing</p>
                </div>
              </div>

              <div
                className="stat-card"
                role="button"
                tabIndex={0}
                onClick={() => openView('revenue')}
                onKeyDown={(e) => { if (e.key === 'Enter') openView('revenue'); }}
              >
                <div className="stat-icon">💹</div>
                <div className="stat-content">
                  <h3 className="stat-label">Total Revenue</h3>
                  <p className="stat-value text-gold">Rs. {stats.totalRevenue.toLocaleString()}</p>
                  <p className="stat-subtitle">From all orders</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <div className="section-header">
                <h2>🚀 Quick Actions</h2>
                <p className="section-subtitle">Manage your store efficiently</p>
              </div>
              <div className="action-buttons">
                <button className="btn btn-primary" onClick={() => navigate('/products')}>
                  ➕ Add New Product
                </button>
                <button className="btn btn-secondary" onClick={fetchStats}>
                  🔄 Refresh Data
                </button>
              </div>
            </div>

            {/* Recent Products */}
            {products.length > 0 && (
              <div className="recent-items">
                <div className="section-header">
                  <h2>📦 Recent Products</h2>
                  <p className="section-subtitle">Latest items added to your catalog</p>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.slice(0, 5).map(product => (
                      <tr key={product.id} style={{ cursor: 'pointer' }} onClick={() => {
                        openView('products');
                        setExpandedItem(product._id || product.id);
                      }}>
                        <td>{product.name}</td>
                        <td>{product.category}</td>
                        <td>Rs. {product.price}</td>
                        <td>{product.stock}</td>
                        <td>
                          <span className={`badge ${product.stock > 0 ? 'active' : 'inactive'}`}>
                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Detail Modal */}
            {selectedView && (
              <div className="modal-overlay" onClick={closeView}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>{selectedView === 'products' && '📦 Products' || selectedView === 'orders' && '📋 Orders' || selectedView === 'pending' && '⏳ Pending Orders' || selectedView === 'revenue' && '💹 Revenue'}</h2>
                    <button className="btn btn-close" onClick={closeView}>✕ Close</button>
                  </div>
                  <div className="modal-body">
                    {renderModalContent()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {error && (
          <div style={{ 
            padding: '20px', 
            backgroundColor: 'rgba(255, 71, 87, 0.1)', 
            borderLeft: '4px solid #ff4757',
            borderRadius: '8px',
            color: '#f0e68c',
            marginTop: '20px'
          }}>
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
};

// Wrap component with Error Boundary
const DashboardWithErrorBoundary = () => (
  <ErrorBoundary>
    <AdminDashboard />
  </ErrorBoundary>
);

export default DashboardWithErrorBoundary;