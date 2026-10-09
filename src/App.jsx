import React, { useState } from 'react'
import HeroSection from './components/HeroSection'
import CategorySection from './components/CategorySection'
import FeaturedProducts from './components/FeaturedProducts'
import BrandsSection from './components/BrandsSection'
import PromoBanners from './components/PromoBanners'
import AboutUs from './components/aboutus/AboutUs'
import BestSellers from './components/BestSellers'
import LightingBanner from './components/LightingBanner'
import Footer from './components/Footer'
import ProductDetails from './components/ProductDetails'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const goToDetails = (product) => {
    setSelectedProduct(product);
    setCurrentPage('details');
    window.scrollTo(0, 0);
  };

  const goHome = () => {
    setCurrentPage('home');
    window.scrollTo(0, 0);
  };

  const goToAboutUs = () => {
    setCurrentPage('about');
    window.scrollTo(0, 0);
  };

  return (
    <>
      <HeroSection isHome={currentPage === 'home'} goHome={goHome} goToAboutUs={goToAboutUs} />
      {currentPage === 'home' && (
        <>
          <CategorySection />
          <FeaturedProducts onProductClick={goToDetails} />
          <LightingBanner />
          <BrandsSection />
          <PromoBanners />
          <BestSellers />
        </>
      )}
      {currentPage === 'about' && (
        <div style={{ padding: '40px 0' }}>
          <AboutUs />
        </div>
      )}
      {currentPage === 'details' && (
        <ProductDetails goHome={goHome} product={selectedProduct} />
      )}
      <Footer />
    </>
  )
}

export default App
