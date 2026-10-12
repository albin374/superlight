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
import CompanyOverview from './components/companyoverview/CompanyOverview'
import LightingSolutions from './components/lightingsolutions/LightingSolutions'
import CableManagement from './components/cablemanagement/CableManagement'
import AdhesivesToolsHardware from './components/adhesivestoolshardware/AdhesivesToolsHardware'
import ElectricalAccessories from './components/electricalaccessories/ElectricalAccessories'
import PlumbingMaterials from './components/plumbingmaterials/PlumbingMaterials'
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

  const goToCompanyOverview = () => {
    navigate('/company-overview');
  };

  const goToLightingSolutions = () => {
    navigate('/lighting-solutions');
  };

  const goToCableManagement = () => {
    navigate('/cables-cable-management');
  };

  const goToAdhesivesToolsHardware = () => {
    navigate('/adhesives-tools-hardware');
  };

  const goToElectricalAccessories = () => {
    navigate('/electrical-accessories');
  };

  const goToPlumbingMaterials = () => {
    navigate('/plumbing-materials');
  };

  const isHome = location.pathname === '/';

  return (
    <>
      <HeroSection 
        isHome={isHome} 
        goHome={goHome} 
        goToAboutUs={goToAboutUs} 
        goToContactUs={goToContactUs} 
        goToFaqs={goToFaqs}
        goToCompanyOverview={goToCompanyOverview}
        goToLightingSolutions={goToLightingSolutions}
        goToCableManagement={goToCableManagement}
        goToAdhesivesToolsHardware={goToAdhesivesToolsHardware}
        goToElectricalAccessories={goToElectricalAccessories}
        goToPlumbingMaterials={goToPlumbingMaterials}
      />
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
        <Route path="/company-overview" element={
          <CompanyOverview />
        } />
        <Route path="/about-us" element={
          <AboutUs />
        } />
        <Route path="/contact-us" element={
          <ContactUs />
        } />
        <Route path="/lighting-solutions" element={
          <LightingSolutions onProductClick={goToDetails} />
        } />
        <Route path="/cables-cable-management" element={
          <CableManagement onProductClick={goToDetails} />
        } />
        <Route path="/cable-management" element={
          <CableManagement onProductClick={goToDetails} />
        } />
        <Route path="/cables" element={
          <CableManagement onProductClick={goToDetails} />
        } />
        <Route path="/adhesives-tools-hardware" element={
          <AdhesivesToolsHardware onProductClick={goToDetails} />
        } />
        <Route path="/adhesives-sealants" element={
          <AdhesivesToolsHardware onProductClick={goToDetails} />
        } />
        <Route path="/tools-hardware" element={
          <AdhesivesToolsHardware onProductClick={goToDetails} />
        } />
        <Route path="/electrical-accessories" element={
          <ElectricalAccessories onProductClick={goToDetails} />
        } />
        <Route path="/plumbing-materials" element={
          <PlumbingMaterials onProductClick={goToDetails} />
        } />
        <Route path="/plumbing" element={
          <PlumbingMaterials onProductClick={goToDetails} />
        } />
        <Route path="/product-details" element={
          <ProductDetails goHome={goHome} product={selectedProduct} />
        } />
        <Route path="/faqs" element={
          <Faq />
        } />
      </Routes>
      <Footer 
        goToCompanyOverview={goToCompanyOverview} 
        goToAdhesivesToolsHardware={goToAdhesivesToolsHardware} 
        goToElectricalAccessories={goToElectricalAccessories} 
        goToPlumbingMaterials={goToPlumbingMaterials}
      />
    </>
  )
}

function App() {
  return <AppContent />;
}

export default App
