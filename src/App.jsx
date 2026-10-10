import React, { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import HeroSection from './components/HeroSection'
import CategorySection from './components/CategorySection'
import FeaturedProducts from './components/FeaturedProducts'
import BrandsSection from './components/BrandsSection'
import PromoBanners from './components/PromoBanners'
import AboutUs from './components/aboutus/AboutUs'
import ContactUs from './components/contactus/ContactUs'
import BestSellers from './components/BestSellers'
import LightingBanner from './components/LightingBanner'
import Footer from './components/Footer'
import ProductDetails from './components/ProductDetails'
import Faq from './components/faq/Faq'
import './App.css'

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const goToDetails = (product) => {
    setSelectedProduct(product);
    navigate('/product-details');
  };

  const goHome = () => {
    navigate('/');
  };

  const goToAboutUs = () => {
    navigate('/about-us');
  };

  const goToContactUs = () => {
    navigate('/contact-us');
  };

  const goToFaqs = () => {
    navigate('/faqs');
  };

  const isHome = location.pathname === '/';

  return (
    <>
      <HeroSection isHome={isHome} goHome={goHome} goToAboutUs={goToAboutUs} goToContactUs={goToContactUs} goToFaqs={goToFaqs} />
      <Routes>
        <Route path="/" element={
          <>
            <CategorySection />
            <FeaturedProducts onProductClick={goToDetails} />
            <LightingBanner />
            <BrandsSection />
            <PromoBanners />
            <BestSellers />
          </>
        } />
        <Route path="/about-us" element={
          <div style={{ padding: '40px 0' }}>
            <AboutUs />
          </div>
        } />
        <Route path="/contact-us" element={
          <ContactUs />
        } />
        <Route path="/product-details" element={
          <ProductDetails goHome={goHome} product={selectedProduct} />
        } />
        <Route path="/faqs" element={
          <Faq />
        } />
      </Routes>
      <Footer />
    </>
  )
}

function App() {
  return <AppContent />;
}

export default App
