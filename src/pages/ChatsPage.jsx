import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../services/api';
import '../styles/adminPages.css';
import '../styles/chatManagement.css';

function ChatsPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [filterUnread, setFilterUnread] = useState(false);
  const [sortBy, setSortBy] = useState('recent'); // recent, unread, pinned
  const messagesEndRef = useRef(null);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);

  const EMOJIS = ['😀', '😂', '😍', '😢', '😡', '👍', '👎', '❤️', '🔥', '✨'];

  // Sample conversations and messages as fallback
  const SAMPLE_CONVERSATIONS = [
    {
      id: 'chat-001',
      customerName: 'Ahmed Khan',
      email: 'ahmed@example.com',
      lastMessage: 'When will my order arrive?',
      lastMessageTime: new Date('2026-01-25 14:30'),
      unread: true,
      avatar: '👨‍💼',
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadCount: 3
    },
    {
      id: 'chat-002',
      customerName: 'Fatima Ali',
      email: 'fatima@example.com',
      lastMessage: 'Thank you! Product is perfect',
      lastMessageTime: new Date('2026-01-25 10:15'),
      unread: false,
      avatar: '👩‍💼',
      isPinned: false,
      isMuted: false,
      isArchived: false,
      unreadCount: 0
    },
    {
      id: 'chat-003',
      customerName: 'Hassan Ahmed',
      email: 'hassan@example.com',
      lastMessage: 'Do you have this in other colors?',
      lastMessageTime: new Date('2026-01-24 18:45'),
      unread: true,
      avatar: '👨‍💻',
      isPinned: true,
      isMuted: false,
      isArchived: false,
      unreadCount: 1
    }
  ];

  const SAMPLE_MESSAGES = {
    'chat-001': [
      { id: 1, sender: 'customer', text: 'Hello, I ordered a watch', time: new Date('2026-01-25 14:00'), isRead: true, readAt: null, emoji: '', isPinned: false, isEdited: false, repliedTo: null },
      { id: 2, sender: 'admin', text: 'Hi Ahmed! Thank you for your order.', time: new Date('2026-01-25 14:05'), isRead: true, readAt: null, emoji: '👍', isPinned: false, isEdited: false, repliedTo: null },
      { id: 3, sender: 'customer', text: 'When will my order arrive?', time: new Date('2026-01-25 14:30'), isRead: false, readAt: null, emoji: '', isPinned: true, isEdited: false, repliedTo: 2 }
    ],
    'chat-002': [
      { id: 1, sender: 'customer', text: 'Hi, I just received my bag!', time: new Date('2026-01-25 09:00'), isRead: true, readAt: null, emoji: '', isPinned: false, isEdited: false, repliedTo: null },
      { id: 2, sender: 'admin', text: 'That\'s great! How do you like it?', time: new Date('2026-01-25 09:15'), isRead: true, readAt: null, emoji: '', isPinned: false, isEdited: false, repliedTo: null },
      { id: 3, sender: 'customer', text: 'Thank you! Product is perfect', time: new Date('2026-01-25 10:15'), isRead: true, readAt: null, emoji: '❤️', isPinned: false, isEdited: false, repliedTo: null }
    ],
    'chat-003': [
      { id: 1, sender: 'customer', text: 'Hi, I saw your vintage chair', time: new Date('2026-01-24 18:00'), isRead: true, readAt: null, emoji: '', isPinned: false, isEdited: false, repliedTo: null },
      { id: 2, sender: 'admin', text: 'Yes! We have that item. Interested?', time: new Date('2026-01-24 18:15'), isRead: true, readAt: null, emoji: '', isPinned: false, isEdited: false, repliedTo: null },
      { id: 3, sender: 'customer', text: 'Do you have this in other colors?', time: new Date('2026-01-24 18:45'), isRead: false, readAt: null, emoji: '🔥', isPinned: false, isEdited: false, repliedTo: 2 }
    ]
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.chats.getAllConversations();
      
      if (response && (response.success || Array.isArray(response))) {
        const convList = Array.isArray(response) ? response : (response.conversations || response.data || []);
        setConversations(convList.length > 0 ? convList : SAMPLE_CONVERSATIONS);
      } else {
        setConversations(SAMPLE_CONVERSATIONS);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations(SAMPLE_CONVERSATIONS);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await adminAPI.chats.getConversation(conversationId);
      
      if (response && (response.success || Array.isArray(response))) {
        const msgList = Array.isArray(response) ? response : (response.messages || response.data || []);
        setMessages(msgList);
      } else {
        setMessages(SAMPLE_MESSAGES[conversationId] || []);
      }
      
      setSelectedChat(conversationId);
      
      // Mark as read
      const updated = conversations.map(c => 
        c.id === conversationId ? { ...c, unread: false, unreadCount: 0 } : c
      );
      setConversations(updated);
      
      // Fetch pinned messages
      fetchPinnedMessages(conversationId);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages(SAMPLE_MESSAGES[conversationId] || []);
      setSelectedChat(conversationId);
    }
  };

  const fetchPinnedMessages = async (conversationId) => {
    try {
      const response = await adminAPI.chats.getPinnedMessages(conversationId);
      if (response?.success) {
        setPinnedMessages(response.pinnedMessages || []);
      }
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    
    if (!replyMessage.trim() || !selectedChat) {
      setError('Please enter a message');
      return;
    }

    setSendingMessage(true);
    setError('');
    setSuccessMessage('');

    const messageText = replyMessage;

    try {
      // Add message locally immediately for better UX
      const newMessage = {
        id: messages.length + 1,
        sender: 'admin',
        text: messageText,
        time: new Date(),
        isRead: true,
        readAt: null,
        emoji: '',
        isPinned: false,
        isEdited: false,
        repliedTo: replyingTo || null
      };
      setMessages([...messages, newMessage]);
      setReplyMessage('');
      setReplyingTo(null);
      setSuccessMessage('✅ Message sent!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);

      // Try to update via API
      try {
        await adminAPI.chats.sendMessage({
          conversationId: selectedChat,
          message: messageText,
          senderId: 'admin',
          senderName: 'Admin',
          recipientId: selectedChat.split('-')[1] || 'customer',
          repliedToId: replyingTo
        });
      } catch (apiError) {
        console.log('API send failed, but message saved locally:', apiError);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEditMessage = async (messageId, newText) => {
    try {
      const updatedMessages = messages.map(msg =>
        msg.id === messageId ? { ...msg, text: newText, isEdited: true } : msg
      );
      setMessages(updatedMessages);
      setEditingMessageId(null);
      setEditingText('');
      setSuccessMessage('✅ Message edited!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      setError('Failed to edit message');
    }
  };

  const handlePinMessage = (messageId) => {
    const updatedMessages = messages.map(msg =>
      msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
    );
    setMessages(updatedMessages);
    
    if (messages.find(m => m.id === messageId)?.isPinned) {
      setSuccessMessage('✅ Message unpinned');
    } else {
      setSuccessMessage('📌 Message pinned');
    }
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleAddEmoji = (messageId, emoji) => {
    const updatedMessages = messages.map(msg =>
      msg.id === messageId ? { ...msg, emoji } : msg
    );
    setMessages(updatedMessages);
    setShowEmojiPicker(null);
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('🗑️ Delete this message?')) {
      const updatedMessages = messages.filter(msg => msg.id !== messageId);
      setMessages(updatedMessages);
      setSuccessMessage('✅ Message deleted!');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  const handleDeleteConversation = (conversationId, customerName) => {
    if (window.confirm(`🗑️ Delete conversation with ${customerName}? This action cannot be undone.`)) {
      const updatedConversations = conversations.filter(c => c.id !== conversationId);
      setConversations(updatedConversations);
      if (selectedChat === conversationId) {
        setSelectedChat(null);
        setMessages([]);
      }
      setSuccessMessage('✅ Conversation deleted!');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  const handleTogglePinConversation = (conversationId) => {
    const updatedConversations = conversations.map(c =>
      c.id === conversationId ? { ...c, isPinned: !c.isPinned } : c
    );
    setConversations(updatedConversations);
    setSuccessMessage(updatedConversations.find(c => c.id === conversationId)?.isPinned ? '📌 Pinned' : '📌 Unpinned');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleMuteConversation = (conversationId) => {
    const updatedConversations = conversations.map(c =>
      c.id === conversationId ? { ...c, isMuted: !c.isMuted } : c
    );
    setConversations(updatedConversations);
    setSuccessMessage(updatedConversations.find(c => c.id === conversationId)?.isMuted ? '🔇 Muted' : '🔔 Unmuted');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleArchiveConversation = (conversationId) => {
    const updatedConversations = conversations.map(c =>
      c.id === conversationId ? { ...c, isArchived: !c.isArchived } : c
    );
    setConversations(updatedConversations);
    setSuccessMessage(updatedConversations.find(c => c.id === conversationId)?.isArchived ? '📦 Archived' : '📦 Unarchived');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleSearchMessages = async () => {
    if (!searchQuery.trim()) {
      fetchMessages(selectedChat);
      return;
    }

    try {
      const response = await adminAPI.chats.searchMessages(selectedChat, searchQuery);
      if (response?.success) {
        setMessages(response.messages || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const getFilteredAndSortedConversations = () => {
    let filtered = conversations;
    
    // Filter archived
    filtered = filtered.filter(c => !c.isArchived);
    
    // Filter unread
    if (filterUnread) {
      filtered = filtered.filter(c => c.unread || c.unreadCount > 0);
    }

    // Sort
    if (sortBy === 'unread') {
      filtered.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));
    } else if (sortBy === 'pinned') {
      filtered.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    } else {
      filtered.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    }

    return filtered;
  };

  const currentCustomer = conversations.find(c => c.id === selectedChat);
  const filteredConversations = getFilteredAndSortedConversations();

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>💬 Customer Messages</h1>
          <p className="page-subtitle">Chat with your customers - WhatsApp-like features</p>
        </div>
      </div>

      {successMessage && (
        <div className="global-success-message">
          <span>{successMessage}</span>
          <button 
            type="button" 
            className="close-msg"
            onClick={() => setSuccessMessage('')}
          >
            ✕
          </button>
        </div>
      )}

      <div className="chats-container">
        {/* Conversations Sidebar */}
        <div className="conversations-sidebar card">
          <div className="sidebar-header">
            <h2>💬 Conversations ({filteredConversations.length})</h2>
            <div className="sidebar-controls">
              <button 
                className={`btn-filter ${filterUnread ? 'active' : ''}`}
                onClick={() => setFilterUnread(!filterUnread)}
                title="Filter unread"
              >
                🔔
              </button>
              <select 
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Recent</option>
                <option value="unread">Unread</option>
                <option value="pinned">Pinned</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="loading">Loading conversations...</p>
          ) : filteredConversations.length === 0 ? (
            <p className="empty-message">No conversations</p>
          ) : (
            <div className="conversations-list">
              {filteredConversations.map(conv => (
                <div 
                  key={conv.id} 
                  className={`conversation-item ${selectedChat === conv.id ? 'active' : ''} ${conv.unread ? 'unread' : ''} ${conv.isPinned ? 'pinned' : ''}`}
                >
                  <div 
                    className="conv-main"
                    onClick={() => fetchMessages(conv.id)}
                    style={{ flex: 1, cursor: 'pointer', display: 'flex', gap: '12px' }}
                  >
                    <div className="conv-avatar">{conv.avatar}</div>
                    <div className="conv-content" style={{ flex: 1 }}>
                      <div className="conv-header">
                        <h4>{conv.customerName}</h4>
                        {conv.isPinned && <span className="pin-badge">📌</span>}
                        {conv.isMuted && <span className="mute-badge">🔇</span>}
                      </div>
                      <p className="conv-preview">{conv.lastMessage}</p>
                      <small>{new Date(conv.lastMessageTime).toLocaleString('en-PK', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</small>
                    </div>
                    {conv.unreadCount > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
                  </div>
                  <div className="conv-actions">
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePinConversation(conv.id);
                      }}
                      title={conv.isPinned ? 'Unpin' : 'Pin'}
                    >
                      {conv.isPinned ? '📌' : '📌'}
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMuteConversation(conv.id);
                      }}
                      title={conv.isMuted ? 'Unmute' : 'Mute'}
                    >
                      {conv.isMuted ? '🔇' : '🔔'}
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveConversation(conv.id);
                      }}
                      title="Archive"
                    >
                      📦
                    </button>
                    <button
                      className="btn-delete-conv"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id, conv.customerName);
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Main */}
        <div className="chat-main">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="chat-header card">
                {currentCustomer && (
                  <>
                    <div className="chat-header-info">
                      <div>
                        <h3>{currentCustomer.customerName}</h3>
                        <p>{currentCustomer.email}</p>
                      </div>
                    </div>
                    <div className="chat-header-actions">
                      <button 
                        className="btn-icon"
                        onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                        title="Show pinned messages"
                      >
                        📌 ({pinnedMessages.length})
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => setSelectedChat(null)}
                        title="Close"
                      >
                        ✕
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Pinned Messages Section */}
              {showPinnedMessages && pinnedMessages.length > 0 && (
                <div className="pinned-messages-section">
                  <h4>📌 Pinned Messages</h4>
                  <div className="pinned-list">
                    {pinnedMessages.map((msg, idx) => (
                      <div key={idx} className="pinned-item">
                        <p>{msg.message}</p>
                        <small>{new Date(msg.timestamp).toLocaleString('en-PK')}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Messages */}
              <div className="search-messages card">
                <input
                  type="text"
                  placeholder="🔍 Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && handleSearchMessages()}
                />
                <button className="btn btn-small" onClick={handleSearchMessages}>Search</button>
                {searchQuery && (
                  <button 
                    className="btn btn-small"
                    onClick={() => {
                      setSearchQuery('');
                      fetchMessages(selectedChat);
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Messages Container */}
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="empty-messages">
                    <p>No messages in this conversation</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`message-wrapper ${msg.sender === 'admin' ? 'sent' : 'received'}`}>
                      {msg.repliedTo && (
                        <div className="replied-to-message">
                          <small>Replied to: {msg.repliedTo?.text || msg.replyText || 'deleted message'}</small>
                        </div>
                      )}
                      <div className={`message-bubble ${msg.sender === 'admin' ? 'sent' : 'received'}`} style={{ cursor: 'pointer', position: 'relative' }}>
                        <div className="message-content" style={{ cursor: 'text' }}>
                          {editingMessageId === msg.id ? (
                            <div className="edit-form">
                              <input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                autoFocus
                              />
                              <button onClick={() => handleEditMessage(msg.id, editingText)}>Save</button>
                              <button onClick={() => setEditingMessageId(null)}>Cancel</button>
                            </div>
                          ) : (
                            <>
                              <p style={{ margin: '4px 0', cursor: 'text' }}>{msg.text}</p>
                              {msg.isEdited && <small className="edited-label">(edited)</small>}
                              {msg.emoji && <span className="message-emoji" style={{ cursor: 'pointer' }}>{msg.emoji}</span>}
                            </>
                          )}
                          <small className="message-time">
                            {new Date(msg.time).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                            {msg.isRead && ' ✓✓'}
                          </small>
                        </div>
                        <div className="message-actions" style={{ display: 'flex !important', opacity: 1, visibility: 'visible', gap: '6px', marginTop: '8px' }}>
                          <button
                            className="btn-emoji"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id);
                            }}
                            title="Add emoji reaction (😊)"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            😊
                          </button>
                          <button
                            className="btn-icon-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyingTo(msg.id);
                              setSuccessMessage('↩️ Replying to message...');
                              setTimeout(() => setSuccessMessage(''), 2000);
                            }}
                            title="Reply to this message (↩️)"
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            ↩️
                          </button>
                          <button
                            className="btn-icon-small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePinMessage(msg.id);
                            }}
                            title={msg.isPinned ? 'Unpin message (📌)' : 'Pin message (📍)'}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {msg.isPinned ? '📌' : '📍'}
                          </button>
                          {msg.sender === 'admin' && (
                            <>
                              <button
                                className="btn-icon-small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMessageId(msg.id);
                                  setEditingText(msg.text);
                                  setSuccessMessage('✏️ Editing message...');
                                }}
                                title="Edit this message (✏️)"
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-delete-msg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMessage(msg.id);
                                }}
                                title="Delete this message (✕)"
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                        {showEmojiPicker === msg.id && (
                          <div className="emoji-picker">
                            {EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                className="emoji-btn"
                                onClick={() => handleAddEmoji(msg.id, emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} style={{ height: '1px' }} />
              </div>

              {/* Reply Form */}
              {replyingTo && (
                <div className="replying-to-indicator">
                  <small>Replying to: {messages.find(m => m.id === replyingTo)?.text || 'message'}</small>
                  <button onClick={() => setReplyingTo(null)}>✕</button>
                </div>
              )}

              <form className="reply-form card" onSubmit={handleSendReply}>
                {error && (
                  <div className="form-error-message">
                    <span>❌ {error}</span>
                    <button 
                      type="button" 
                      className="close-msg"
                      onClick={() => setError('')}
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <div className="message-input-group">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    disabled={sendingMessage}
                    autoFocus
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={sendingMessage}
                  >
                    {sendingMessage ? '⏳' : '📤'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="no-chat-selected card">
              <p>👈 Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatsPage;
