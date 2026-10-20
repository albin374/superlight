import React, { useState, useEffect, useMemo } from 'react';
import { Heart, ShoppingCart, ArrowRight, Plus, Minus } from 'lucide-react';
import './FeaturedProducts.css';
import './BestSellers.css';
import WhatsAppOrderModal, { WhatsAppIcon } from './common/WhatsAppOrderModal';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Philips LED Downlight 15W Round (Cool White)',
    price: 'AED 35.00',
    image: '/prod_downlight_1791451418016.png',
    brand: 'PHILIPS',
    category_slug: 'led-lighting-special-lamp',
    category_name: 'LED Lighting & Special Lamp',
    subcategory_slug: 'down-lights',
    subcategory_name: 'Down Lights'
  },
  {
    id: 2,
    name: 'Ducab Electrical Cable 3 Core 2.5mm (100m)',
    price: 'AED 320.00',
    image: '/prod_cable_1791451428788.png',
    brand: 'DUCAB',
    category_slug: 'wires-cables',
    category_name: 'Wires & Cables',
    subcategory_slug: 'building-wires',
    subcategory_name: 'Building Wires'
  },
  {
    id: 3,
    name: 'Legrand 13A Switch Socket White',
    price: 'AED 18.00',
    image: '/prod_socket_1791451439423.png',
    brand: 'LEGRAND',
    category_slug: 'switches-sockets-electrical-accessories',
    category_name: 'Switches, Sockets & Electrical Accessories',
    subcategory_slug: 'power-sockets-outlets',
    subcategory_name: 'Power Sockets & Outlets'
  },
  {
    id: 4,
    name: 'Schneider MCB 63A 1P',
    price: 'AED 25.00',
    image: '/prod_mcb_1791451449276.png',
    brand: 'SCHNEIDER',
    category_slug: 'switchgear-control-panel-products',
    category_name: 'Switchgear & Control Panel Products',
    subcategory_slug: 'mcb',
    subcategory_name: 'MCB'
  },
  {
    id: 5,
    name: 'LED Flood Light 100W IP65 (Outdoor)',
    price: 'AED 120.00',
    image: '/prod_floodlight_1791451459906.png',
    brand: 'PHILIPS',
    category_slug: 'led-lighting-special-lamp',
    category_name: 'LED Lighting & Special Lamp',
    subcategory_slug: 'flood-lights',
    subcategory_name: 'Flood Lights'
  }
];

const categories = ['All', 'Lighting', 'Switches', 'Cables', 'Electrical Equipment', 'Tools'];

const FeaturedProducts = ({ onProductClick }) => {
  const [dbProducts, setDbProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
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
      const featuredOnly = dbProducts.filter(p => p.is_featured);
      if (featuredOnly.length > 0) {
        pool = featuredOnly;
      }
    }

    // Sort latest featured product first by first (highest/newest ID first)
    pool = [...pool].sort((a, b) => {
      const idA = typeof a.realId === 'number' ? a.realId : (typeof a.id === 'number' ? a.id : 0);
      const idB = typeof b.realId === 'number' ? b.realId : (typeof b.id === 'number' ? b.id : 0);
      return idB - idA;
    });

    if (selectedCategory === 'All') {
      // Show only in 1 row (max 5 items)
      return pool.slice(0, 5);
    }

    const catLower = selectedCategory.toLowerCase();
    const filtered = pool.filter(p => {
      const cat = (p.category_name || p.category || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      if (catLower === 'lighting') return cat.includes('light') || name.includes('light') || name.includes('lamp');
      if (catLower === 'switches') return cat.includes('switch') || cat.includes('socket') || name.includes('switch') || name.includes('socket');
      if (catLower === 'cables') return cat.includes('cable') || cat.includes('wire') || name.includes('cable') || name.includes('wire');
      if (catLower.includes('equipment') || catLower.includes('electrical')) return cat.includes('switchgear') || name.includes('mcb') || name.includes('breaker');
      if (catLower === 'tools') return cat.includes('tool') || name.includes('tester') || name.includes('drill');
      return true;
    });

    // Show only in 1 row (max 5 items)
    return filtered.slice(0, 5);
  }, [dbProducts, selectedCategory]);

  return (
    <div className="featured-section" id="featured-products">
      <div className="container">
        
        <div className="featured-header-top">
          <h4 className="featured-subtitle">FEATURED PRODUCTS</h4>
          <a href="/wires-cables" className="view-all">
            View All Products <ArrowRight size={16} />
          </a>
        </div>
        
        <div className="featured-header-bottom">
          <h2 className="featured-title">Popular Electrical Products</h2>
          <div className="featured-filters">
            {categories.map((category, index) => (
              <button 
                key={index} 
                className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {(category || '').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="products-grid">
          {displayedProducts.map(product => {
            const isFavorited = isInWishlist(product.id);

            return (
              <div key={product.id} className="bs-product-card product-card" onClick={() => onProductClick(product)} style={{cursor: 'pointer'}}>
                <button 
                  className="bs-heart-btn heart-btn" 
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
                
                <div className="bs-product-image-wrapper product-image-wrapper">
                  <img src={product.image} alt={product.name} className="bs-product-image product-image" />
                </div>
                
                <div className="bs-product-details product-details">
                  <h3 className="bs-product-name product-name">{(product.name || '').toUpperCase()}</h3>
                  <div className="bs-product-price-row product-price-row">
                    <p className="bs-product-price product-price">{product.price}</p>
                    <div className="bs-product-qty-selector product-qty-selector" onClick={(e) => e.stopPropagation()}>
                      <button 
                        type="button" 
                        className="bs-qty-btn qty-btn minus" 
                        onClick={(e) => updateQty(e, product.id, -1)}
                        disabled={getQty(product.id) <= 1}
                        title="Decrease quantity"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="bs-qty-value qty-value">{getQty(product.id)}</span>
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
                    className="bs-add-to-cart-btn add-to-cart-btn" 
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
                    className="bs-whatsapp-btn fp-whatsapp-btn" 
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

export default FeaturedProducts;
