import React from 'react'
import HeroSection from './components/HeroSection'
import CategorySection from './components/CategorySection'
import FeaturedProducts from './components/FeaturedProducts'
import BrandsSection from './components/BrandsSection'
import PromoBanners from './components/PromoBanners'
import AboutSection from './components/AboutSection'
import BestSellers from './components/BestSellers'
import LightingBanner from './components/LightingBanner'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <>
      <HeroSection />
      <CategorySection />
      <FeaturedProducts />
      <LightingBanner />
      <BrandsSection />
      <PromoBanners />
      <BestSellers />
      <AboutSection />
      <Footer />
    </>
  )
}

export default App
