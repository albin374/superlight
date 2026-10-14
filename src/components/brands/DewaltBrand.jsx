import React from 'react';
import BrandProductPage from './BrandProductPage';

const DewaltBrand = ({ onProductClick }) => {
  return (
    <BrandProductPage
      brandName="DeWalt"
      heroTitle="DeWalt Brand Products"
      heroHighlight="Brand Products"
      heroDesc="Guaranteed Tough®. High-performance cordless power tools, heavy-duty brushless hammer drills, angle grinders, and industrial jobsite equipment."
      bannerImage="/DEWALT .png"
      onProductClick={onProductClick}
    />
  );
};

export default DewaltBrand;
