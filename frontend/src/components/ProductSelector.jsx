import React, { useState } from 'react';
import { Star, Check, Plus, Minus, ShieldCheck, Truck, RotateCcw, Sparkles, RefreshCw, Heart } from 'lucide-react';

export const PACK_OPTIONS = [
  {
    id: 'single',
    title: 'Single Soap Bar (75g)',
    count: 1,
    basePrice: 299.00,
    savingsBadge: null,
    popular: false,
    bestValue: false,
    image: '/images/pack-single.png'
  },
  {
    id: 'pack-2',
    title: 'Pack of 2',
    count: 2,
    basePrice: 538.00, // ~10% off
    savingsBadge: 'Save 10%',
    popular: false,
    bestValue: false,
    image: '/images/pack-2.png'
  },
  {
    id: 'pack-3',
    title: 'Pack of 3',
    count: 3,
    basePrice: 717.00, // ~20% off
    savingsBadge: 'Save 20%',
    popular: true,
    bestValue: false,
    image: '/images/pack-3.png'
  },
  {
    id: 'pack-5',
    title: 'Pack of 5',
    count: 5,
    basePrice: 1046.00, // ~30% off
    savingsBadge: 'Save 30%',
    popular: false,
    bestValue: true,
    image: '/images/pack-5.png'
  },
];

