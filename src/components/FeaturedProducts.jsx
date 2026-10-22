import React, { useState, useEffect, useMemo } from 'react';
import { Heart, ShoppingCart, ArrowRight, Plus, Minus } from 'lucide-react';
import './FeaturedProducts.css';
import './BestSellers.css';
import WhatsAppOrderModal, { WhatsAppIcon } from './common/WhatsAppOrderModal';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';

const categories = ['All', 'Lighting', 'Switches', 'Cables', 'Electrical Equipment', 'Tools'];

const FeaturedProducts = ({ onProductClick }) => {
  const [dbProducts, setDbProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
    setIsLoading(true);
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.products) && isMounted) {
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
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const displayedProducts = useMemo(() => {
    if (dbProducts.length === 0) return [];

    let pool = dbProducts.filter(p => p.is_featured);
    if (pool.length === 0) {
      pool = dbProducts;
    }

    // Sort latest featured product first (highest/newest ID first)
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
      const cat = (p.category_name || p.category || p.category_slug || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      if (catLower === 'lighting') return cat.includes('light') || cat.includes('lamp') || name.includes('light') || name.includes('lamp');
      if (catLower === 'switches') return cat.includes('switch') || cat.includes('socket') || name.includes('switch') || name.includes('socket');
      if (catLower === 'cables') return cat.includes('cable') || cat.includes('wire') || name.includes('cable') || name.includes('wire');
      if (catLower.includes('equipment') || catLower.includes('electrical')) return cat.includes('switchgear') || cat.includes('control') || name.includes('mcb') || name.includes('breaker');
      if (catLower === 'tools') return cat.includes('tool') || cat.includes('hardware') || name.includes('tester') || name.includes('drill');
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
          {isLoading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              Loading products...
            </div>
          ) : displayedProducts.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '14px' }}>
              No featured products found.
            </div>
          ) : (
            displayedProducts.map(product => {
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
          }))}
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
