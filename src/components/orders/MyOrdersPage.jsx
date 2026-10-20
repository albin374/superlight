import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  RotateCw, 
  XCircle, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  ArrowRight, 
  ShoppingBag, 
  ChevronRight, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { WhatsAppIcon } from '../common/WhatsAppOrderModal';
import { getProductUrl, findProductInCatalog, STATIC_CATALOG } from '../../utils/productUrl';
import './MyOrdersPage.css';

const TARGET_PHONE_NUMBER = '971545810080'; // Target: +971 54 581 0080

const MyOrdersPage = ({ onProductClick }) => {
  const navigate = useNavigate();
  const { orders, syncOrders } = useShop();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Sync latest status from server on mount
    if (syncOrders) {
      syncOrders();
    }
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    if (syncOrders) {
      await syncOrders();
    }
    setTimeout(() => {
      setIsSyncing(false);
    }, 600);
  };

  const handleOpenWhatsAppChat = (order) => {
    const cleanPhone = TARGET_PHONE_NUMBER.replace(/[^0-9]/g, '');
    const text = `Hello Super Light Team, I would like to check the status of my Order *#${order.order_number}* (Total: AED ${Number(order.total_amount).toFixed(2)}).`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleItemClick = (item) => {
    const cleanId = String(item.realId || item.id || '').replace(/^db-/, '');
    const catalogMatch = findProductInCatalog(STATIC_CATALOG, item.slug || item.name);
    const enrichedItem = {
      ...(catalogMatch || {}),
      ...item,
      realId: cleanId || catalogMatch?.id,
      images: (catalogMatch?.images && catalogMatch.images.length > 1)
        ? catalogMatch.images
        : (Array.isArray(item.images) && item.images.length > 0 ? item.images : (item.image ? [item.image] : []))
    };
    if (onProductClick) {
      onProductClick(enrichedItem);
    } else {
      navigate(getProductUrl(enrichedItem), { state: { product: enrichedItem } });
    }
  };

  // Stats calculation
  const totalOrders = orders.length;
  const pendingCount = orders.filter(o => o.status === 'Pending').length;
  const processingCount = orders.filter(o => o.status === 'Processing').length;
  const completedCount = orders.filter(o => o.status === 'Completed').length;

  return (
    <div className="my-orders-page">
      <div className="orders-container">

        {/* Breadcrumbs */}
        <div className="orders-breadcrumbs">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <span>My Orders</span>
        </div>

        {/* Header */}
        <div className="orders-header">
          <div className="orders-header-left">
            <h1>
              <Package size={28} color="#e6005c" />
              My Orders & Inquiries
            </h1>
            <p>Track your procurement orders, review items, and monitor delivery updates in real-time.</p>
          </div>
          {totalOrders > 0 && (
            <div className="orders-header-actions">
              <button 
                type="button" 
                className={`orders-sync-btn ${isSyncing ? 'spinning' : ''}`}
                onClick={handleManualSync}
                title="Refresh order statuses from store database"
              >
                <RefreshCw size={15} />
                {isSyncing ? 'Syncing...' : 'Refresh Status'}
              </button>
            </div>
          )}
        </div>

        {/* Orders Overview Stats */}
        {totalOrders > 0 && (
          <div className="orders-stats-grid">
            <div className="order-stat-card">
              <div className="order-stat-icon total">
                <Package size={22} />
              </div>
              <div className="order-stat-info">
                <div className="stat-value">{totalOrders}</div>
                <div className="stat-label">Total Orders</div>
              </div>
            </div>

            <div className="order-stat-card">
              <div className="order-stat-icon pending">
                <Clock size={22} />
              </div>
              <div className="order-stat-info">
                <div className="stat-value">{pendingCount}</div>
                <div className="stat-label">Pending Review</div>
              </div>
            </div>

            <div className="order-stat-card">
              <div className="order-stat-icon processing">
                <RotateCw size={22} />
              </div>
              <div className="order-stat-info">
                <div className="stat-value">{processingCount}</div>
                <div className="stat-label">Processing / Preparing</div>
              </div>
            </div>

            <div className="order-stat-card">
              <div className="order-stat-icon completed">
                <CheckCircle2 size={22} />
              </div>
              <div className="order-stat-info">
                <div className="stat-value">{completedCount}</div>
                <div className="stat-label">Completed / Delivered</div>
              </div>
            </div>
          </div>
        )}

        {/* Orders List or Empty State */}
        {totalOrders === 0 ? (
          <div className="orders-empty-card">
            <div className="orders-empty-icon">
              <ShoppingBag size={38} />
            </div>
            <h2 className="orders-empty-title">No Orders Placed Yet</h2>
            <p className="orders-empty-desc">
              When you send an order inquiry via WhatsApp or complete your shopping cart checkout, all your order tracking information will appear right here.
            </p>
            <Link to="/" className="orders-browse-btn">
              Browse Products <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const statusKey = (order.status || 'pending').toLowerCase();
              const itemsList = Array.isArray(order.items) ? order.items : [];
              const formattedDate = order.created_at
                ? new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Just now';

              return (
                <div key={order.order_number || order.id} className="order-card">
                  
                  {/* Card Header */}
                  <div className="order-card-header">
                    <div className="order-header-left">
                      <span className="order-number-badge">
                        Order #{order.order_number}
                      </span>
                      <span className="order-date">
                        <Calendar size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        {formattedDate}
                      </span>
                    </div>

                    <div className="order-header-right">
                      <span className={`order-status-chip ${statusKey}`}>
                        {statusKey === 'pending' && <Clock size={13} />}
                        {statusKey === 'processing' && <RotateCw size={13} />}
                        {statusKey === 'completed' && <CheckCircle2 size={13} />}
                        {statusKey === 'cancelled' && <XCircle size={13} />}
                        {order.status || 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="order-card-body">
                    
                    {/* Ordered Items Column */}
                    <div className="order-items-col">
                      <h4>Ordered Items ({itemsList.reduce((acc, it) => acc + (it.qty || it.quantity || 1), 0)})</h4>
                      <div className="order-items-list">
                        {itemsList.map((item, idx) => {
                          const qty = Number(item.qty || item.quantity || 1);
                          const rawPrice = item.numericPrice || parseFloat(String(item.price || '').replace(/[^0-9.]/g, '')) || 0;
                          const unitPriceFormatted = item.price && String(item.price).trim().startsWith('AED')
                            ? item.price
                            : `AED ${rawPrice.toFixed(2)}`;
                          const lineTotalFormatted = `AED ${(rawPrice * qty).toFixed(2)}`;
                          const itemImg = item.image || '/prod_downlight_1791451418016.png';

                          return (
                            <div key={item.id || idx} className="order-item-row">
                              <img 
                                src={itemImg} 
                                alt={item.name} 
                                className="order-item-img"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/prod_downlight_1791451418016.png'; }}
                              />
                              <div className="order-item-details">
                                {item.brand && <div className="order-item-brand">{(item.brand || '').toUpperCase()}</div>}
                                <div 
                                  className="order-item-name" 
                                  title={item.name}
                                  onClick={() => handleItemClick(item)}
                                >
                                  {(item.name || '').toUpperCase()}
                                </div>
                                <div className="order-item-meta">
                                  <span className="order-meta-qty">Qty: <strong>{qty}</strong></span>
                                  <span className="order-meta-unit">Unit: {unitPriceFormatted}</span>
                                  <span className="order-meta-total">Total: <strong>{lineTotalFormatted}</strong></span>
                                </div>
                              </div>
                              <div className="order-item-price">
                                {lineTotalFormatted}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Customer & Delivery Summary Column */}
                    <div className="order-customer-col">
                      <h4>Procurement & Delivery Info</h4>

                      <div className="order-info-line">
                        <User size={15} />
                        <div>
                          <strong>Customer:</strong>
                          <span>{order.customer_name || 'WhatsApp Customer'}</span>
                        </div>
                      </div>

                      {order.customer_phone && (
                        <div className="order-info-line">
                          <Phone size={15} />
                          <div>
                            <strong>Contact:</strong>
                            <span>{order.customer_phone}</span>
                          </div>
                        </div>
                      )}

                      {order.delivery_location && (
                        <div className="order-info-line">
                          <MapPin size={15} style={{ color: '#e6005c' }} />
                          <div>
                            <strong>Location:</strong>
                            <span>{order.delivery_location}</span>
                          </div>
                        </div>
                      )}

                      {order.notes && (
                        <div className="order-info-line">
                          <FileText size={15} />
                          <div>
                            <strong>Notes:</strong>
                            <span>"{order.notes}"</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="order-card-footer">
                    <div className="order-footer-left">
                      <span className="order-total-label">Order Total:</span>
                      <span className="order-total-amount">AED {Number(order.total_amount).toFixed(2)}</span>
                      <span className="order-total-vat">(Incl. VAT)</span>
                    </div>

                    <div className="order-footer-actions">
                      <button 
                        type="button" 
                        className="order-chat-btn"
                        onClick={() => handleOpenWhatsAppChat(order)}
                        title="Chat with Super Light team on WhatsApp about this order"
                      >
                        <WhatsAppIcon size={17} color="#ffffff" />
                        Chat on WhatsApp
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};

export default MyOrdersPage;

