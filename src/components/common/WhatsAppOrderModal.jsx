import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Send, CheckCircle2 } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { getProductCategorySlug, getProductSubcategorySlug } from '../../utils/productUrl';
import './WhatsAppOrderModal.css';

// Crisp WhatsApp SVG Icon
export const WhatsAppIcon = ({ size = 18, color = 'currentColor', className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={color} 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const TARGET_PHONE_NUMBER = '971545810080'; // Target: +971 54 581 0080

const WhatsAppOrderModal = ({ isOpen, product, onClose }) => {
  const { createOrder } = useShop();
  const { user, isAuthenticated, promptLogin } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (!isAuthenticated) {
        onClose();
        promptLogin({
          message: 'Please login first and then continue',
          subtitle: 'Please login to your account to order via WhatsApp. If you do not have an account, please register to proceed.'
        });
        return;
      }

      setQuantity(Number(product?.quantity) > 0 ? Number(product.quantity) : 1);
      setNotes('');
      setIsSubmitting(false);
      if (user) {
        setCustomerName(user.name || user.username || '');
        setCustomerPhone(user.phone || '');
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isAuthenticated, user]);

  if (!isOpen || !product) return null;

  // Numerical price calculation
  const rawPriceStr = String(product.price || '0');
  const numericPrice = parseFloat(rawPriceStr.replace(/[^0-9.]/g, '')) || 0;
  const totalPrice = (numericPrice * quantity).toFixed(2);
  const currencyPrefix = rawPriceStr.includes('AED') ? 'AED ' : (rawPriceStr.includes('$') ? '$' : 'AED ');

  const handleQtyChange = (delta) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleSendOrder = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderNumber = `SL-${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Save order to backend database and customer local orders
    createOrder({
      order_number: orderNumber,
      customer_name: customerName.trim() || 'WhatsApp Customer',
      customer_phone: customerPhone.trim(),
      delivery_location: deliveryLocation.trim(),
      notes: notes.trim(),
      total_amount: parseFloat(totalPrice) || 0,
      items: [
        {
          id: product.id,
          name: product.name,
          qty: quantity,
          quantity: quantity,
          price: `${currencyPrefix}${numericPrice.toFixed(2)}`,
          numericPrice: numericPrice,
          brand: product.brand || 'Super Light',
          image: product.image,
          images: Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image ? [product.image] : []),
          category_slug: product.category_slug || getProductCategorySlug(product),
          category_name: product.category_name || product.category || '',
          subcategory_slug: product.subcategory_slug || getProductSubcategorySlug(product),
          subcategory_name: product.subcategory_name || product.subcategory || '',
          slug: product.slug || ''
        }
      ],
      order_source: 'WhatsApp'
    });

    const formattedMessage = 
`*NEW ORDER INQUIRY - SUPER LIGHT*
*Order Number:* #${orderNumber}
--------------------------------
*Product:* ${(product.name || '').toUpperCase()}
*Brand:* ${((product.brand || 'Super Light') || '').toUpperCase()}
*Price:* ${currencyPrefix}${numericPrice.toFixed(2)}
*Quantity:* ${quantity}
*Total Amount:* ${currencyPrefix}${totalPrice}
--------------------------------
*Customer Name:* ${customerName.trim() || 'Not specified'}
*Phone Number:* ${customerPhone.trim() || 'Not specified'}
*Delivery Location:* ${deliveryLocation.trim() || 'Not specified'}
${notes.trim() ? `*Notes:* ${notes.trim()}\n` : ''}--------------------------------
_Order recorded & submitted via Super Light Online Store_`;

    // Target international format: +971 54 581 0080 (971545810080)
    const cleanPhone = TARGET_PHONE_NUMBER.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(formattedMessage)}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="wa-modal-overlay" onClick={onClose}>
      <div 
        className="wa-modal-box" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wa-modal-title"
      >
        {/* Header */}
        <div className="wa-modal-header">
          <div className="wa-modal-header-left">
            <div className="wa-icon-badge">
              <WhatsAppIcon size={22} color="#ffffff" />
            </div>
            <div>
              <h3 id="wa-modal-title" className="wa-modal-title">Order via WhatsApp</h3>
              <p className="wa-modal-subtitle">Direct order dispatch via WhatsApp</p>
            </div>
          </div>
          <button 
            type="button" 
            className="wa-modal-close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Product Snapshot Card */}
        <div className="wa-product-snapshot">
          <div className="wa-snapshot-img-wrap">
            <img 
              src={product.image || '/prod_downlight_1791451418016.png'} 
              alt={product.name} 
              className="wa-snapshot-img"
              onError={(e) => { e.target.onerror = null; e.target.src = '/prod_downlight_1791451418016.png'; }}
            />
          </div>
          <div className="wa-snapshot-details">
            {product.brand && <span className="wa-snapshot-brand">{(product.brand || '').toUpperCase()}</span>}
            <h4 className="wa-snapshot-name" title={product.name}>{(product.name || '').toUpperCase()}</h4>
            <div className="wa-snapshot-price-row">
              <span className="wa-snapshot-price">{currencyPrefix}{numericPrice.toFixed(2)}</span>
              {product.oldPrice && <span className="wa-snapshot-old-price">{product.oldPrice}</span>}
            </div>
          </div>
        </div>

        {/* Order Form */}
        <form onSubmit={handleSendOrder} className="wa-order-form">
          {/* Quantity Selector */}
          <div className="wa-form-row wa-qty-row">
            <label className="wa-form-label">Quantity</label>
            <div className="wa-qty-counter">
              <button 
                type="button" 
                className="wa-qty-btn" 
                onClick={() => handleQtyChange(-1)}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus size={15} />
              </button>
              <span className="wa-qty-display">{quantity}</span>
              <button 
                type="button" 
                className="wa-qty-btn" 
                onClick={() => handleQtyChange(1)}
                aria-label="Increase quantity"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Customer Name */}
          <div className="wa-form-row">
            <label className="wa-form-label" htmlFor="wa-customer-name">
              Your Name <span className="wa-required">*</span>
            </label>
            <input 
              id="wa-customer-name"
              type="text" 
              className="wa-form-input" 
              placeholder="Enter your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          {/* Contact Number */}
          <div className="wa-form-row">
            <label className="wa-form-label" htmlFor="wa-customer-phone">
              Contact / Phone Number <span className="wa-required">*</span>
            </label>
            <input 
              id="wa-customer-phone"
              type="tel" 
              className="wa-form-input" 
              placeholder="Enter your phone number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </div>

          {/* Delivery Location */}
          <div className="wa-form-row">
            <label className="wa-form-label" htmlFor="wa-delivery-location">
              Delivery City / Area
            </label>
            <input 
              id="wa-delivery-location"
              type="text" 
              className="wa-form-input" 
              placeholder="Enter your delivery city / area"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
            />
          </div>

          {/* Additional Notes */}
          <div className="wa-form-row">
            <label className="wa-form-label" htmlFor="wa-order-notes">
              Special Instructions / Notes (Optional)
            </label>
            <textarea 
              id="wa-order-notes"
              className="wa-form-textarea" 
              placeholder="Enter any special instructions or notes (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Price Summary Box */}
          <div className="wa-total-box">
            <span className="wa-total-label">Estimated Total:</span>
            <span className="wa-total-amount">{currencyPrefix}{totalPrice}</span>
          </div>

          {/* Action Buttons */}
          <div className="wa-modal-actions">
            <button 
              type="button" 
              className="wa-cancel-btn" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="wa-submit-btn"
              disabled={isSubmitting}
            >
              <WhatsAppIcon size={19} color="#ffffff" />
              <span>Send Order via WhatsApp</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WhatsAppOrderModal;

