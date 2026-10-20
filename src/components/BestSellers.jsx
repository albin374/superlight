import React, { useState, useEffect, useMemo } from 'react';
import { Heart, ShoppingCart, ArrowRight, Plus, Minus } from 'lucide-react';
import './BestSellers.css';
import WhatsAppOrderModal, { WhatsAppIcon } from './common/WhatsAppOrderModal';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Legrand 2 Gang Switch White',
    price: 'AED 28.00',
    image: '/switch.png',
    brand: 'LEGRAND',
    category_slug: 'switches-sockets-electrical-accessories',
    subcategory_slug: 'wall-switches-dimmers'
  },
  {
    id: 2,
    name: 'Fluke 62 MAX MINI Thermometer',
    price: 'AED 350.00',
    image: '/Fluke 62 MAX MINI Thermometer.png',
    brand: 'FLUKE',
    category_slug: 'adhesives-tools-hardware',
    subcategory_slug: 'hand-tools'
  },
  {
    id: 3,
    name: 'Fluke T140 Voltage Tester with Probes',
    price: 'AED 480.00',
    image: '/Fluke T140 Voltage Tester with Probes.png',
    brand: 'FLUKE',
    category_slug: 'adhesives-tools-hardware',
    subcategory_slug: 'hand-tools'
  },
  {
    id: 4,
    name: 'Schneider RCCB 40A 2P',
    price: 'AED 95.00',
    image: '/prod_mcb_1791451449276.png',
    brand: 'SCHNEIDER',
    category_slug: 'switchgear-control-panel-products',
    subcategory_slug: 'mcb'
  },
  {
    id: 5,
    name: 'LED Street Light 150W IP65',
    price: 'AED 280.00',
    image: '/prod_floodlight_1791451459906.png',
    brand: 'PHILIPS',
    category_slug: 'led-lighting-special-lamp',
    subcategory_slug: 'street-lights'
  }
];

const BestSellers = ({ onProductClick }) => {
  const [dbProducts, setDbProducts] = useState([]);
  const [waProduct, setWaProduct] = useState(null);
  const [quantities, setQuantities] = useState({});
  const { addToCart, toggleWishlist, isInWishlist } = useShop();
  const { requireAuth } = useAuth();

  const getQty = (productId) => quantities[productId] || 1;

  const updateQty = (e, productId, delta) => {
    e.stopPropagation();
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0 && isMounted) {
          const formatted = data.products.map(p => {
            const pPrice = typeof p.price === 'number' ? `AED ${p.price.toFixed(2)}` : p.price;
            const mainImg = (Array.isArray(p.images) && p.images.length > 0) ? p.images[0] : (p.image || '/prod_downlight_1791451418016.png');
            return {
              id: `db-${p.id}`,
              realId: p.id,
              name: p.name,
              price: pPrice,
              image: mainImg,
              images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [mainImg],
              brand: p.brand || '',
              category: p.category_name || '',
              category_name: p.category_name || '',
              category_slug: p.category_slug || '',
              subcategory_name: p.subcategory_name || '',
              subcategory_slug: p.subcategory_slug || '',
              sku: p.sku || '',
              rating: p.rating || 5,
              reviews: p.reviews_count || 24,
              description: p.description || '',
              is_featured: Number(p.is_featured) === 1 || p.is_featured === true,
              is_bestseller: Number(p.is_bestseller) === 1 || p.is_bestseller === true,
              isDbProduct: true
            };
          });
          setDbProducts(formatted);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const displayedProducts = useMemo(() => {
    let pool = dbProducts.length > 0 ? dbProducts : DEFAULT_PRODUCTS;

    if (dbProducts.length > 0) {
      const bestsellers = dbProducts.filter(p => p.is_bestseller);
      if (bestsellers.length > 0) {
        pool = bestsellers;
      }
    }

    // Sort latest bestseller products first (newest/highest ID first)
    pool = [...pool].sort((a, b) => {
      const idA = typeof a.realId === 'number' ? a.realId : (typeof a.id === 'number' ? a.id : 0);
      const idB = typeof b.realId === 'number' ? b.realId : (typeof b.id === 'number' ? b.id : 0);
      return idB - idA;
    });

    // Show only in 1 row (max 5 items)
    return pool.slice(0, 5);
  }, [dbProducts]);

  return (
    <div className="best-sellers-section">
      <div className="container">

        <div className="best-sellers-header">
          <div className="best-sellers-header-left">
            <h4 className="best-sellers-subtitle">BEST SELLING PRODUCTS</h4>
            <h2 className="best-sellers-title">Our Best Sellers</h2>
          </div>
          <a href="/wires-cables" className="bs-view-all">
            View All Products <ArrowRight size={16} />
          </a>
        </div>

        <div className="bs-products-grid">
          {displayedProducts.map(product => {
            const isFavorited = isInWishlist(product.id);

            return (
              <div 
                key={product.id} 
                className="bs-product-card"
                onClick={() => onProductClick && onProductClick(product)}
                style={{ cursor: 'pointer' }}
              >
                <button 
                  className="bs-heart-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  title={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart 
                    size={20} 
                    className="heart-icon" 
                    fill={isFavorited ? '#E5007D' : 'none'} 
                    color={isFavorited ? '#E5007D' : '#1b253c'} 
                  />
                </button>

                <div className="bs-product-image-wrapper">
                  <img src={product.image} alt={product.name} className="bs-product-image" />
                </div>

                <div className="bs-product-details">
                  <h3 className="bs-product-name">{(product.name || '').toUpperCase()}</h3>
                  <div className="bs-product-price-row">
                    <p className="bs-product-price">{product.price}</p>
                    <div className="bs-product-qty-selector" onClick={(e) => e.stopPropagation()}>
                      <button 
                        type="button" 
                        className="bs-qty-btn minus" 
                        onClick={(e) => updateQty(e, product.id, -1)}
                        disabled={getQty(product.id) <= 1}
                        title="Decrease quantity"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="bs-qty-value">{getQty(product.id)}</span>
                      <button 
                        type="button" 
                        className="bs-qty-btn plus" 
                        onClick={(e) => updateQty(e, product.id, 1)}
                        title="Increase quantity"
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                  <button 
                    className="bs-add-to-cart-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product, getQty(product.id));
                    }}
                  >
                    <ShoppingCart size={16} />
                    Add to Cart
                  </button>
                  <button 
                    type="button" 
                    className="bs-whatsapp-btn" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      requireAuth(() => setWaProduct({ ...product, quantity: getQty(product.id) }), {
                        message: 'Please login first and then continue',
                        subtitle: 'Please login to your account to order via WhatsApp. If you do not have an account, please register to proceed.'
                      });
                    }}
                    title="Order via WhatsApp"
                    aria-label="Order via WhatsApp"
                  >
                    <WhatsAppIcon size={16} />
                    <span>Order via</span>
                  </button>
                </div>
            </div>
            );
          })}
        </div>

      </div>

      <WhatsAppOrderModal 
        isOpen={!!waProduct} 
        product={waProduct} 
        onClose={() => setWaProduct(null)} 
      />
    </div>
  );
};

export default BestSellers;
