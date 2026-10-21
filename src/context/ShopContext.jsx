import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProductCategorySlug, getProductSubcategorySlug } from '../utils/productUrl';

const ShopContext = createContext(null);

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

export const ShopProvider = ({ children }) => {
  // Cart state persisted in localStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('superlight_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse cart from localStorage:', e);
      return [];
    }
  });

  // Wishlist state persisted in localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('superlight_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse wishlist from localStorage:', e);
      return [];
    }
  });

  // Orders state persisted in localStorage
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('superlight_orders');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse orders from localStorage:', e);
      return [];
    }
  });

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  useEffect(() => {
    try {
      localStorage.setItem('superlight_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('superlight_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist:', e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('superlight_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders:', e);
    }
  }, [orders]);

  // Create order both in backend DB and local history
  const createOrder = async (orderPayload) => {
    const orderNumber = orderPayload.order_number || `SL-${Math.floor(100000 + Math.random() * 900000)}`;
    const finalPayload = {
      ...orderPayload,
      order_number: orderNumber,
      order_source: orderPayload.order_source || 'WhatsApp'
    };

    let savedOrder = {
      ...finalPayload,
      id: Date.now(),
      created_at: new Date().toISOString(),
      status: 'Pending'
    };

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(finalPayload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          savedOrder = data.order;
        }
      }
    } catch (err) {
      console.warn('[ShopContext] Error saving order to backend, stored locally:', err);
    }

    setOrders(prev => [savedOrder, ...prev.filter(o => o.order_number !== savedOrder.order_number)]);
    showToast(`Order #${savedOrder.order_number} submitted!`);
    return savedOrder;
  };

  // Sync order statuses with backend DB
  const syncOrders = async () => {
    if (orders.length === 0) return;
    try {
      const orderNumbers = orders.map(o => o.order_number).filter(Boolean);
      const res = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_numbers: orderNumbers })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          const statusMap = new Map();
          data.orders.forEach(dbOrd => {
            statusMap.set(dbOrd.order_number, dbOrd.status);
          });
          setOrders(prev => prev.map(ord => {
            if (statusMap.has(ord.order_number)) {
              return { ...ord, status: statusMap.get(ord.order_number) };
            }
            return ord;
          }));
        }
      }
    } catch (e) {
      console.warn('[ShopContext] Failed to sync orders:', e);
    }
  };

  const removeOrder = (orderNumber) => {
    setOrders(prev => prev.filter(o => o.order_number !== orderNumber));
  };

  // Helper to get numeric price
  const parsePrice = (priceVal) => {
    if (typeof priceVal === 'number') return priceVal;
    if (!priceVal) return 0;
    const cleaned = String(priceVal).replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  // Add product to cart
  const addToCart = (product, qty = 1) => {
    if (!product) return;
    const numPrice = parsePrice(product.price);
    const productId = product.id || String(product.name).toLowerCase().replace(/\s+/g, '-');

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.id === productId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty
        };
        return updated;
      } else {
        const newItem = {
          id: productId,
          name: product.name || 'Electrical Product',
          price: product.price || `AED ${numPrice.toFixed(2)}`,
          numericPrice: numPrice,
          image: product.image || '/prod_downlight_1791451418016.png',
          images: Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image ? [product.image] : []),
          brand: product.brand || 'Super Light',
          quantity: Math.max(1, qty),
          category: product.category || product.category_name || '',
          category_slug: product.category_slug || getProductCategorySlug(product),
          subcategory: product.subcategory || product.subcategory_name || '',
          subcategory_slug: product.subcategory_slug || getProductSubcategorySlug(product),
          slug: product.slug || ''
        };
        return [...prevCart, newItem];
      }
    });

    showToast(`Added "${product.name || 'Product'}" to cart!`);
  };

  // Update item quantity
  const updateCartQty = (productId, deltaOrQty, isDirect = false) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === productId) {
          const nextQty = isDirect ? Math.max(1, deltaOrQty) : Math.max(1, item.quantity + deltaOrQty);
          return { ...item, quantity: nextQty };
        }
        return item;
      });
    });
  };

  // Remove single item from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    showToast('Item removed from cart');
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
    showToast('Cart cleared');
  };

  // Toggle wishlist item
  const toggleWishlist = (product) => {
    if (!product) return;
    const productId = product.id || String(product.name).toLowerCase().replace(/\s+/g, '-');
    const exists = wishlist.some(item => item.id === productId);

    if (exists) {
      setWishlist(prev => prev.filter(item => item.id !== productId));
      showToast(`Removed "${product.name || 'Product'}" from wishlist`);
    } else {
      const numPrice = parsePrice(product.price);
      const newItem = {
        id: productId,
        name: product.name || 'Electrical Product',
        price: product.price || `AED ${numPrice.toFixed(2)}`,
        numericPrice: numPrice,
        image: product.image || '/prod_downlight_1791451418016.png',
        brand: product.brand || 'Super Light',
        oldPrice: product.oldPrice || null,
        category: product.category || product.subcategory || ''
      };
      setWishlist(prev => [...prev, newItem]);
      showToast(`Saved "${product.name || 'Product'}" to wishlist!`);
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => prev.filter(item => item.id !== productId));
    showToast('Removed from wishlist');
  };

  const clearWishlist = () => {
    setWishlist([]);
    showToast('Wishlist cleared');
  };

  const moveAllWishlistToCart = () => {
    wishlist.forEach(item => {
      addToCart(item, 1);
    });
    setWishlist([]);
    showToast('All wishlist items moved to cart!');
  };

  // Derived counts and totals
  const cartCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  const cartSubtotal = cart.reduce((total, item) => total + ((item.numericPrice || parsePrice(item.price)) * (item.quantity || 1)), 0);
  const wishlistCount = wishlist.length;
  const ordersCount = orders.length;

  return (
    <ShopContext.Provider value={{
      cart,
      wishlist,
      orders,
      cartCount,
      cartSubtotal,
      wishlistCount,
      ordersCount,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isInWishlist,
      removeFromWishlist,
      clearWishlist,
      moveAllWishlistToCart,
      createOrder,
      syncOrders,
      removeOrder,
      parsePrice
    }}>
      {children}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span style={{ color: '#10b981', fontSize: '18px' }}>✓</span>
          {toastMessage}
        </div>
      )}
    </ShopContext.Provider>
  );
};

