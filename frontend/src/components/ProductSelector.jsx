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
  const [isMainHovered, setIsMainHovered] = useState(false);
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
    <section id="product-selector" className="py-16 lg:py-24 bg-[#F5F1E8] border-t border-b border-[#3A2E26]/10 scroll-mt-20 overflow-x-hidden">
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

        <div className="flex flex-col lg:flex-row items-stretch lg:items-start lg:gap-0 mt-8 relative max-w-6xl mx-auto lg:translate-x-12">
          
          {/* Left Side: Product Gallery */}
          <div className="w-full lg:w-7/12 relative">
            <div 
              className="relative overflow-hidden bg-transparent rounded-sm aspect-square lg:aspect-[4/3] w-full"
              onMouseEnter={() => setIsMainHovered(true)}
              onMouseLeave={() => setIsMainHovered(false)}
            >
              <img
                src={images[activeImageIndex]?.src || pack.image}
                alt={images[activeImageIndex]?.alt || pack.title}
                className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out hover:scale-105"
              />
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-3 gap-3 mt-4 lg:pr-28">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative overflow-hidden aspect-[4/3] rounded-sm transition-all duration-300 border border-[#3A2E26]/10 shadow-sm ${
                    activeImageIndex === idx 
                      ? 'opacity-100 ring-1 ring-[#3A2E26] ring-offset-2 ring-offset-[#F5F1E8]' 
                      : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Configuration & Add to Cart */}
          <div className={`w-full lg:w-5/12 z-20 relative lg:-ml-24 lg:mt-16 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMainHovered ? 'lg:translate-x-24' : ''}`}>
            <div className="bg-[#FDFBF7] p-6 sm:p-8 lg:p-10 border border-[#3A2E26]/5 shadow-[0_20px_50px_rgba(58,46,38,0.05)] rounded-sm space-y-8">
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between border-b border-[#3A2E26]/10 pb-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#C97C5D] font-bold block">
                    {headerSettings.product_badge || "Luxury Bath Element"}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#C97C5D] font-bold">
                    {headerSettings.weight_badge || "75g Bar"}
                  </span>
                </div>
                <h3 className="font-serif-brand text-4xl sm:text-5xl font-normal text-[#3A2E26] mt-6 leading-tight">
                  {headerSettings.product_title || "Hausmade™ Kesar Soap"}
                </h3>
              </div>

              {/* Star Rating summary */}
              <div className="flex items-center gap-3">
                <a href="#reviews" className="flex items-center text-[#C97C5D] hover:opacity-70 transition-opacity">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </a>
                <a href="#reviews" className="text-xs text-[#3A2E26]/80 font-mono tracking-wide hover:underline">
                  {headerSettings.rating_text || "4.9 ★ · 480+ Reviews"}
                </a>
              </div>

              <p className="text-[#3A2E26]/90 text-sm sm:text-base leading-[1.8] font-medium">
                {headerSettings.product_description || "A purely handmade cleansing bar infused with real saffron extract, camphor, and 100% coconut oil. Helps remove sun tanning, fade dark spots, and deeply nourish skin for natural daily glow care. Suitable for all skins."}
              </p>

              {/* Pricing & Stock Status */}
              <div className="flex items-baseline justify-between mt-8">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif-brand text-3xl sm:text-4xl text-[#3A2E26]">₹{pack.basePrice.toFixed(2)}</span>
                  <span className="text-xs text-[#3A2E26]/50 uppercase tracking-widest font-mono">/ bar</span>
                </div>
              </div>
            </div>

            {/* Stepper, Add to Cart, Buy Now Row */}
            <div className="pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Stepper */}
                <div className="flex items-center justify-between border border-[#3A2E26] bg-transparent p-1 h-14 w-full sm:w-32 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center text-[#3A2E26]/70 hover:text-[#3A2E26] transition-colors cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs text-[#3A2E26] min-w-[1.25rem] text-center select-none">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center text-[#3A2E26]/70 hover:text-[#3A2E26] transition-colors cursor-pointer"
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
                  className={`flex-1 w-full sm:w-auto h-14 border text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center ${
                    isPackOutOfStock
                      ? 'bg-transparent border-[#3A2E26]/20 text-[#3A2E26]/40 cursor-not-allowed'
                      : 'bg-transparent border-[#3A2E26] text-[#3A2E26] hover:bg-[#3A2E26] hover:text-[#FDFBF7] cursor-pointer'
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
                className={`w-full h-14 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 ${
                  isPackOutOfStock
                    ? 'bg-[#3A2E26]/5 text-[#3A2E26]/40 cursor-not-allowed'
                    : 'bg-[#C97C5D] text-[#FDFBF7] hover:bg-[#A96348] cursor-pointer hover:shadow-md'
                }`}
              >
                <span>{isPackOutOfStock ? 'UNAVAILABLE' : 'BUY NOW'}</span>
                <span className="opacity-50">|</span>
                <span className="font-mono tracking-wider">
                  ₹{totalPrice}
                </span>
              </button>
            </div>

            {/* Reassurance Icons */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-center sm:text-left text-[9px] uppercase tracking-[0.1em] text-[#3A2E26]/60">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                <Truck className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="leading-relaxed">Free Shipping over ₹499</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                <RotateCcw className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="leading-relaxed">30-Day Happiness Guarantee</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="leading-relaxed">Plastic-Free Delivery</span>
              </div>
            </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
