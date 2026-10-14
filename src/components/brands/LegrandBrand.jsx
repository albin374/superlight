import React from 'react';
import BrandProductPage from './BrandProductPage';

const LegrandBrand = ({ onProductClick }) => {
  return (
    <BrandProductPage
      brandName="Legrand"
      heroTitle="Legrand Brand Products"
      heroHighlight="Brand Products"
      heroDesc="Global specialist in electrical and digital building infrastructures, premium wiring devices, smart switches, sockets, and enclosure systems."
      bannerImage="/Legrand .png"
      onProductClick={onProductClick}
    />
  );
};

export default LegrandBrand;
