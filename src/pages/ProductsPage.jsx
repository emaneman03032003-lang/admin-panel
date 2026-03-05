import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import '../styles/adminPages.css';
import '../styles/productManagement.css';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // load category list dynamically for dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const resp = await adminAPI.categories.getAll();
        if (resp && resp.success && Array.isArray(resp.categories)) {
          // keep only active categories for product form
          const activeCategories = resp.categories.filter(c => c.status === 'active');
          setCategories(activeCategories);
        }
      } catch (err) {
        console.error('Failed to load categories:', err.message);
      }
    };
    loadCategories();
  }, [showForm]);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState(['']);
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    price: '',
    originalPrice: '',
    stock: '',
    shortDescription: '',
    fullDescription: '',
    images: [],
    isFeatured: false,
    isNewArrival: false,
    isUsed: false,
    isFood: false
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.products.getAll();
      
      if (response && (response.success || Array.isArray(response))) {
        const productsList = Array.isArray(response) ? response : (response.products || response.data || []);
        setProducts(productsList);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'category') {
      const selected = categories.find(c => c.name === value);
      setSelectedCategory(selected || null);
      setFormData(prev => ({
        ...prev,
        category: value,
        subcategory: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageUrlChange = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const removeImageUrl = (index) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageUrls(prev => [...prev, event.target.result]);
        };
        reader.readAsDataURL(file);
      } else {
        alert(`❌ ${file.name} is not a valid image file`);
      }
    });
    e.target.value = ''; // Reset input
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.price || !formData.stock || !formData.fullDescription) {
      alert('❌ Please fill all required fields (marked with *)');
      return;
    }

    try {
      const validImages = imageUrls.filter(url => url.trim() !== '');
      
      if (validImages.length === 0) {
        alert('❌ Please add at least one product image URL');
        return;
      }

      if (formData.fullDescription.length < 10) {
        alert('❌ Description must be at least 10 characters');
        return;
      }

      const productData = {
        name: formData.name,
        category: formData.category,
        subcategory: formData.subcategory || '',
        price: parseFloat(formData.price),
        originalPrice: parseFloat(formData.originalPrice || formData.price),
        stock: parseInt(formData.stock),
        description: formData.fullDescription,
        shortDescription: formData.shortDescription,
        images: validImages,
        isFeatured: formData.isFeatured,
        isNewArrival: formData.isNewArrival,
        isUsed: formData.isUsed,
        isFood: formData.isFood
      };

      if (editingId) {
        await adminAPI.products.update(editingId, productData);
        const updatedProducts = products.map(p => p.id === editingId ? { ...p, ...productData } : p);
        setProducts(updatedProducts);
        alert('✅ Product updated successfully!');
        // 🔄 Clear frontend cache
        localStorage.removeItem('products');
      } else {
        const response = await adminAPI.products.add(productData);
        const newProduct = response.product || { id: Date.now(), ...productData };
        setProducts([...products, newProduct]);
        alert('✅ Product added successfully!');
        // 🔄 Clear frontend cache so it fetches fresh data
        localStorage.removeItem('products');
      }

      resetForm();
      setShowForm(false);
    } catch (error) {
      // Provide specific error message
      let userMessage = error.message;
      if (error.message.includes('Failed to fetch')) {
        userMessage = 'Network error: Cannot connect to backend. Make sure backend server is running on port 5001';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        userMessage = 'Authentication failed. Please login again.';
      } else if (error.message.includes('validation') || error.message.includes('required')) {
        userMessage = error.message;
      }
      
      alert('❌ Failed to add product:\n' + userMessage);
    }
  };

  const handleEditProduct = async (product) => {
    // Ensure categories are available before resolving selectedCategory
    let cats = categories;
    if (!cats || cats.length === 0) {
      try {
        const resp = await adminAPI.categories.getAll();
        if (resp && resp.success && Array.isArray(resp.categories)) {
          const activeCategories = resp.categories.filter(c => c.status === 'active');
          setCategories(activeCategories);
          cats = activeCategories;
        }
      } catch (err) {
        console.error('Failed to load categories for edit:', err.message);
      }
    }

    const categoryObj = cats.find(c => c.name === product.category);
    setSelectedCategory(categoryObj || null);

    setFormData({
      name: product.name,
      category: product.category,
      subcategory: product.subcategory || '',
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      shortDescription: product.shortDescription,
      fullDescription: product.fullDescription,
      images: product.images,
      isFeatured: product.isFeatured,
      isNewArrival: product.isNewArrival,
      isUsed: product.isUsed,
      isFood: product.isFood || false
    });
    setImageUrls(product.images || []);
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await adminAPI.products.delete(productId);
        const updatedProducts = products.filter(p => p.id !== productId);
        setProducts(updatedProducts);
        alert('✅ Product deleted successfully!');
        // 🔄 Clear frontend cache so it fetches fresh data
        localStorage.removeItem('products');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('❌ Failed to delete product');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      subcategory: '',
      price: '',
      originalPrice: '',
      stock: '',
      shortDescription: '',
      fullDescription: '',
      images: [],
      isFeatured: false,
      isNewArrival: false,
      isUsed: false,
      isFood: false
    });
    setImageUrls(['']);
    setEditingId(null);
    setSelectedCategory(null);
  };

  const getBadges = (product) => {
    const badges = [];
    if (product.isFeatured) badges.push({ text: 'Featured Product', class: 'badge-featured' });
    if (product.isNewArrival) badges.push({ text: 'New Arrival', class: 'badge-new' });
    if (product.isUsed) badges.push({ text: 'Used', class: 'badge-used' });
    if (product.isFood) badges.push({ text: 'Food Product', class: 'badge-food' });
    return badges;
  };

  const getTotalRevenue = () => {
    return products.reduce((sum, p) => sum + (p.price * (10 - p.stock / 5)), 0).toFixed(0);
  };

  const filterProductsByBadge = (badgeType) => {
    if (!badgeType) return products;
    return products.filter(product => {
      if (badgeType === 'featured') return product.isFeatured;
      if (badgeType === 'new') return product.isNewArrival;
      if (badgeType === 'used') return product.isUsed;
      if (badgeType === 'food') return product.isFood;
      return true;
    });
  };

  const filteredProducts = filterProductsByBadge(selectedBadgeFilter);

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>📦 Product Management</h1>
          <p className="page-subtitle">Manage your products, pricing, and inventory</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            if (showForm) resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? '✕ Cancel' : '➕ Add New Product'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="form-container card">
          <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
          <form onSubmit={handleAddProduct} className="product-form">
            <div className="form-section">
              <h3>Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                {selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                  <div className="form-group">
                    <label>Subcategory</label>
                    <select
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleInputChange}
                    >
                      <option value="">Select subcategory (optional)</option>
                      {selectedCategory.subcategories.map((subcat, idx) => (
                        <option key={subcat._id || idx} value={subcat.name}>{subcat.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3>Pricing & Stock</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (PKR) *</label>
                  <input
                    type="number"
                    name="price"
                    placeholder="Current selling price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Original Price</label>
                  <input
                    type="number"
                    name="originalPrice"
                    placeholder="Original/MRP (for discount display)"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    name="stock"
                    placeholder="Available quantity"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Descriptions</h3>
              <div className="form-group">
                <label>Short Description</label>
                <input
                  type="text"
                  name="shortDescription"
                  placeholder="Brief one-line description (e.g., Premium leather watch)"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Full Description</label>
                <textarea
                  name="fullDescription"
                  placeholder="Detailed product description with features, specifications, etc."
                  value={formData.fullDescription}
                  onChange={handleInputChange}
                  rows="4"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Product Images</h3>
              <div className="image-upload-section">
                <div className="upload-options">
                  <div className="upload-option">
                    <label htmlFor="file-input" className="file-label">📁 Choose Local Files</label>
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="file-input"
                    />
                    <p className="upload-hint">Select one or more image files from your computer</p>
                  </div>
                </div>
              </div>

              <div className="image-urls-section">
                <h4>Image URLs or Uploads</h4>
                {imageUrls.map((url, index) => (
                  <div key={index} className="image-url-input">
                    <input
                      type="url"
                      placeholder={`Image URL ${index + 1}`}
                      value={url}
                      onChange={(e) => handleImageUrlChange(index, e.target.value)}
                    />
                    {imageUrls.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeImageUrl(index)}
                      >
                        ✕
                      </button>
                    )}
                    {url && (
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="image-preview-thumb"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addImageUrl}
              >
                + Add Another Image URL
              </button>
            </div>

            <div className="form-section">
              <h3>Product Badges</h3>
              <div className="checkbox-group">
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="featured"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                  />
                
                  <label htmlFor="newArrival">🆕 New Product</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="used"
                    name="isUsed"
                    checked={formData.isUsed}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="used">♻️ Used Product</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="food"
                    name="isFood"
                    checked={formData.isFood}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="food">🍔 Food Product</label>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingId ? '💾 Update Product' : '➕ Add Product'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="loading-container">
          <p>Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <p>No products found. Add your first product to get started!</p>
        </div>
      ) : (
        <div className="products-container">
          <div className="badge-filter-section">
            <h3>Filter by Badge</h3>
            <div className="badge-filter-buttons">
              <button
                className={`filter-btn ${selectedBadgeFilter === null ? 'active' : ''}`}
                onClick={() => setSelectedBadgeFilter(null)}
              >
                All Products ({products.length})
              </button>
              <button
                className={`filter-btn badge-featured ${selectedBadgeFilter === 'featured' ? 'active' : ''}`}
                onClick={() => setSelectedBadgeFilter(selectedBadgeFilter === 'featured' ? null : 'featured')}
              >
                ⭐ Featured ({products.filter(p => p.isFeatured).length})
              </button>
              <button
                className={`filter-btn badge-new ${selectedBadgeFilter === 'new' ? 'active' : ''}`}
                onClick={() => setSelectedBadgeFilter(selectedBadgeFilter === 'new' ? null : 'new')}
              >
                🆕 New Arrival ({products.filter(p => p.isNewArrival).length})
              </button>
              <button
                className={`filter-btn badge-used ${selectedBadgeFilter === 'used' ? 'active' : ''}`}
                onClick={() => setSelectedBadgeFilter(selectedBadgeFilter === 'used' ? null : 'used')}
              >
                ♻️ Used ({products.filter(p => p.isUsed).length})
              </button>
              <button
                className={`filter-btn badge-food ${selectedBadgeFilter === 'food' ? 'active' : ''}`}
                onClick={() => setSelectedBadgeFilter(selectedBadgeFilter === 'food' ? null : 'food')}
              >
                🍔 Food ({products.filter(p => p.isFood).length})
              </button>
            </div>
            {selectedBadgeFilter && (
              <p className="filter-info">Showing {filteredProducts.length} product(s)</p>
            )}
          </div>

          <div className="products-stats">
            <div className="stat-mini card">
              <span>Total Products: <strong>{products.length}</strong></span>
            </div>
            <div className="stat-mini card">
              <span>Total Stock: <strong>{products.reduce((sum, p) => sum + p.stock, 0)}</strong></span>
            </div>
            <div className="stat-mini card">
              <span>Est. Revenue: <strong>Rs. {getTotalRevenue()}</strong></span>
            </div>
          </div>

          <div className="products-grid">
            {filteredProducts.length === 0 && selectedBadgeFilter ? (
              <div className="empty-state">
                <p>No products found with this badge.</p>
              </div>
            ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="product-card card">
                <div className="product-image-container">
                  <img 
                    src={product.images?.[0] || 'https://via.placeholder.com/300x300?text=No+Image'} 
                    alt={product.name}
                    className="product-image"
                  />
                  <div className="product-badges">
                    {getBadges(product).map((badge, idx) => (
                      <span key={idx} className={`badge ${badge.class}`}>
                        {badge.text}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="product-details">
                  <h3>{product.name}</h3>
                  <p className="product-category">
                    📂 {product.category}
                  </p>
                  {product.subcategory && (
                    <p className="product-subcategory">
                      ➤ {product.subcategory}
                    </p>
                  )}
                  <p className="product-short-desc">
                    {product.shortDescription}
                  </p>

                  <div className="product-pricing">
                    <span className="price">Rs. {product.price.toLocaleString()}</span>
                    {product.originalPrice > product.price && (
                      <span className="original-price">Rs. {product.originalPrice.toLocaleString()}</span>
                    )}
                  </div>

                  <div className="product-stock">
                    <span className={product.stock > 0 ? 'in-stock' : 'out-of-stock'}>
                      {product.stock > 0 ? `📦 ${product.stock} in stock` : '❌ Out of Stock'}
                    </span>
                  </div>

                  <div className="product-images-count">
                    📷 {product.images?.length || 0} image(s)
                  </div>
                </div>

                <div className="product-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => handleEditProduct(product)}
                    title="Edit product"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteProduct(product.id)}
                    title="Delete product"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