export default function ProductSelector({ products = [], onAddToCart, onBuyNow, selectedPack, quantity, setQuantity, activeImageIndex, setActiveImageIndex, settings }) {
  const isSubscription = false;

  const items = (products && products.length > 0 ? products : PACK_OPTIONS).filter(p => p.active !== false);
  const pack = items.find(p => p.id === selectedPack) || items[2] || items[0];

  const headerSettings = settings?.product_selector_header || {
    badge: "Choose Your Ritual",
    title: "Select Your Handmade Batch",
    description: "Handcrafted with organic botanical butter and essential oils. Stock up and save more per bar.",
    product_badge: "LUXURY BATH ELEMENT",
    product_title: "Hausmade™ Kesar Soap",
    weight_badge: "75g Bar",
    rating_text: "4.9 ★ · 480+ Happy Glow Reviews",
    product_description: "A purely handmade cleansing bar infused with real saffron extract, camphor, and 100% coconut oil. Helps remove sun tanning, fade dark spots, and deeply nourish skin for natural daily glow care. Suitable for all skins."
  };

  const customImages = (settings?.product_selector_images && settings.product_selector_images.length > 0)
    ? settings.product_selector_images
    : [
        { src: '/images/soap-hero.png', alt: 'Hausmade Kesar Soap Single Box' },
        { src: '/images/founder-workshop.png', alt: 'Artisan Workshop Studio' }
      ];

  const images = [
    { src: pack.image, alt: `${pack.title} Hausmade Kesar Soap Packaging` },
    ...customImages
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length, setActiveImageIndex]);

  const singleSoap = items.find(i => i.id === 'single') || { basePrice: 299.0 };
  const finalPricePerPack = pack.basePrice.toFixed(2);
  const unitPrice = (pack.basePrice / pack.count).toFixed(2);
  const totalPrice = (pack.basePrice * quantity).toFixed(2);
  
  const isPackOutOfStock = pack.stock !== undefined && pack.stock <= 0;
  const isPackLowStock = pack.stock !== undefined && pack.stock > 0 && pack.stock <= 5;

  const handleAdd = () => {
    onAddToCart({
      packId: pack.id,
      title: pack.title,
      count: pack.count,
      isSubscription: false,
      frequency: null,
      unitPrice,
      packPrice: finalPricePerPack,
      quantity,
      totalPrice,
      image: images[0].src
    });
  };

  const handleBuy = () => {
    onBuyNow({
      packId: pack.id,
      title: pack.title,
      count: pack.count,
      isSubscription: false,
      frequency: null,
      unitPrice,
      packPrice: finalPricePerPack,
      quantity,
      totalPrice,
      image: images[0].src
    });
  };

  return (
    <section id="product-selector" className="py-16 lg:py-24 bg-[#F5F1E8] border-t border-b border-[#3A2E26]/10 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[#C97C5D] font-bold text-xs uppercase tracking-widest">{headerSettings.badge || "Choose Your Ritual"}</span>
          <h2 className="font-serif-brand text-2xl sm:text-4xl lg:text-5xl font-normal text-[#3A2E26] mt-2">
            {headerSettings.title || "Select Your Handmade Batch"}
          </h2>
          <p className="text-[#3A2E26]/70 mt-3 text-base sm:text-lg">
            {headerSettings.description || "Handcrafted with organic botanical butter and essential oils. Stock up and save more per bar."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Side: Product Gallery */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-28">
            <div className="relative rounded-3xl overflow-hidden bg-white shadow-lg border border-[#3A2E26]/10 aspect-square">
              <img
                src={images[activeImageIndex]?.src || pack.image}
                alt={images[activeImageIndex]?.alt || pack.title}
                className="w-full h-full object-cover transition-all duration-500"
              />
              <div className="absolute top-4 left-4 bg-[#7A8B6F] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5" /> Fresh Batch
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-3 gap-4">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all ${
                    activeImageIndex === idx 
                      ? 'border-[#7A8B6F] ring-2 ring-[#7A8B6F]/30 scale-95' 
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Configuration & Add to Cart */}
          <div className="lg:col-span-6 bg-white/70 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-3xl border border-white/80 shadow-xl space-y-5 sm:space-y-6">
            
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C97C5D] block">{headerSettings.product_badge || "Luxury Bath Element"}</span>
                  <h3 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#3A2E26]">
                    {headerSettings.product_title || "Hausmade™ Kesar Soap"}
                  </h3>
                </div>
                <span className="bg-[#C97C5D]/15 text-[#C97C5D] text-xs font-bold px-3 py-1 rounded-full border border-[#C97C5D]/30">
                  {headerSettings.weight_badge || "75g Bar"}
                </span>
              </div>

              {/* Star Rating summary */}
              <div className="flex items-center gap-3 mt-2">
                <a href="#reviews" className="flex items-center text-[#C97C5D] hover:underline">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </a>
                <a href="#reviews" className="text-sm text-[#7A8B6F] font-medium hover:underline">
                  {headerSettings.rating_text || "4.9 ★ · 480+ Happy Glow Reviews"}
                </a>
              </div>

              <p className="text-[#3A2E26]/80 text-sm sm:text-base mt-3 leading-relaxed">
                {headerSettings.product_description || "A purely handmade cleansing bar infused with real saffron extract, camphor, and 100% coconut oil. Helps remove sun tanning, fade dark spots, and deeply nourish skin for natural daily glow care. Suitable for all skins."}
              </p>

              {/* Pricing & Stock Status */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#3A2E26]/10">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#3A2E26]">₹{pack.basePrice.toFixed(2)}</span>
                  <span className="text-xs text-[#3A2E26]/60">/ soap bar</span>
                </div>
                <div>
                  {pack.stock !== undefined && pack.stock <= 0 ? (
                    <span className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Out of Stock
                    </span>
                  ) : (
                    <span className="text-xs text-green-700 font-bold bg-green-50 border border-green-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      In Stock ({pack.stock} left)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stepper, Add to Cart, Buy Now Row */}
            <div className="pt-4 border-t border-[#3A2E26]/10 space-y-3">
              <div className="flex items-center gap-3">
                {/* Stepper */}
                <div className="flex items-center justify-between border border-[#3A2E26]/20 rounded-2xl bg-white p-1 h-12 w-28 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center text-[#3A2E26]/70 hover:text-[#3A2E26] hover:bg-[#F5F1E8] rounded-xl transition-all cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-sm text-[#3A2E26] min-w-[1.25rem] text-center select-none">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-[#3A2E26]/70 hover:text-[#3A2E26] hover:bg-[#F5F1E8] rounded-xl transition-all cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                {/* Add to Cart Outline Button */}
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isPackOutOfStock}
                  className={`flex-1 h-12 border-2 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all duration-300 flex items-center justify-center shadow-xs ${
                    isPackOutOfStock
                      ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-[#7A8B6F] text-[#7A8B6F] hover:bg-[#7A8B6F] hover:text-white cursor-pointer'
                  }`}
                >
                  {isPackOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
                </button>
              </div>

              {/* Buy Now Solid Button */}
              <button
                type="button"
                onClick={handleBuy}
                disabled={isPackOutOfStock}
                className={`w-full h-12 font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                  isPackOutOfStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#C97C5D] hover:bg-[#b06749] text-white cursor-pointer'
                }`}
              >
                <span>{isPackOutOfStock ? 'OUT OF STOCK' : 'BUY NOW'}</span>
                <span className="bg-white/20 px-2.5 py-1 rounded-xl text-[10px] font-bold tracking-normal normal-case">
                  ₹{totalPrice}
                </span>
              </button>
            </div>

            {/* Reassurance Icons */}
            <div className="pt-4 grid grid-cols-3 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs text-[#3A2E26]/70 border-t border-[#3A2E26]/10">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-[#7A8B6F]" />
                <span>Free Shipping over ₹499</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="w-4 h-4 text-[#7A8B6F]" />
                <span>30-Day Happiness Guarantee</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#7A8B6F]" />
                <span>Plastic-Free Delivery</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
