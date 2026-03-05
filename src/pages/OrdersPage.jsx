import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import '../styles/orderManagement.css';

function OrdersPage() {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filterStatus, setFilterStatus] = useState('');
	const [selectedOrder, setSelectedOrder] = useState(null);
	const [expandedScreenshot, setExpandedScreenshot] = useState(null);

	useEffect(() => {
		fetchOrders();
	}, []);

	const fetchOrders = async () => {
		setLoading(true);
		try {
			const response = await adminAPI.orders.getAll();
			const ordersList = Array.isArray(response)
				? response
				: response.data || [];
			if (ordersList && ordersList.length > 0) {
				try {
					const formattedOrders = ordersList.map((order) => {
						let products, items;
						if (order.products && order.products.length) {
							products = order.products.map((p) => p.name || p.productName);
						} else {
							products = order.items.map((i) => i.productName || i.name);
						}
						if (order.items && order.items.length) {
							items = order.items.map((item) => ({
								productName: item.name || item.productName,
								quantity: item.quantity,
								price: item.price,
							}));
						} else {
							items = order.products.map((prod) => ({
								productName: prod.name,
								quantity: prod.quantity || 1,
								price: prod.price || prod.productPrice,
							}));
						}
						return {
							id: order._id || order.id,
							customerName: order.customerName || order.user?.name || '',
							email: order.email || order.user?.email || '',
							phone: order.phone || order.user?.phone || '',
							products,
							items,
							total: order.total || order.cartTotal || 0,
							finalPrice: order.finalPrice || order.final_amount || 0,
							status: order.status || 'Pending',
							date: order.date || order.createdAt || '',
							createdAt: order.createdAt || '',
							paymentMethod:
								order.paymentMethod || order.payment_method || '',
							shippingAddress:
								order.shippingAddress || order.address || '',
							trackingNumber:
								order.trackingNumber || order.tracking_number || '',
							discountAmount: order.discountAmount || order.discount || 0,
						};
					});
					setOrders(formattedOrders);
				} catch (err) {
					console.error('Error formatting orders:', err);
					setOrders([]);
				}
			} else {
				setOrders([]);
			}
		} catch (err) {
			console.error('Error fetching orders:', err);
			setOrders([]);
		} finally {
			setLoading(false);
		}
	};

	const handleStatusUpdate = async (orderId, newStatus) => {
		try {
			const res = await adminAPI.orders.updateStatus(orderId, {
				status: newStatus,
			});
			if (res && res.data && res.data.success) {
				fetchOrders();
			}
		} catch (err) {
			// fallback: update locally
			setOrders((prev) =>
				prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
			);
		}
	};

	const handleDeleteOrder = async (orderId) => {
		try {
			const res = await adminAPI.orders.delete(orderId);
			if (res && res.data && res.data.success) {
				setOrders((prev) => prev.filter((o) => o.id !== orderId));
			}
		} catch (err) {
			setOrders((prev) => prev.filter((o) => o.id !== orderId));
		}
	};

	const renderOrderCard = (order) => (
		<div className="order-card" key={order.id}>
			<div className="order-header">
				<div>
					<strong>{order.customerName}</strong> ({order.email})
				</div>
				<div className="order-status">
					<select
						value={order.status}
						onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
					>
						<option value="Pending">Pending</option>
						<option value="Confirmed">Confirmed</option>
						<option value="Shipped">Shipped</option>
						<option value="Delivered">Delivered</option>
						<option value="Cancelled">Cancelled</option>
					</select>
				</div>
			</div>
			<div className="order-details">
				<p>Phone: {order.phone}</p>
				<p>Payment: {order.paymentMethod}</p>
				<p>Address: {order.shippingAddress}</p>
				<p>Tracking: {order.trackingNumber}</p>
				<p>Total: Rs.{order.finalPrice}</p>
				<div className="order-items">
					{order.items.map((item, idx) => (
						<div key={idx} className="order-item">
							<span>{item.productName}</span>
							<span>×{item.quantity}</span>
							<span>Rs.{item.price}</span>
						</div>
					))}
				</div>
				<button onClick={() => setSelectedOrder(order)}>
					View Screenshot
				</button>
				<button onClick={() => handleDeleteOrder(order.id)}>
					Delete
				</button>
			</div>
		</div>
	);

	const filteredOrders = filterStatus
		? orders.filter((o) => o.status === filterStatus)
		: orders;

	return (
		<div className="orders-page">
			<h1>Orders</h1>
			<div className="orders-filter">
				<label>
					Status:
					<select
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
					>
						<option value="">All</option>
						<option value="Pending">Pending</option>
						<option value="Confirmed">Confirmed</option>
						<option value="Shipped">Shipped</option>
						<option value="Delivered">Delivered</option>
						<option value="Cancelled">Cancelled</option>
					</select>
				</label>
			</div>
			{loading ? (
				<p>Loading orders…</p>
			) : filteredOrders.length ? (
				<div className="orders-list">
					{filteredOrders.map(renderOrderCard)}
				</div>
			) : (
				<p>No orders found.</p>
			)}

			{selectedOrder && (
				<div className="modal">
					<div className="modal-content">
						<h2>Order Details</h2>
						<pre>{JSON.stringify(selectedOrder, null, 2)}</pre>
						<button onClick={() => setSelectedOrder(null)}>Close</button>
					</div>
				</div>
			)}

			{expandedScreenshot && (
				<div className="screenshot-modal" onClick={() => setExpandedScreenshot(null)}>
					<img src={expandedScreenshot} alt="payment screenshot" />
				</div>
			)}
		</div>
	);
}

export default OrdersPage;
