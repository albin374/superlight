import React from 'react';
import BrandProductPage from './BrandProductPage';

const FlukeBrand = ({ onProductClick }) => {
  return (
    <BrandProductPage
      brandName="Fluke"
      heroTitle="Fluke Brand Products"
      heroHighlight="Brand Products"
      heroDesc="The world standard in professional digital multimeters, electrical testers, infrared thermometers, clamp meters, and calibration equipment."
      bannerImage="/Fluke .png"
      onProductClick={onProductClick}
    />
  );
};

export default FlukeBrand;
