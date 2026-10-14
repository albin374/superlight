import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  Trash2, 
  ShoppingCart, 
  ArrowRight, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import WhatsAppOrderModal, { WhatsAppIcon } from '../common/WhatsAppOrderModal';
import { getProductUrl } from '../../utils/productUrl';
import './WishlistPage.css';

const WishlistPage = ({ onProductClick }) => {
  const navigate = useNavigate();
  const { 
    wishlist, 
    wishlistCount, 
    removeFromWishlist, 
    clearWishlist, 
    addToCart, 
    moveAllWishlistToCart 
  } = useShop();

  // Order via WhatsApp modal state
  const [waProduct, setWaProduct] = useState(null);
  const [addedMap, setAddedMap] = useState({});

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedMap(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedMap(prev => ({ ...prev, [product.id]: false }));
    }, 1800);
  };

  const handleProductClick = (item) => {
    if (onProductClick) {
      onProductClick(item);
    } else {
      navigate(getProductUrl(item), { state: { product: item } });
    }
  };

  return (
    <div className="wishlist-page">
      <div className="wishlist-container">

        {/* Breadcrumbs */}
        <div className="wishlist-breadcrumbs">
          <Link to="/">Home</Link>
          <ChevronRightIcon />
          <span>My Wishlist</span>
        </div>

        {/* Page Header */}
        <div className="wishlist-header">
          <div className="wishlist-header-left">
            <h1 className="wishlist-title">My Wishlist</h1>
            <span className="wishlist-count">{wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}</span>
          </div>

          {wishlist.length > 0 && (
            <div className="wishlist-header-actions">
              <button 
                type="button" 
                className="wishlist-move-all-btn"
                onClick={moveAllWishlistToCart}
              >
                <ShoppingCart size={15} />
                Move All to Cart
              </button>
              <button 
                type="button" 
                className="wishlist-clear-btn"
                onClick={clearWishlist}
              >
                <Trash2 size={15} />
                Clear Wishlist
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {wishlist.length === 0 ? (
          <div className="wishlist-empty-state">
            <div className="wishlist-empty-icon-wrap">
              <Heart size={44} />
            </div>
            <h2 className="wishlist-empty-title">Your Wishlist is Empty</h2>
            <p className="wishlist-empty-text">
              Save your favorite lighting solutions, tools, wires, and equipment by tapping the heart icon on any product.
            </p>
            <button 
              type="button" 
              className="wishlist-empty-btn"
              onClick={() => navigate('/')}
            >
              Explore Products <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="wishlist-grid">
            {wishlist.map((item) => {
              const isAdded = !!addedMap[item.id];

              return (
                <div 
                  key={item.id} 
                  className="wishlist-card"
                  onClick={() => handleProductClick(item)}
                >
                  {/* Remove from Wishlist button */}
                  <button 
                    type="button" 
                    className="wishlist-remove-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(item.id);
                    }}
                    title="Remove from wishlist"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 size={15} />
                  </button>

                  {/* Image */}
                  <div className="wishlist-img-wrap">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="wishlist-img"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/prod_downlight_1791451418016.png'; }}
                    />
                  </div>

                  {/* Card Body */}
                  <div className="wishlist-card-body">
                    <span className="wishlist-brand">{item.brand || 'Super Light'}</span>
                    <h3 className="wishlist-product-name" title={item.name}>
                      {item.name}
                    </h3>

                    {/* Price */}
                    <div className="wishlist-price-row">
                      <span className="wishlist-price">{item.price}</span>
                      {item.oldPrice && (
                        <span className="wishlist-old-price">{item.oldPrice}</span>
                      )}
                    </div>

                    {/* Add to Cart button */}
                    <button 
                      type="button"
                      className="wishlist-add-cart-btn"
                      onClick={(e) => handleAddToCart(e, item)}
                    >
                      {isAdded ? (
                        <>
                          <Check size={16} />
                          Added to Cart
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={16} />
                          Add to Cart
                        </>
                      )}
                    </button>

                    {/* Order via WhatsApp button */}
                    <button 
                      type="button"
                      className="wishlist-whatsapp-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setWaProduct(item);
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
        )}

      </div>

      {/* WhatsApp Modal */}
      <WhatsAppOrderModal 
        isOpen={!!waProduct} 
        product={waProduct} 
        onClose={() => setWaProduct(null)} 
      />
    </div>
  );
};

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default WishlistPage;

