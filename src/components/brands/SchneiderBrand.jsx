import React from 'react';
import BrandProductPage from './BrandProductPage';

const SchneiderBrand = ({ onProductClick }) => {
  return (
    <BrandProductPage
      brandName="Schneider Electric"
      heroTitle="Schneider Electric Brand Products"
      heroHighlight="Brand Products"
      heroDesc="Global specialist in digital energy management, Acti9 miniature circuit breakers, Compact NSX MCCBs, TeSys contactors, and electrical panel solutions."
      bannerImage="/Schneider .png"
      onProductClick={onProductClick}
    />
  );
};

export default SchneiderBrand;
