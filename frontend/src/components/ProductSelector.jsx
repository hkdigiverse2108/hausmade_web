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
    title: 'Combo of 2',
    count: 2,
    basePrice: 550.00, // ~8% off
    savingsBadge: 'Save 8%',
    popular: false,
    bestValue: false,
    image: '/images/pack-2.png'
  },
  {
    id: 'pack-3',
    title: 'Combo of 3',
    count: 3,
    basePrice: 717.00, // ~20% off
    savingsBadge: 'Save 20%',
    popular: true,
    bestValue: false,
    image: '/images/pack-3.png'
  },
  {
    id: 'pack-5',
    title: 'Combo of 5',
    count: 5,
    basePrice: 1046.00, // ~30% off
    savingsBadge: 'Save 30%',
    popular: false,
    bestValue: true,
    image: '/images/pack-5.png'
  },
];

export default function ProductSelector({ products = [], onAddToCart, onBuyNow, selectedPack, setSelectedPack, quantity, setQuantity, activeImageIndex, setActiveImageIndex, settings }) {
  const [isMainHovered, setIsMainHovered] = useState(false);
  const isSubscription = false;

  const items = (products && products.length > 0 ? products : PACK_OPTIONS).filter(p => p.active !== false);
  const pack = items.find(p => p.id === selectedPack) || items[2] || items[0];

  const headerSettings = settings?.product_selector_header || {
    badge: "Choose Your Ritual",
    title: "Select Your Handmade Batch",
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
    <section id="product-selector" className="pt-2 pb-6 lg:pt-4 lg:pb-12 bg-transparent scroll-mt-20 overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-12">
        
        <div className="text-center max-w-3xl mx-auto mb-6 lg:mb-10 pt-4 sm:pt-8 lg:pt-10">
          <span className="text-[#C97C5D] font-bold text-[10px] sm:text-xs uppercase tracking-widest">{headerSettings.badge || "CHOOSE YOUR RITUAL"}</span>
          <h1 className="font-serif-brand text-xl sm:text-4xl lg:text-5xl font-normal text-[#3A2E26] mt-0.5 sm:mt-2">
            {headerSettings.title || "Select Your Artisanal Cleansing Ritual"}
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-start lg:gap-0 mt-2 lg:mt-4 relative max-w-[1300px] mx-auto lg:translate-x-10">
          
          {/* Left Side: Product Gallery */}
          <div className="w-full lg:w-7/12 relative">
            <div 
              className="relative overflow-hidden bg-transparent rounded-sm aspect-[16/9] sm:aspect-[4/3] w-full max-h-[220px] sm:max-h-none"
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
            <div className="grid grid-cols-3 gap-2 mt-2 lg:mt-4 lg:pr-28">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative overflow-hidden aspect-[16/9] sm:aspect-[4/3] rounded-sm transition-all duration-300 border border-[#3A2E26]/10 shadow-sm ${
                    activeImageIndex === idx 
                      ? 'opacity-100 ring-1 ring-[#3A2E26] ring-offset-1 ring-offset-[#F5F1E8]' 
                      : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Configuration & Add to Cart */}
          <div className={`w-full lg:w-5/12 z-20 relative mt-3 lg:-ml-24 lg:mt-16 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMainHovered ? 'lg:translate-x-24' : ''}`}>
            <div className="bg-[#FDFBF7] p-4 sm:p-7 lg:p-8 border border-[#3A2E26]/10 shadow-[0_20px_50px_rgba(58,46,38,0.06)] rounded-xl sm:rounded-2xl">
            
              <div className="flex flex-col space-y-0">
                {/* 1. Header Badges & Title */}
                <div>
                  <div className="flex items-center justify-between border-y border-[#3A2E26]/10 py-3 mb-5">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#C97C5D] font-bold">
                      {headerSettings.product_badge || "Luxury Bath Element"}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#C97C5D] font-bold">
                      {headerSettings.weight_badge || "75g Bar"}
                    </span>
                  </div>
                  <h1 className="font-serif-brand text-3xl sm:text-[2.5rem] font-normal text-[#3A2E26] leading-tight mb-3">
                    {headerSettings.product_title || "Hausmade™ Kesar Soap"}
                  </h1>

                  {/* Rating */}
                  <div className="flex items-center gap-3">
                    <a href="#reviews" className="flex items-center text-[#C97C5D] hover:opacity-70 transition-opacity">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </a>
                    <a href="#reviews" className="text-sm text-[#3A2E26]/80 hover:underline">
                      {headerSettings.rating_text || "4.9 ★ · 480+ Happy Glow Reviews"}
                    </a>
                  </div>

                  {/* Description (Desktop) */}
                  <p className="hidden sm:block text-[#3A2E26]/80 text-[13px] sm:text-[14px] leading-relaxed mt-5">
                    {headerSettings.product_description || "A purely handmade cleansing bar infused with real Kesar (Saffron) extract, camphor, and 100% coconut oil. Helps remove sun tanning, reduce the appearance of dark spots, and deeply nourish the skin for a natural, healthy-looking glow. Suitable for all skin types."}
                  </p>
                </div>

                {/* 2. Bundle Selector */}
                <div className="pt-6">
                  <div className="flex items-center mb-3">
                    <span className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#3A2E26] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C97C5D]" />
                      Select Bundle & Save
                    </span>
                  </div>

                  {/* 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {items.map((item) => {
                      const isSelected = item.id === pack.id;
                      const pricePerBar = (item.basePrice / item.count).toFixed(0);
                      let badgeBg = "bg-[#C97C5D]";
                      let badgeText = item.savingsBadge;
                      if (item.popular) badgeText = "Most Popular";
                      if (item.bestValue) {
                        badgeBg = "bg-[#7A8B6F]";
                        badgeText = "Best Value";
                      }
                      if (item.id === 'pack-2') badgeText = "Save 8%";

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedPack && setSelectedPack(item.id)}
                          className={`relative p-3 rounded-xl transition-all duration-300 cursor-pointer text-left border ${
                            isSelected
                              ? 'border-[#C97C5D] bg-[#FDFBF7] shadow-sm ring-1 ring-[#C97C5D]'
                              : 'border-[#3A2E26]/15 bg-white text-[#3A2E26] hover:border-[#C97C5D]/50'
                          }`}
                        >
                          {/* Top Right Badge */}
                          {item.id !== 'single' && (
                            <span className={`absolute -top-2.5 right-2 sm:right-3 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm ${badgeBg}`}>
                              {badgeText}
                            </span>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                isSelected ? 'border-[#C97C5D] bg-[#C97C5D]' : 'border-[#3A2E26]/30 bg-transparent'
                              }`}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                              </div>
                              <div>
                                <span className="block text-[11px] font-bold text-[#3A2E26] uppercase tracking-wide">
                                  {item.count === 1 ? '1 Soap Bar' : `Combo of ${item.count}`}
                                </span>
                                <span className="block text-[10px] text-[#3A2E26]/60 mt-0.5">
                                  ₹{pricePerBar} / bar
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="block font-serif-brand text-[15px] font-bold text-[#3A2E26]">
                                ₹{item.basePrice.toFixed(0)}
                              </span>
                              {item.id === 'single' ? (
                                <span className="block text-[10px] text-[#3A2E26]/40 mt-0.5">
                                  Standard
                                </span>
                              ) : (
                                <span className="block text-[10px] font-bold text-[#C97C5D] mt-0.5">
                                  {item.savingsBadge}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Live Price Banner */}
                <div className="mt-5 p-3.5 bg-[#F9F7F3] border border-[#3A2E26]/10 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#3A2E26]/50 font-bold block mb-1">
                      Selected Price
                    </span>
                    <div className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#3A2E26]">
                      ₹{pack.basePrice.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#3A2E26]/40 font-bold block">
                      {pack.count > 1 ? `COMBO OF ${pack.count}` : 'STANDARD BAR'}
                    </span>
                  </div>
                </div>

                {/* 4. Action Row */}
                <div className="mt-4 flex gap-3 h-[50px]">
                  {/* Stepper */}
                  <div className="flex items-center justify-between border border-[#3A2E26]/20 bg-white rounded-md p-1 w-[100px] shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center text-[#3A2E26]/70 hover:text-[#3A2E26]"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-[13px] text-[#3A2E26] select-none">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-[#3A2E26]/70 hover:text-[#3A2E26]"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={isPackOutOfStock}
                    className="flex-1 bg-[#C97C5D] hover:bg-[#B76F53] rounded-md text-white text-[13px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    {isPackOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
                  </button>
                </div>

                {/* Mobile Description */}
                <div className="mt-5 block sm:hidden border-t border-[#3A2E26]/10 pt-4">
                  <p className="text-[#3A2E26]/80 text-[13px] leading-relaxed">
                    {headerSettings.product_description || "A purely handmade cleansing bar infused with real Kesar (Saffron) extract, camphor, and 100% coconut oil. Helps remove sun tanning, reduce the appearance of dark spots, and deeply nourish the skin for a natural, healthy-looking glow. Suitable for all skin types."}
                  </p>
                </div>

                {/* 5. Trust Badges */}
                <div className="mt-5 grid grid-cols-4 gap-1 text-[9px] leading-tight text-[#3A2E26]/70 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#C97C5D]" strokeWidth={1.5} />
                    <span>Free Shipping<br/>over ₹499</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#C97C5D]" strokeWidth={1.5} />
                    <span>Secure<br/>Payment</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#C97C5D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
                    <span>100% Authentic<br/>& Handmade</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <Heart className="w-4 h-4 text-[#C97C5D]" strokeWidth={1.5} />
                    <span>Loved by<br/>Happy Customers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
