import React from 'react';
import { Helmet } from 'react-helmet-async';

import ProductSelector, { PACK_OPTIONS } from './ProductSelector';
import ProductDetails from './ProductDetails';

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
    <div className="bg-[#FDFBF7] min-h-screen pt-10 lg:pt-14 pb-16 selection:bg-[#7A8B6F] selection:text-white">
      <Helmet>
        {/* Primary SEO Tags */}
        <title>Kesar Soap | Handmade Natural Soap by Hausmade</title>
        <meta name="description" content="Discover Hausmade Kesar Soap, a handcrafted natural soap made with carefully selected ingredients for a gentle, refreshing and luxurious bathing experience." />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href="https://hausmade.in/products" />

        {/* Open Graph Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Kesar Soap | Handmade Natural Soap by Hausmade" />
        <meta property="og:description" content="Discover Hausmade Kesar Soap, a handcrafted natural soap made with carefully selected ingredients for a gentle, refreshing and luxurious bathing experience." />
        <meta property="og:url" content="https://hausmade.in/products" />
        <meta property="og:site_name" content="Hausmade" />
        <meta property="og:image" content="https://hausmade.in/SEO_Image.jpeg" />
        <meta property="og:image:alt" content="Hausmade Kesar Soap" />
        <meta property="og:locale" content="en_IN" />

        {/* Twitter / X Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Kesar Soap | Handmade Natural Soap by Hausmade" />
        <meta name="twitter:description" content="Discover Hausmade Kesar Soap, a handcrafted natural soap made with carefully selected ingredients for a gentle, refreshing and luxurious bathing experience." />
        <meta name="twitter:image" content="https://hausmade.in/SEO_Image.jpeg" />
      </Helmet>

      {/* Detailed Product Selector Configurator */}
      <div id="product-detail-configurator">
        <ProductSelector
          products={products}
          onAddToCart={onAddToCart}
          onBuyNow={onBuyNow}
          selectedPack={selectedPack}
          setSelectedPack={setSelectedPack}
          quantity={quantity}
          setQuantity={setQuantity}
          activeImageIndex={activeImageIndex}
          setActiveImageIndex={setActiveImageIndex}
          settings={settings}
        />
      </div>

      {/* Product Deep Dive / Details */}
      <ProductDetails settings={settings} />


    </div>
  );
}
