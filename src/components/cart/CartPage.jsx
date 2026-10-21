import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  Clock, 
  CreditCard,
  X
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { WhatsAppIcon } from '../common/WhatsAppOrderModal';
import { getProductUrl, getProductCategorySlug, getProductSubcategorySlug } from '../../utils/productUrl';
import './CartPage.css';

const TARGET_PHONE_NUMBER = '971545810080'; // Target: +971 54 581 0080

const CartPage = ({ onProductClick }) => {
  const navigate = useNavigate();
  const { cart, cartCount, cartSubtotal, updateCartQty, removeFromCart, clearCart, createOrder } = useShop();
  const { user, requireAuth } = useAuth();

  // WhatsApp Checkout Modal state
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-fill user credentials when modal is opened
  useEffect(() => {
    if (isWaModalOpen && user) {
      setCustomerName(user.name || user.username || '');
      setCustomerPhone(user.phone || '');
    }
  }, [isWaModalOpen, user]);

  // Final Price Calculation (no extra charges)
  const orderTotal = cartSubtotal;

  const handleProductClick = (item) => {
    if (onProductClick) {
      onProductClick(item);
    } else {
      navigate(getProductUrl(item), { state: { product: item } });
    }
  };

  const handleSendCartOrder = (e) => {
    e.preventDefault();

    const orderNumber = `SL-${Math.floor(100000 + Math.random() * 900000)}`;

    let itemsList = '';
    cart.forEach((item, index) => {
      const lineTotal = ((item.numericPrice || 0) * (item.quantity || 1)).toFixed(2);
      itemsList += `${index + 1}. *${item.name}*\n   Brand: ${item.brand || 'Super Light'} | Qty: ${item.quantity} | Total: AED ${lineTotal}\n`;
    });

    // 1. Record order in backend DB & customer local orders
    createOrder({
      order_number: orderNumber,
      customer_name: customerName.trim() || user?.name || user?.username || 'WhatsApp Customer',
      customer_email: user?.email || '',
      customer_phone: customerPhone.trim(),
      user_id: user?.id || null,
      delivery_location: deliveryLocation.trim(),
      notes: notes.trim(),
      total_amount: orderTotal,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.quantity || 1,
        quantity: item.quantity || 1,
        price: item.price,
        numericPrice: item.numericPrice,
        brand: item.brand || 'Super Light',
        image: item.image,
        images: Array.isArray(item.images) && item.images.length > 0 ? item.images : (item.image ? [item.image] : []),
        category_slug: item.category_slug || getProductCategorySlug(item),
        category_name: item.category_name || item.category || '',
        subcategory_slug: item.subcategory_slug || getProductSubcategorySlug(item),
        subcategory_name: item.subcategory_name || item.subcategory || '',
        slug: item.slug || ''
      })),
      order_source: 'WhatsApp'
    });

    const formattedMessage = 
