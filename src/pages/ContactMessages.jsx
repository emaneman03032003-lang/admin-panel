import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import './ContactMessages.css';

export default function ContactMessages() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.contacts.getAll();
      if (res && res.success === false) {
        setContacts([]);
      } else {
        setContacts(res.contacts || res.data || []);
      }
    } catch (err) {
      console.error('Fetch contacts error', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, current) => {
    const newStatus = current === 'read' ? 'unread' : 'read';
    try {
      await adminAPI.contacts.updateStatus(id, newStatus);
      setSuccess('Status updated');
      setTimeout(() => setSuccess(''), 2000);
      await fetchContacts();
    } catch (err) {
      console.error('Update status error', err);
      setError('Unable to update status');
    }
  };

  const openMessage = (contact) => {
    setSelected(contact);
    if (contact.status !== 'read') {
      // mark read when opening
      adminAPI.contacts.updateStatus(contact._id || contact.id, 'read').then(fetchContacts).catch(e => console.error(e));
    }
  };

  const closeModal = () => setSelected(null);

  const deleteMessage = async (id) => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    try {
      const res = await adminAPI.contacts.delete(id);
      if (res && res.success) {
        setSuccess('Message deleted');
        setTimeout(() => setSuccess(''), 2000);
        await fetchContacts();
        closeModal();
      } else {
        throw new Error(res?.error || 'Delete failed');
      }
    } catch (err) {
      console.error('Delete error', err);
      setError('Failed to delete message');
    }
  };

  return (
    <div className="admin-page contacts-page">
      <div className="page-header">
        <div>
          <h1>📧 Contact Messages</h1>
          <p className="page-subtitle">View messages submitted via Contact Us form</p>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <p className="loading">Loading messages...</p>
      ) : contacts.length === 0 ? (
        <p className="empty-message">No contact messages found.</p>
      ) : (
        <div className="contacts-table card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Message</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c._id || c.id} className={c.status === 'unread' ? 'unread' : ''} onClick={() => openMessage(c)} style={{ cursor: 'pointer' }}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.subject || '—'}</td>
                  <td className="message-cell">{c.message?.slice(0, 120)}{(c.message || '').length > 120 ? '…' : ''}</td>
                  <td>{new Date(c.createdAt || c.createdAt).toLocaleString()}</td>
                  <td>{c.status || 'unread'}</td>
                  <td>
                    <button className="btn" onClick={(e) => { e.stopPropagation(); toggleStatus(c._id || c.id, c.status || 'unread'); }}>
                      {c.status === 'read' ? 'Mark Unread' : 'Mark Read'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {success && <div className="global-success-message"><span>{success}</span><button className="close-msg" onClick={() => setSuccess('')}>✕</button></div>}

      {selected && (
        <div className="contact-modal-overlay" onClick={closeModal}>
          <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected.subject || 'Message'}</h2>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>Name:</strong> {selected.name}</p>
              <p><strong>Email:</strong> {selected.email}</p>
              <p><strong>Date:</strong> {new Date(selected.createdAt || selected.createdAt).toLocaleString()}</p>
              <hr />
              <div className="modal-message">{selected.message}</div>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => deleteMessage(selected._id || selected.id)}>Delete</button>
              <button className="btn" onClick={() => { toggleStatus(selected._id || selected.id, selected.status || 'unread'); }}>Toggle Read</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
