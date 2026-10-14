import React, { useState, useEffect, useMemo } from 'react';
import { Heart, ShoppingCart, ArrowRight } from 'lucide-react';
import './FeaturedProducts.css';
import WhatsAppOrderModal, { WhatsAppIcon } from './common/WhatsAppOrderModal';
import { useShop } from '../context/ShopContext';

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
  const { addToCart, toggleWishlist, isInWishlist } = useShop();

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
              is_featured: !!p.is_featured,
              is_bestseller: !!p.is_bestseller,
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

    if (selectedCategory === 'All') return pool;

    const catLower = selectedCategory.toLowerCase();
    return pool.filter(p => {
      const cat = (p.category_name || p.category || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      if (catLower === 'lighting') return cat.includes('light') || name.includes('light') || name.includes('lamp');
      if (catLower === 'switches') return cat.includes('switch') || cat.includes('socket') || name.includes('switch') || name.includes('socket');
      if (catLower === 'cables') return cat.includes('cable') || cat.includes('wire') || name.includes('cable') || name.includes('wire');
      if (catLower.includes('equipment') || catLower.includes('electrical')) return cat.includes('switchgear') || name.includes('mcb') || name.includes('breaker');
      if (catLower === 'tools') return cat.includes('tool') || name.includes('tester') || name.includes('drill');
      return true;
    });
  }, [dbProducts, selectedCategory]);

  return (
    <div className="featured-section">
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
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="products-grid">
          {displayedProducts.map(product => {
            const isFavorited = isInWishlist(product.id);

            return (
              <div key={product.id} className="product-card" onClick={() => onProductClick(product)} style={{cursor: 'pointer'}}>
                <button 
                  className="heart-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                  }}
                  title={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart 
                    size={20} 
                    className="heart-icon" 
                    fill={isFavorited ? '#e6005c' : 'none'} 
                    color={isFavorited ? '#e6005c' : '#1b253c'} 
                  />
                </button>
                
                <div className="product-image-wrapper">
                  <img src={product.image} alt={product.name} className="product-image" />
                </div>
                
                <div className="product-details">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">{product.price}</p>
                  <button 
                    className="add-to-cart-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product, 1);
                    }}
                  >
                    <ShoppingCart size={16} />
                    Add to Cart
                  </button>
                <button 
                  type="button" 
                  className="fp-whatsapp-btn" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setWaProduct(product); 
                  }}
                >
                  <WhatsAppIcon size={16} />
                  Order via WhatsApp
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