`*NEW CART ORDER INQUIRY - SUPER LIGHT*
*Order Number:* #${orderNumber}
--------------------------------
${itemsList}--------------------------------
*Final Price:* AED ${orderTotal.toFixed(2)}
--------------------------------
*Customer Name:* ${customerName.trim() || 'Not specified'}
*Phone Number:* ${customerPhone.trim() || 'Not specified'}
*Delivery Location:* ${deliveryLocation.trim() || 'Not specified'}
${notes.trim() ? `*Notes:* ${notes.trim()}\n` : ''}--------------------------------
_Order recorded & submitted via Super Light Online Store_`;

    const cleanPhone = TARGET_PHONE_NUMBER.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(formattedMessage)}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    clearCart();
    setIsWaModalOpen(false);
  };

  return (
    <div className="cart-page">
      <div className="cart-container">
        
        {/* Breadcrumbs */}
        <div className="cart-breadcrumbs">
          <Link to="/">Home</Link>
          <ChevronRightIcon />
          <span>Shopping Cart</span>
        </div>

        {/* Page Header */}
        <div className="cart-header">
          <h1 className="cart-header-title">
            Shopping Cart
            <span className="cart-header-count">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
          </h1>

          {cart.length > 0 && (
            <button 
              type="button" 
              className="cart-clear-btn"
              onClick={clearCart}
            >
              <Trash2 size={15} />
              Clear Cart
            </button>
          )}
        </div>

        {/* Empty State */}
        {cart.length === 0 ? (
          <div className="cart-empty-state">
            <div className="cart-empty-icon-wrap">
              <ShoppingBag size={44} />
            </div>
            <h2 className="cart-empty-title">Your Shopping Cart is Empty</h2>
            <p className="cart-empty-text">
              Looks like you haven't added any products yet. Explore our genuine brand electrical products, lighting, and cables.
            </p>
            <button 
              type="button" 
              className="cart-empty-btn"
              onClick={() => navigate('/')}
            >
              Start Shopping Now <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* Main Cart Content Grid */
          <div className="cart-grid">
            
            {/* Left: Cart Items Table */}
            <div className="cart-items-box">
              <div className="cart-table-head">
                <span>Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Total</span>
                <span></span>
              </div>

              <div className="cart-items-list">
                {cart.map((item) => {
                  const lineTotal = ((item.numericPrice || 0) * (item.quantity || 1)).toFixed(2);

                  return (
                    <div key={item.id} className="cart-item-row">
                      {/* Product Cell */}
                      <div className="cart-product-cell">
                        <div 
                          className="cart-product-img-wrap"
                          onClick={() => handleProductClick(item)}
                        >
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="cart-product-img"
                            onError={(e) => { e.target.onerror = null; e.target.src = '/prod_downlight_1791451418016.png'; }}
                          />
                        </div>
                        <div className="cart-product-info">
                          <span className="cart-product-brand">{(item.brand || '').toUpperCase()}</span>
                          <h4 
                            className="cart-product-name"
                            onClick={() => handleProductClick(item)}
                            title={item.name}
                          >
                            {(item.name || '').toUpperCase()}
                          </h4>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="cart-unit-price">
                        {item.price}
                      </div>

                      {/* Quantity Counter */}
                      <div>
                        <div className="cart-qty-counter">
                          <button 
                            type="button" 
                            className="cart-qty-btn"
                            onClick={() => updateCartQty(item.id, -1)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="cart-qty-val">{item.quantity}</span>
                          <button 
                            type="button" 
                            className="cart-qty-btn"
                            onClick={() => updateCartQty(item.id, 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Total Price */}
                      <div className="cart-item-total">
                        AED {lineTotal}
                      </div>

                      {/* Remove Button */}
                      <div>
                        <button 
                          type="button" 
                          className="cart-remove-btn"
                          onClick={() => removeFromCart(item.id)}
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom bar inside box */}
              <div className="cart-footer-bar">
                <button 
                  type="button" 
                  className="cart-continue-btn"
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft size={16} />
                  Continue Shopping
                </button>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="cart-summary-card">
              <h3 className="cart-summary-title">Order Summary</h3>

              {/* Summary Breakdown */}
              <div className="cart-summary-row">
                <span>Total Items</span>
                <span className="cart-summary-val">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
              </div>

              <div className="cart-summary-divider" />

              <div className="cart-summary-total-row">
                <span className="cart-total-label">Final Price</span>
                <span className="cart-total-value">AED {orderTotal.toFixed(2)}</span>
              </div>

              {/* Order via WhatsApp Button */}
              <button 
                type="button" 
                className="cart-whatsapp-order-btn"
                onClick={() => {
                  requireAuth(() => setIsWaModalOpen(true), {
                    message: 'Please login first and then continue',
                    subtitle: 'Please login to your account to checkout your cart via WhatsApp. If you do not have an account, please register to proceed.'
                  });
                }}
              >
                <WhatsAppIcon size={20} color="#ffffff" />
                Order All via WhatsApp
              </button>

              {/* Guarantees */}
              <div className="cart-guarantees">
                <div className="cart-guarantee-item">
                  <ShieldCheck size={18} className="cart-guarantee-icon" />
                  <span>100% Genuine Certified Brand Products</span>
                </div>
                <div className="cart-guarantee-item">
                  <Truck size={18} className="cart-guarantee-icon" />
                  <span>Prompt Delivery Across Dubai & UAE</span>
                </div>
                <div className="cart-guarantee-item">
                  <Clock size={18} className="cart-guarantee-icon" />
                  <span>Direct WhatsApp Assistance: +91 {TARGET_PHONE_NUMBER}</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* WhatsApp Cart Checkout Modal */}
      {isWaModalOpen && (
        <div className="wa-modal-overlay" onClick={() => setIsWaModalOpen(false)}>
          <div 
            className="wa-modal-box" 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="wa-modal-header">
              <div className="wa-modal-header-left">
                <div className="wa-icon-badge">
                  <WhatsAppIcon size={22} color="#ffffff" />
                </div>
                <div>
                  <h3 className="wa-modal-title">Checkout Cart via WhatsApp</h3>
                  <p className="wa-modal-subtitle">Direct dispatch via WhatsApp</p>
                </div>
              </div>
              <button 
                type="button" 
                className="wa-modal-close-btn" 
                onClick={() => setIsWaModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendCartOrder} className="wa-order-form">
              <div className="wa-form-row">
                <label className="wa-form-label" htmlFor="cart-name">
                  Your Full Name <span className="wa-required">*</span>
                </label>
                <input 
                  id="cart-name"
                  type="text" 
                  className="wa-form-input" 
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div className="wa-form-row">
                <label className="wa-form-label" htmlFor="cart-phone">
                  Contact Phone Number <span className="wa-required">*</span>
                </label>
                <input 
                  id="cart-phone"
                  type="tel" 
                  className="wa-form-input" 
                  placeholder="Enter your phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>

              <div className="wa-form-row">
                <label className="wa-form-label" htmlFor="cart-location">
                  Delivery City / Address <span className="wa-required">*</span>
                </label>
                <input 
                  id="cart-location"
                  type="text" 
                  className="wa-form-input" 
                  placeholder="Enter your delivery city / address"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  required
                />
              </div>

              <div className="wa-form-row">
                <label className="wa-form-label" htmlFor="cart-notes">
                  Order Instructions (Optional)
                </label>
                <textarea 
                  id="cart-notes"
                  className="wa-form-textarea" 
                  placeholder="Enter any special instructions or notes (optional)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="wa-total-box">
                <span className="wa-total-label">Final Price ({cartCount} {cartCount === 1 ? 'item' : 'items'}):</span>
                <span className="wa-total-amount">AED {orderTotal.toFixed(2)}</span>
              </div>

              <div className="wa-modal-actions">
                <button 
                  type="button" 
                  className="wa-cancel-btn" 
                  onClick={() => setIsWaModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="wa-submit-btn"
                >
                  <WhatsAppIcon size={19} color="#ffffff" />
                  <span>Send Order via WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default CartPage;

