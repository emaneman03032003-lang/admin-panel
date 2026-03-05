import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../services/api';
import '../styles/adminPages.css';
import '../styles/analyticsPages.css';

function AnalyticsPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]); // from Category collection
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  
  // Refs for auto-scroll
  const productsRef = useRef(null);
  const ordersRef = useRef(null);
  const pendingRef = useRef(null);
  const revenueRef = useRef(null);
  const inventoryRef = useRef(null);
  const stockRef = useRef(null);
  const avgPriceRef = useRef(null);
  const categoriesRef = useRef(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Auto-scroll to metric section when selected
  useEffect(() => {
    const refMap = {
      'products': productsRef,
      'orders': ordersRef,
      'pending': pendingRef,
      'revenue': revenueRef,
      'inventory': inventoryRef,
      'stock': stockRef,
      'avgPrice': avgPriceRef,
      'categories': categoriesRef
    };

    if (selectedMetric && refMap[selectedMetric].current) {
      setTimeout(() => {
        refMap[selectedMetric].current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }, 150);
    }
  }, [selectedMetric]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Fetch products
      const productResponse = await adminAPI.products.getAll();
      const productsList = Array.isArray(productResponse) ? productResponse : (productResponse.products || productResponse.data || []);
      setProducts(productsList);

      // Fetch category stats (uses countDocuments in controller)
      try {
        const catResp = await adminAPI.categories.getAll();
        if (catResp && Array.isArray(catResp.categories)) {
          setCategoryStats(catResp.categories);
        }
      } catch (err) {
        console.warn('Failed to fetch category stats:', err);
        setCategoryStats([]);
      }

      // Fetch orders
      try {
        const orderResponse = await adminAPI.orders.getAll();
        const ordersList = Array.isArray(orderResponse) ? orderResponse : (orderResponse.orders || orderResponse.data || []);
        setOrders(ordersList);
      } catch (error) {
        console.log('Orders data not available:', error);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const featuredCount = products.filter(p => p.isFeatured).length;
  const newCount = products.filter(p => p.isNewArrival).length;
  const usedCount = products.filter(p => p.isUsed).length;
  const avgPrice = totalProducts > 0 ? (products.reduce((sum, p) => sum + p.price, 0) / totalProducts).toFixed(2) : 0;

  // Order statistics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'Pending').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || o.total || 0), 0);

  // Get category breakdown (use precomputed stats if available)
  let categories = {};
  if (categoryStats && categoryStats.length > 0) {
    categoryStats.forEach(c => {
      categories[c.name] = c.productCount || 0;
    });
  } else {
    products.forEach(p => {
      if (p.category) {
        categories[p.category] = (categories[p.category] || 0) + 1;
      }
    });
  }

  // Get top products by value
  const topProducts = [...products]
    .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
    .slice(0, 5);

  // Get low stock products
  const lowStockProducts = products
    .filter(p => p.stock < 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  const openMetric = (metric) => {
    setSelectedMetric(metric);
    setExpandedItem(null);
    document.body.classList.add('modal-open');
  };

  const closeMetric = () => {
    setSelectedMetric(null);
    setExpandedItem(null);
    document.body.classList.remove('modal-open');
  };

  const toggleExpanded = (id) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="container">
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1>📊 Analytics Dashboard</h1>
          <p className="page-subtitle">Real-time business metrics and insights</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div 
          className={`metric-card card ${selectedMetric === 'products' ? 'active' : ''}`}
          onClick={() => setSelectedMetric(selectedMetric === 'products' ? null : 'products')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-icon">📦</div>
          <h3>Total Products</h3>
          <p className="metric-value">{totalProducts}</p>
          <p className="metric-label">Items in catalog</p>
        </div>

        <div 
          className={`metric-card card ${selectedMetric === 'orders' ? 'active' : ''}`}
          onClick={() => setSelectedMetric(selectedMetric === 'orders' ? null : 'orders')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-icon">📋</div>
          <h3>Total Orders</h3>
          <p className="metric-value">{totalOrders}</p>
          <p className="metric-label">All orders</p>
        </div>

        <div 
          className={`metric-card card ${selectedMetric === 'pending' ? 'active' : ''}`}
          onClick={() => setSelectedMetric(selectedMetric === 'pending' ? null : 'pending')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-icon">⏳</div>
          <h3>Pending Orders</h3>
          <p className="metric-value">{pendingOrders}</p>
          <p className="metric-label">Awaiting processing</p>
        </div>

        <div 
          className={`metric-card card ${selectedMetric === 'revenue' ? 'active' : ''}`}
          onClick={() => setSelectedMetric(selectedMetric === 'revenue' ? null : 'revenue')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-icon">💹</div>
          <h3>Total Revenue</h3>
          <p className="metric-value">Rs. {totalRevenue.toLocaleString()}</p>
          <p className="metric-label">From all orders</p>
        </div>

        <div 
          className={`metric-card card ${selectedMetric === 'inventory' ? 'active' : ''}`}
          onClick={() => setSelectedMetric(selectedMetric === 'inventory' ? null : 'inventory')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-icon">💰</div>
          <h3>Inventory Value</h3>
          <p className="metric-value">Rs. {totalValue.toLocaleString()}</p>
          <p className="metric-label">Total stock worth</p>
        </div>

        <div 
          className={`metric-card card ${selectedMetric === 'stock' ? 'active' : ''}`}
          onClick={() => setSelectedMetric(selectedMetric === 'stock' ? null : 'stock')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-icon">📈</div>
          <h3>Total Stock</h3>
          <p className="metric-value">{totalStock}</p>
          <p className="metric-label">Units available</p>
        </div>

        <div 
          className={`metric-card card ${selectedMetric === 'avgPrice' ? 'active' : ''}`}
          onClick={() => setSelectedMetric(selectedMetric === 'avgPrice' ? null : 'avgPrice')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-icon">💵</div>
          <h3>Avg Price</h3>
          <p className="metric-value">Rs. {avgPrice}</p>
          <p className="metric-label">Average product price</p>
        </div>

        <div 
          className={`metric-card card ${selectedMetric === 'categories' ? 'active' : ''}`}
          onClick={() => setSelectedMetric(selectedMetric === 'categories' ? null : 'categories')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-icon">🎯</div>
          <h3>Categories</h3>
          <p className="metric-value">{Object.keys(categories).length}</p>
          <p className="metric-label">Product categories</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="analytics-section">
        <h2>📂 Products by Category</h2>
        <div className="category-breakdown card">
          {Object.entries(categories).map(([category, count]) => {
            const percentage = ((count / totalProducts) * 100).toFixed(1);
            return (
              <div key={category} className="category-item">
                <div className="category-info">
                  <span className="category-name">{category}</span>
                  <span className="category-count">{count} products</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                </div>
                <span className="category-percentage">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Details Section */}
      {selectedMetric === 'products' && (
        <div className="analytics-section" ref={productsRef}>
          <h2>📦 All Products</h2>
          <div className="products-list card">
            {products.length > 0 ? (
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="table-row">
                      <td className="product-name">{product.name}</td>
                      <td>{product.category}</td>
                      <td className="price">Rs. {product.price.toFixed(2)}</td>
                      <td className="stock">
                        <span className={`stock-badge ${product.stock > 20 ? 'high' : 'medium'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="value">Rs. {(product.price * product.stock).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No products found</p>
            )}
          </div>
        </div>
      )}

      {selectedMetric === 'orders' && (
        <div className="analytics-section" ref={ordersRef}>
          <h2>📋 All Orders</h2>
          <div className="products-list card">
            {orders.length > 0 ? (
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="table-row">
                      <td className="product-name">#{order.id}</td>
                      <td>{order.customerName || order.name || 'N/A'}</td>
                      <td className="price">Rs. {(order.totalPrice || order.total || 0).toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${order.status?.toLowerCase()}`}>
                          {order.status || 'pending'}
                        </span>
                      </td>
                      <td>{order.date || order.createdAt ? new Date(order.date || order.createdAt).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No orders found</p>
            )}
          </div>
        </div>
      )}

      {selectedMetric === 'pending' && (
        <div className="analytics-section" ref={pendingRef}>
          <h2>⏳ Pending Orders</h2>
          <div className="products-list card">
            {orders.filter(o => o.status === 'pending' || o.status === 'Pending').length > 0 ? (
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.filter(o => o.status === 'pending' || o.status === 'Pending').map((order) => (
                    <tr key={order.id} className="table-row">
                      <td className="product-name">#{order.id}</td>
                      <td>{order.customerName || order.name || 'N/A'}</td>
                      <td className="price">Rs. {(order.totalPrice || order.total || 0).toLocaleString()}</td>
                      <td>{order.date || order.createdAt ? new Date(order.date || order.createdAt).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No pending orders</p>
            )}
          </div>
        </div>
      )}

      {selectedMetric === 'revenue' && (
        <div className="analytics-section" ref={revenueRef}>
          <h2>💹 Revenue Details</h2>
          <div className="products-list card">
            {orders.length > 0 ? (
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Revenue</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="table-row">
                      <td className="product-name">#{order.id}</td>
                      <td>{order.customerName || order.name || 'N/A'}</td>
                      <td className="value text-gold">Rs. {(order.totalPrice || order.total || 0).toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${order.status?.toLowerCase()}`}>
                          {order.status || 'pending'}
                        </span>
                      </td>
                      <td>{order.date || order.createdAt ? new Date(order.date || order.createdAt).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No revenue data</p>
            )}
          </div>
        </div>
      )}

      {selectedMetric === 'inventory' && (
        <div className="analytics-section" ref={inventoryRef}>
          <h2>💰 Inventory Value Breakdown</h2>
          <div className="inventory-summary card">
            <div className="inventory-stat">
              <span className="stat-label">Total Inventory Value:</span>
              <span className="stat-value">Rs. {totalValue.toLocaleString()}</span>
            </div>
            <div className="inventory-stat">
              <span className="stat-label">Total Units in Stock:</span>
              <span className="stat-value">{totalStock}</span>
            </div>
            <div className="inventory-stat">
              <span className="stat-label">Average Product Value:</span>
              <span className="stat-value">Rs. {(totalValue / (totalProducts || 1)).toFixed(2)}</span>
            </div>
          </div>
          <div className="products-list card">
            {products.length > 0 ? (
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price (per unit)</th>
                    <th>Stock</th>
                    <th>Total Value</th>
                    <th>% of Inventory</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
                    .map((product) => {
                      const productValue = product.price * product.stock;
                      const percentage = ((productValue / (totalValue || 1)) * 100).toFixed(2);
                      return (
                        <tr key={product.id} className="table-row">
                          <td className="product-name">{product.name}</td>
                          <td>{product.category}</td>
                          <td className="price">Rs. {product.price.toFixed(2)}</td>
                          <td className="stock">
                            <span className={`stock-badge ${product.stock > 20 ? 'high' : product.stock > 10 ? 'medium' : 'low'}`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="value text-gold">Rs. {productValue.toLocaleString()}</td>
                          <td className="percentage">{percentage}%</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No products in inventory</p>
            )}
          </div>
        </div>
      )}

      {selectedMetric === 'stock' && (
        <div className="analytics-section" ref={stockRef}>
          <h2>📈 Stock Inventory Details</h2>
          <div className="stock-summary card">
            <div className="stock-stat">
              <span className="stat-label">Total Units in Stock:</span>
              <span className="stat-value">{totalStock}</span>
            </div>
            <div className="stock-stat">
              <span className="stat-label">Total Products:</span>
              <span className="stat-value">{totalProducts}</span>
            </div>
            <div className="stock-stat">
              <span className="stat-label">Average Stock per Product:</span>
              <span className="stat-value">{(totalStock / (totalProducts || 1)).toFixed(1)}</span>
            </div>
            <div className="stock-stat">
              <span className="stat-label">Low Stock Products (&lt; 10 units):</span>
              <span className="stat-value stat-warning">{lowStockProducts.length}</span>
            </div>
          </div>
          
          {/* Line-by-line product stock list */}
          <div className="stock-list card">
            <h3 style={{ marginTop: 0, color: '#d4af37', marginBottom: '25px' }}>All Products Stock Level</h3>
            {products.length > 0 ? (
              <div className="product-stock-lines">
                {products
                  .sort((a, b) => a.stock - b.stock)
                  .map((product, index) => {
                    const productValue = product.price * product.stock;
                    let stockStatus = 'High';
                    let statusColor = '#51cf66';
                    if (product.stock < 5) {
                      stockStatus = 'Critical';
                      statusColor = '#ff6b6b';
                    } else if (product.stock < 10) {
                      stockStatus = 'Low';
                      statusColor = '#ffa500';
                    } else if (product.stock < 20) {
                      stockStatus = 'Medium';
                      statusColor = '#4ecdc4';
                    }
                    
                    return (
                      <div key={product.id} className="product-stock-line">
                        <div className="line-number">{index + 1}</div>
                        <div className="line-content">
                          <div className="product-info">
                            <div className="product-header">
                              <h4 className="product-title">{product.name}</h4>
                              <span className="product-category">{product.category}</span>
                            </div>
                          </div>
                          <div className="stock-details">
                            <div className="detail-item">
                              <span className="detail-label">Stock:</span>
                              <span className={`stock-badge ${product.stock > 20 ? 'high' : product.stock > 10 ? 'medium' : product.stock > 5 ? 'low' : 'critical'}`}>
                                {product.stock} units
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Status:</span>
                              <span className="status-label" style={{ backgroundColor: statusColor }}>
                                {stockStatus}
                              </span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Price:</span>
                              <span className="price-value">Rs. {product.price.toFixed(2)}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Total Value:</span>
                              <span className="value-highlight">Rs. {productValue.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="stock-bar">
                          <div className="bar-fill" style={{ width: `${Math.min((product.stock / 50) * 100, 100)}%`, backgroundColor: statusColor }}></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="no-data">No products in stock</p>
            )}
          </div>
        </div>
      )}

      {selectedMetric === 'avgPrice' && (
        <div className="analytics-section" ref={avgPriceRef}>
          <h2>💵 Average Price Analysis</h2>
          <div className="price-summary card">
            <div className="price-stat">
              <span className="stat-label">Average Product Price:</span>
              <span className="stat-value text-gold">Rs. {avgPrice}</span>
            </div>
            <div className="price-stat">
              <span className="stat-label">Total Products:</span>
              <span className="stat-value">{totalProducts}</span>
            </div>
            <div className="price-stat">
              <span className="stat-label">Highest Price:</span>
              <span className="stat-value text-gold">Rs. {Math.max(...products.map(p => p.price)).toFixed(2)}</span>
            </div>
            <div className="price-stat">
              <span className="stat-label">Lowest Price:</span>
              <span className="stat-value text-gold">Rs. {Math.min(...products.map(p => p.price)).toFixed(2)}</span>
            </div>
          </div>

          {/* All Products by Price */}
          <div className="products-list card">
            <h3 style={{ marginTop: 0, color: '#d4af37', marginBottom: '25px' }}>All Products (Sorted by Price)</h3>
            {products.length > 0 ? (
              <div className="product-price-lines">
                {products
                  .sort((a, b) => b.price - a.price)
                  .map((product, index) => (
                    <div 
                      key={product.id} 
                      className={`product-line expandable-item ${expandedItem === product.id ? 'expanded' : ''}`}
                      onClick={() => toggleExpanded(product.id)}
                    >
                      <div className="line-number">{index + 1}</div>
                      <div className="line-content">
                        <div className="product-info">
                          <div className="product-header">
                            <h4 className="product-title">{product.name}</h4>
                            <span className="product-category">{product.category}</span>
                          </div>
                          <p className="product-sku">SKU: {product.sku || 'N/A'}</p>
                        </div>
                        <div className="price-details">
                          <div className="detail-item">
                            <span className="detail-label">Price:</span>
                            <span className="price-value text-gold">Rs. {product.price.toFixed(2)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Stock:</span>
                            <span className={`stock-badge ${product.stock > 20 ? 'high' : product.stock > 10 ? 'medium' : product.stock > 5 ? 'low' : 'critical'}`}>
                              {product.stock} units
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Total Value:</span>
                            <span className="value-highlight">Rs. {(product.price * product.stock).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="expand-toggle">
                        <span>{expandedItem === product.id ? '−' : '+'}</span>
                      </div>
                      {expandedItem === product.id && (
                        <div className="expanded-details">
                          <div className="detail-row">
                            <span className="detail-key">Description:</span>
                            <span className="detail-val">{product.description || 'No description'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">Stock Status:</span>
                            <span className="detail-val">
                              {product.stock > 20 ? 'High Stock' : product.stock > 10 ? 'Medium Stock' : product.stock > 5 ? 'Low Stock' : 'Critical Stock'}
                            </span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">Featured:</span>
                            <span className="detail-val">{product.isFeatured ? 'Yes ✓' : 'No'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-key">New Arrival:</span>
                            <span className="detail-val">{product.isNewArrival ? 'Yes ✓' : 'No'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="no-data">No products found</p>
            )}
          </div>
        </div>
      )}

      {selectedMetric === 'categories' && (
        <div className="analytics-section" ref={categoriesRef}>
          <h2>🎯 Category Analysis</h2>
          <div className="category-summary card">
            <div className="category-stat">
              <span className="stat-label">Total Categories:</span>
              <span className="stat-value">{Object.keys(categories).length}</span>
            </div>
            <div className="category-stat">
              <span className="stat-label">Total Products:</span>
              <span className="stat-value">{totalProducts}</span>
            </div>
            <div className="category-stat">
              <span className="stat-label">Average Products per Category:</span>
              <span className="stat-value">{(totalProducts / (Object.keys(categories).length || 1)).toFixed(1)}</span>
            </div>
            <div className="category-stat">
              <span className="stat-label">Largest Category:</span>
              <span className="stat-value">
                {Object.entries(categories).length > 0 
                  ? Object.entries(categories).sort((a, b) => b[1] - a[1])[0][0]
                  : 'N/A'
                }
              </span>
            </div>
          </div>

          {/* Categories with expandable products */}
          <div className="categories-list card">
            <h3 style={{ marginTop: 0, color: '#d4af37', marginBottom: '25px' }}>Categories & Products</h3>
            {Object.keys(categories).length > 0 ? (
              <div className="category-items">
                {Object.entries(categories)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, count]) => {
                    const categoryProducts = products.filter(p => p.category === category);
                    const percentage = ((count / totalProducts) * 100).toFixed(1);
                    const categoryValue = categoryProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);

                    return (
                      <div 
                        key={category} 
                        className={`category-line expandable-item ${expandedItem === category ? 'expanded' : ''}`}
                        onClick={() => toggleExpanded(category)}
                      >
                        <div className="category-header">
                          <div className="header-info">
                            <span className="category-name">{category}</span>
                            <span className="category-count">{count} products</span>
                          </div>
                          <div className="header-stats">
                            <div className="stat-badge">
                              <span className="stat-label">Inventory:</span>
                              <span className="stat-val text-gold">Rs. {categoryValue.toLocaleString()}</span>
                            </div>
                            <div className="stat-badge">
                              <span className="stat-label">Percentage:</span>
                              <span className="stat-val">{percentage}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="expand-toggle">
                          <span>{expandedItem === category ? '−' : '+'}</span>
                        </div>

                        {expandedItem === category && (
                          <div className="expanded-products">
                            <div className="products-in-category">
                              {categoryProducts.map((product, idx) => (
                                <div key={product.id} className="category-product-item">
                                  <div className="prod-num">{idx + 1}</div>
                                  <div className="prod-info">
                                    <h5 className="prod-name">{product.name}</h5>
                                    <p className="prod-sku">SKU: {product.sku || 'N/A'}</p>
                                  </div>
                                  <div className="prod-stats">
                                    <div className="prod-stat">
                                      <span className="label">Price:</span>
                                      <span className="value text-gold">Rs. {product.price.toFixed(2)}</span>
                                    </div>
                                    <div className="prod-stat">
                                      <span className="label">Stock:</span>
                                      <span className={`badge ${product.stock > 20 ? 'high' : product.stock > 10 ? 'medium' : 'low'}`}>
                                        {product.stock}
                                      </span>
                                    </div>
                                    <div className="prod-stat">
                                      <span className="label">Value:</span>
                                      <span className="value">Rs. {(product.price * product.stock).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="no-data">No categories found</p>
            )}
          </div>
        </div>
      )}

      {/* Top Products */}
      <div className="analytics-section">
        <h2>🏆 Top Products by Value</h2>
        <div className="products-list card">
          {topProducts.length > 0 ? (
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, idx) => (
                  <tr key={product.id} className="table-row">
                    <td className="product-name">
                      <span className="rank">#{idx + 1}</span>
                      {product.name}
                    </td>
                    <td>{product.category}</td>
                    <td className="price">Rs. {product.price.toFixed(2)}</td>
                    <td className="stock">
                      <span className={`stock-badge ${product.stock > 20 ? 'high' : 'medium'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="value text-gold">
                      Rs. {(product.price * product.stock).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No products found</p>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="analytics-section">
          <h2>⚠️ Low Stock Alert</h2>
          <div className="low-stock-list card">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="low-stock-item">
                <div className="stock-info">
                  <h4>{product.name}</h4>
                  <p className="stock-warning">Only {product.stock} units remaining</p>
                </div>
                <div className="stock-gauge">
                  <div className="gauge-fill" style={{ height: `${(product.stock / 10) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
