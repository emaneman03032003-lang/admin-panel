import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import '../styles/adminPages.css';
import '../styles/categoryManagement.css';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    description: '',
    status: 'active',
    subcategories: []
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const resp = await adminAPI.categories.getAll();
      if (resp && resp.success) {
        const list = resp.data || resp.categories || [];
        setCategories(Array.isArray(list) ? list : []);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubcategoryChange = (index, field, value) => {
    const newSubcats = [...formData.subcategories];
    newSubcats[index] = { ...newSubcats[index], [field]: value };
    setFormData(prev => ({ ...prev, subcategories: newSubcats }));
  };

  const addSubcategoryField = () => {
    setFormData(prev => ({
      ...prev,
      subcategories: [...prev.subcategories, { name: '', description: '' }]
    }));
  };

  const removeSubcategoryField = (index) => {
    setFormData(prev => ({
      ...prev,
      subcategories: prev.subcategories.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('❌ Category name is required');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        image: formData.image,
        description: formData.description,
        status: formData.status,
        subcategories: formData.subcategories.filter(s => s.name && s.name.trim())
      };

      if (editingId) {
        const resp = await adminAPI.categories.update(editingId, payload);
        if (resp.success) {
          alert('✅ Category updated successfully');
          resetForm();
          setShowForm(false);
          fetchCategories();
        } else {
          alert('❌ Failed to update: ' + (resp.error || resp.message));
        }
      } else {
        const resp = await adminAPI.categories.add(payload);
        if (resp.success) {
          alert('✅ Category created successfully');
          resetForm();
          setShowForm(false);
          fetchCategories();
        } else {
          alert('❌ Failed to create: ' + (resp.error || resp.message));
        }
      }
    } catch (err) {
      console.error('Error saving category:', err);
      alert('❌ Error: ' + err.message);
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      image: category.image || '',
      description: category.description || '',
      status: category.status,
      subcategories: category.subcategories || []
    });
    setEditingId(category._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const resp = await adminAPI.categories.delete(id);
      if (resp.success) {
        alert('✅ Category deleted');
        fetchCategories();
      } else {
        alert('❌ Delete failed: ' + (resp.error || resp.message));
      }
    } catch (err) {
      console.error('Delete category error', err);
      alert('❌ Error deleting category');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      image: '',
      description: '',
      status: 'active',
      subcategories: []
    });
    setEditingId(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>🏷️ Category Management</h1>
          <p className="page-subtitle">Manage categories and subcategories</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm) resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? '✕ Cancel' : '➕ Add New Category'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="form-container card">
          <h2>{editingId ? '✏️ Edit Category' : '➕ Add New Category'}</h2>
          <form onSubmit={handleSubmit} className="category-form">
            <div className="form-section">
              <h3>Basic Information</h3>

              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Electronics"
                  value={formData.name}
                  onChange={handleInput}
                  required
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  name="image"
                  placeholder="https://..."
                  value={formData.image}
                  onChange={handleInput}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Brief description..."
                  value={formData.description}
                  onChange={handleInput}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleInput}>
                  <option value="active">🟢 Active</option>
                  <option value="inactive">🔴 Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-section">
              <div className="section-header">
                <h3>Subcategories</h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addSubcategoryField}
                >
                  + Add Subcategory
                </button>
              </div>

              <div className="subcategories-list">
                {formData.subcategories.length === 0 ? (
                  <p className="empty-text">No subcategories yet. Click "Add Subcategory" to start.</p>
                ) : (
                  formData.subcategories.map((subcat, index) => (
                    <div key={index} className="subcategory-item">
                      <div className="subcat-fields">
                        <input
                          type="text"
                          placeholder="Subcategory name"
                          value={subcat.name || ''}
                          onChange={(e) => handleSubcategoryChange(index, 'name', e.target.value)}
                          className="subcat-input"
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={subcat.description || ''}
                          onChange={(e) => handleSubcategoryChange(index, 'description', e.target.value)}
                          className="subcat-input"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-remove-subcat"
                        onClick={() => removeSubcategoryField(index)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingId ? '💾 Update Category' : '➕ Create Category'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="categories-container">
        <h2>All Categories ({categories.length})</h2>
        {loading ? (
          <div className="loading-container">
            <p>Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="empty-state card">
            <p>No categories yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="categories-list">
            {categories.map(category => (
              <div key={category._id} className="category-item card">
                <div className="category-header">
                  <div className="category-info">
                    {category.image && (
                      <img src={category.image} alt={category.name} className="category-thumb" />
                    )}
                    <div className="category-details">
                      <h3>{category.name}</h3>
                      <p className="category-desc">{category.description || 'No description'}</p>
                      <div className="category-meta">
                        <span className={`status ${category.status}`}>
                          {category.status === 'active' ? '🟢' : '🔴'} {category.status}
                        </span>
                        <span className="subcat-count">
                          📂 {category.subcategories?.length || 0} subcategories
                        </span>
                        <span className="date">
                          📅 {new Date(category.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(category.subcategories?.length || 0) > 0 && (
                    <button
                      type="button"
                      className="btn-expand"
                      onClick={() => setExpandedId(expandedId === category._id ? null : category._id)}
                    >
                      {expandedId === category._id ? '▼' : '▶'}
                    </button>
                  )}
                </div>

                {expandedId === category._id && category.subcategories && category.subcategories.length > 0 && (
                  <div className="subcategories-expanded">
                    <h4>Subcategories:</h4>
                    {category.subcategories.map(subcat => (
                      <div key={subcat._id || subcat.name} className="subcat-item-display">
                        <strong>{subcat.name}</strong>
                        {subcat.description && <p>{subcat.description}</p>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="category-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(category)}
                    title="Edit category"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(category._id)}
                    title="Delete category"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
