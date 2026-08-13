import React from 'react';

import ProductSelector, { PACK_OPTIONS } from './ProductSelector';

export default function ProductsPage({
  products = [],
  selectedPack,
  setSelectedPack,
  onAddToCart,
  onBuyNow,
  quantity,
  setQuantity,
  activeImageIndex,
  setActiveImageIndex,
  settings
}) {


  return (
    <div className="bg-[#FDFBF7] min-h-screen pt-28 pb-16 selection:bg-[#7A8B6F] selection:text-white">




      {/* Detailed Product Selector Configurator */}
      <div id="product-detail-configurator">
        <ProductSelector
          products={products}
          onAddToCart={onAddToCart}
          onBuyNow={onBuyNow}
          selectedPack={selectedPack}
          quantity={quantity}
          setQuantity={setQuantity}
          activeImageIndex={activeImageIndex}
          setActiveImageIndex={setActiveImageIndex}
          settings={settings}
        />
      </div>


    </div>
  );
}
