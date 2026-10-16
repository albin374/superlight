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
import HomeAutomation from './components/homeautomation/HomeAutomation'
import SafetyProducts from './components/safetyproducts/SafetyProducts'
import AcSpareParts from './components/acspareparts/AcSpareParts'
import DewaltBrand from './components/brands/DewaltBrand'
import MakitaBrand from './components/brands/MakitaBrand'
import DucabBrand from './components/brands/DucabBrand'
import FlukeBrand from './components/brands/FlukeBrand'
import PhilipsBrand from './components/brands/PhilipsBrand'
import OsramBrand from './components/brands/OsramBrand'
import BeldenBrand from './components/brands/BeldenBrand'
import LegrandBrand from './components/brands/LegrandBrand'
import SchneiderBrand from './components/brands/SchneiderBrand'
import CartPage from './components/cart/CartPage'
import WishlistPage from './components/wishlist/WishlistPage'
import MyOrdersPage from './components/orders/MyOrdersPage'
import SearchResultsPage from './components/search/SearchResultsPage'
import { getProductUrl } from './utils/productUrl'
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
    const targetUrl = getProductUrl(product);
    navigate(targetUrl, { state: { product } });
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
    navigate('/led-lighting-special-lamp');
  };

  const goToCableManagement = () => {
    navigate('/wires-cables');
  };

  const goToWiresCables = () => {
    navigate('/wires-cables');
  };

  const goToLedLighting = () => {
    navigate('/led-lighting-special-lamp');
  };

  const goToSwitchesSockets = () => {
    navigate('/switches-sockets-electrical-accessories');
  };

  const goToAdhesivesToolsHardware = () => {
    navigate('/adhesives-tools-hardware');
  };

  const goToElectricalAccessories = () => {
    navigate('/switches-sockets-electrical-accessories');
  };

  const goToPlumbingMaterials = () => {
    navigate('/building-materials');
  };

  const goToHomeAutomation = () => {
    navigate('/switchgear-control-panel-products');
  };

  const goToSwitchgear = () => {
    navigate('/switchgear-control-panel-products');
  };

  const goToBuildingMaterials = () => {
    navigate('/building-materials');
  };

  const goToSafetyProducts = () => {
    navigate('/safety-products');
  };

  const goToAcSpareParts = () => {
    navigate('/ac-spare-parts');
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
        goToWiresCables={goToWiresCables}
        goToLedLighting={goToLedLighting}
        goToSwitchesSockets={goToSwitchesSockets}
        goToAdhesivesToolsHardware={goToAdhesivesToolsHardware}
        goToElectricalAccessories={goToElectricalAccessories}
        goToPlumbingMaterials={goToPlumbingMaterials}
        goToHomeAutomation={goToHomeAutomation}
        goToSwitchgear={goToSwitchgear}
        goToBuildingMaterials={goToBuildingMaterials}
        goToSafetyProducts={goToSafetyProducts}
        goToAcSpareParts={goToAcSpareParts}
        onProductClick={goToDetails}
      />
      <Routes>
        <Route path="/" element={
          <>
            <CategorySection />
            <FeaturedProducts onProductClick={goToDetails} />
            <LightingBanner />
            <BrandsSection />
            <PromoBanners />
            <BestSellers onProductClick={goToDetails} />
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
        <Route path="/wires-cables" element={
          <CableManagement onProductClick={goToDetails} />
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
        <Route path="/led-lighting-special-lamp" element={
          <LightingSolutions onProductClick={goToDetails} />
        } />
        <Route path="/lighting-solutions" element={
          <LightingSolutions onProductClick={goToDetails} />
        } />
        <Route path="/lighting" element={
          <LightingSolutions onProductClick={goToDetails} />
        } />
        <Route path="/switches-sockets-electrical-accessories" element={
          <ElectricalAccessories onProductClick={goToDetails} />
        } />
        <Route path="/electrical-accessories" element={
          <ElectricalAccessories onProductClick={goToDetails} />
        } />
        <Route path="/switches" element={
          <ElectricalAccessories onProductClick={goToDetails} />
        } />
        <Route path="/plumbing-materials" element={
          <PlumbingMaterials 
            onProductClick={goToDetails} 
            title="Plumbing Materials"
            highlightWord="Materials"
            description="High-grade pipes, heavy-duty fittings, pressure valves, and specialized plumbing supplies designed for leak-free, long-lasting fluid handling."
          />
        } />
        <Route path="/plumbing" element={
          <PlumbingMaterials 
            onProductClick={goToDetails} 
            title="Plumbing Materials"
            highlightWord="Materials"
            description="High-grade pipes, heavy-duty fittings, pressure valves, and specialized plumbing supplies designed for leak-free, long-lasting fluid handling."
          />
        } />
        <Route path="/building-materials" element={
          <PlumbingMaterials 
            onProductClick={goToDetails} 
            title="Building Materials & Supplies"
            highlightWord="Supplies"
            description="Top-tier construction materials, robust piping systems, plumbing valves, and fittings engineered to international standards for commercial and residential infrastructure."
          />
        } />
        <Route path="/home-automation" element={
          <HomeAutomation 
            onProductClick={goToDetails} 
            title="Home Automation Solutions"
            highlightWord="Solutions"
            description="Intelligent smart living solutions, automation controllers, digital relays, and connected panels for modern residential and commercial control."
          />
        } />
        <Route path="/smart-home" element={
          <HomeAutomation 
            onProductClick={goToDetails} 
            title="Home Automation Solutions"
            highlightWord="Solutions"
            description="Intelligent smart living solutions, automation controllers, digital relays, and connected panels for modern residential and commercial control."
          />
        } />
        <Route path="/switchgear-control-panel-products" element={
          <HomeAutomation 
            onProductClick={goToDetails} 
            title="Switchgear & Control Panel Products"
            highlightWord="Products"
            description="Comprehensive electrical switchgear, circuit protection, smart control panels, and automation devices engineered for dependable performance and power management."
          />
        } />
        <Route path="/switchgear" element={
          <HomeAutomation 
            onProductClick={goToDetails} 
            title="Switchgear & Control Panel Products"
            highlightWord="Products"
            description="Comprehensive electrical switchgear, circuit protection, smart control panels, and automation devices engineered for dependable performance and power management."
          />
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
        <Route path="/safety-products" element={
          <SafetyProducts onProductClick={goToDetails} />
        } />
        <Route path="/safety" element={
          <SafetyProducts onProductClick={goToDetails} />
        } />
        <Route path="/ac-spare-parts" element={
          <AcSpareParts onProductClick={goToDetails} />
        } />
        <Route path="/ac-spair-parts" element={
          <AcSpareParts onProductClick={goToDetails} />
        } />
        <Route path="/hvac" element={
          <AcSpareParts onProductClick={goToDetails} />
        } />
        <Route path="/product-details" element={
          <ProductDetails goHome={goHome} product={selectedProduct} />
        } />
        <Route path="/faqs" element={
          <Faq />
        } />
        {/* Brand Dedicated Store Pages */}
        <Route path="/dewalt" element={<DewaltBrand onProductClick={goToDetails} />} />
        <Route path="/brand/dewalt" element={<DewaltBrand onProductClick={goToDetails} />} />
        
        <Route path="/makita" element={<MakitaBrand onProductClick={goToDetails} />} />
        <Route path="/brand/makita" element={<MakitaBrand onProductClick={goToDetails} />} />
        
        <Route path="/ducab" element={<DucabBrand onProductClick={goToDetails} />} />
        <Route path="/brand/ducab" element={<DucabBrand onProductClick={goToDetails} />} />
        
        <Route path="/fluke" element={<FlukeBrand onProductClick={goToDetails} />} />
        <Route path="/brand/fluke" element={<FlukeBrand onProductClick={goToDetails} />} />
        
        <Route path="/philips" element={<PhilipsBrand onProductClick={goToDetails} />} />
        <Route path="/brand/philips" element={<PhilipsBrand onProductClick={goToDetails} />} />
        
        <Route path="/osram" element={<OsramBrand onProductClick={goToDetails} />} />
        <Route path="/brand/osram" element={<OsramBrand onProductClick={goToDetails} />} />
        
        <Route path="/belden" element={<BeldenBrand onProductClick={goToDetails} />} />
        <Route path="/brand/belden" element={<BeldenBrand onProductClick={goToDetails} />} />
        
        <Route path="/legrand" element={<LegrandBrand onProductClick={goToDetails} />} />
        <Route path="/brand/legrand" element={<LegrandBrand onProductClick={goToDetails} />} />
        
        <Route path="/schneider" element={<SchneiderBrand onProductClick={goToDetails} />} />
        <Route path="/schneider-electric" element={<SchneiderBrand onProductClick={goToDetails} />} />
        <Route path="/brand/schneider" element={<SchneiderBrand onProductClick={goToDetails} />} />
        <Route path="/brand/schneider-electric" element={<SchneiderBrand onProductClick={goToDetails} />} />

        {/* Cart & Wishlist Pages */}
        <Route path="/cart" element={<CartPage onProductClick={goToDetails} />} />
        <Route path="/shopping-cart" element={<CartPage onProductClick={goToDetails} />} />
        <Route path="/wishlist" element={<WishlistPage onProductClick={goToDetails} />} />
        <Route path="/my-wishlist" element={<WishlistPage onProductClick={goToDetails} />} />

        {/* My Orders Pages */}
        <Route path="/my-orders" element={<MyOrdersPage onProductClick={goToDetails} />} />
        <Route path="/orders" element={<MyOrdersPage onProductClick={goToDetails} />} />

        {/* Catalog Search Route */}
        <Route path="/search" element={<SearchResultsPage onProductClick={goToDetails} />} />

        {/* Semantic Hierarchical Product Details Routes */}
        <Route path="/:categorySlug/:subcategorySlug/:productSlug" element={<ProductDetails goHome={goHome} product={selectedProduct} />} />
        <Route path="/:categorySlug/:productSlug" element={<ProductDetails goHome={goHome} product={selectedProduct} />} />
      </Routes>
      <Footer 
        goToCompanyOverview={goToCompanyOverview} 
        goToAdhesivesToolsHardware={goToAdhesivesToolsHardware} 
        goToElectricalAccessories={goToElectricalAccessories} 
        goToPlumbingMaterials={goToPlumbingMaterials}
        goToHomeAutomation={goToHomeAutomation}
      />
    </>
  )
}

function App() {
  return <AppContent />;
}

export default App
