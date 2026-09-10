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
    basePrice: 538.00, // ~10% off
    savingsBadge: 'Save 10%',
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
    <section id="product-selector" className="pt-2 pb-6 lg:pt-4 lg:pb-12 bg-transparent scroll-mt-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-2 lg:mb-6 pt-4 sm:pt-8 lg:pt-10">
          <span className="text-[#C97C5D] font-bold text-[10px] sm:text-xs uppercase tracking-widest">{headerSettings.badge || "CHOOSE YOUR RITUAL"}</span>
          <h1 className="font-serif-brand text-xl sm:text-4xl lg:text-5xl font-normal text-[#3A2E26] mt-0.5 sm:mt-2">
            {headerSettings.title || "Select Your Artisanal Cleansing Ritual"}
          </h1>
          <p className="text-[#3A2E26]/70 mt-1 sm:mt-2 text-xs sm:text-base hidden sm:block">
            {headerSettings.description || "Handcrafted with pure saffron extract (Kesar), aromatic camphor, and cold-pressed coconut oil. Choose a larger pack size to enjoy significant savings."}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-start lg:gap-0 mt-2 lg:mt-4 relative max-w-6xl mx-auto lg:translate-x-12">
          
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
            
              <div className="flex flex-col space-y-4 sm:space-y-6">
                {/* 1. Header Badges & Title */}
                <div>
                  <div className="flex items-center justify-between border-b border-[#3A2E26]/10 pb-3">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#C97C5D] font-bold">
                      {headerSettings.product_badge || "Luxury Bath Element"}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#C97C5D] font-bold">
                      {headerSettings.weight_badge || "75g Bar"}
                    </span>
                  </div>
                  <h1 className="font-serif-brand text-3xl sm:text-4xl font-normal text-[#3A2E26] mt-4 leading-tight">
                    {headerSettings.product_title || "Hausmade™ Kesar Soap"}
                  </h1>

                  {/* Rating */}
                  <div className="flex items-center gap-3 mt-3">
                    <a href="#reviews" className="flex items-center text-[#C97C5D] hover:opacity-70 transition-opacity">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </a>
                    <a href="#reviews" className="text-xs text-[#3A2E26]/80 font-mono tracking-wide hover:underline">
                      {headerSettings.rating_text || "4.9 ★ · 480+ Reviews"}
                    </a>
                  </div>
                </div>

                {/* 2. Unique Luxury Pack / Combo Selector */}
                <div className="pt-4 border-t border-[#3A2E26]/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#3A2E26] flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#C97C5D]" />
                      Select Bundle & Save
                    </span>
                  </div>

                  {/* 2x2 Luxury Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {items.map((item) => {
                      const isSelected = item.id === pack.id;
                      const singlePrice = singleSoap.basePrice || 299;
                      const originalTotal = singlePrice * item.count;
                      const hasDiscount = originalTotal > item.basePrice;
                      const pricePerBar = (item.basePrice / item.count).toFixed(0);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedPack && setSelectedPack(item.id)}
                          className={`relative p-3.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer text-left border ${
                            isSelected
                              ? 'border-2 border-[#C97C5D] bg-[#F7F3EB] shadow-[0_6px_20px_rgba(58,46,38,0.08)] translate-y-[-1px]'
                              : 'border border-[#3A2E26]/15 bg-white/80 text-[#3A2E26] hover:border-[#C97C5D]/50 hover:bg-white'
                          }`}
                        >
                          {/* Floating Top Badges */}
                          {item.popular && (
                            <span className="absolute -top-2.5 right-3 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#C97C5D] text-white shadow-xs">
                              ★ Most Popular
                            </span>
                          )}
                          {item.bestValue && (
                            <span className="absolute -top-2.5 right-3 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#7A8B6F] text-white shadow-xs">
                              🔥 Best Value
                            </span>
                          )}

                          <div className="flex items-start justify-between gap-2 pt-0.5">
                            <div className="flex items-start gap-2">
                              {/* Custom Terracotta Check Indicator */}
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                isSelected ? 'border-[#C97C5D] bg-[#C97C5D]' : 'border-[#3A2E26]/25 bg-transparent'
                              }`}>
                                {isSelected ? (
                                  <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                                ) : null}
                              </div>

                              <div>
                                <span className="block text-xs font-bold text-[#3A2E26] uppercase tracking-wider">
                                  {item.count === 1 ? '1 Soap Bar' : `Combo of ${item.count}`}
                                </span>
                                <span className="block text-[10px] font-mono text-[#3A2E26]/60 mt-0.5">
                                  ₹{pricePerBar} / bar
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="block font-serif-brand text-sm sm:text-base font-bold text-[#3A2E26]">
                                ₹{item.basePrice.toFixed(0)}
                              </span>
                              {hasDiscount ? (
                                <span className="block text-[9px] font-bold text-[#C97C5D] font-mono mt-0.5">
                                  {item.savingsBadge}
                                </span>
                              ) : (
                                <span className="block text-[9px] text-[#3A2E26]/40 font-mono mt-0.5">
                                  Standard
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Live Price & Savings Banner */}
                <div className="flex items-center justify-between p-3.5 bg-[#F5F1E8]/70 border border-[#3A2E26]/10 rounded-xl">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#3A2E26]/60 font-mono block">
                      Selected Price
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif-brand text-2xl font-bold text-[#3A2E26]">
                        ₹{pack.basePrice.toFixed(2)}
                      </span>
                      {pack.count > 1 && (
                        <span className="text-xs text-[#3A2E26]/60 font-mono">
                          (₹{unitPrice}/bar)
                        </span>
                      )}
                    </div>
                  </div>

                  {pack.count > 1 ? (
                    <span className="bg-[#C97C5D] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm shadow-xs">
                      {pack.savingsBadge ? pack.savingsBadge : `Save ₹${(singleSoap.basePrice * pack.count - pack.basePrice).toFixed(0)}`}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-[#3A2E26]/50 uppercase tracking-wider">
                      Standard Bar
                    </span>
                  )}
                </div>

                {/* 4. Action Row (Stepper, Add to Cart, Buy Now) */}
                <div className="space-y-2.5">
                  <div className="flex flex-row gap-2.5">
                    {/* Stepper */}
                    <div className="flex items-center justify-between border border-[#3A2E26] bg-transparent p-1 h-12 w-28 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center text-[#3A2E26]/70 hover:text-[#3A2E26] cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-xs text-[#3A2E26] select-none">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#3A2E26]/70 hover:text-[#3A2E26] cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Add to Cart Outline */}
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={isPackOutOfStock}
                      className="flex-1 h-12 border border-[#3A2E26] text-[#3A2E26] hover:bg-[#3A2E26] hover:text-[#FDFBF7] text-xs font-bold uppercase tracking-[0.18em] transition-all cursor-pointer flex items-center justify-center"
                    >
                      {isPackOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
                    </button>
                  </div>

                  {/* Buy Now Solid Button */}
                  <button
                    type="button"
                    onClick={handleBuy}
                    disabled={isPackOutOfStock}
                    className="w-full h-12 bg-[#C97C5D] hover:bg-[#A96348] text-[#FDFBF7] text-xs font-bold uppercase tracking-[0.18em] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>BUY NOW</span>
                    <span className="opacity-50">•</span>
                    <span className="font-mono">₹{totalPrice}</span>
                  </button>
                </div>

                {/* 5. Short Description & Reassurance Chips */}
                <div className="pt-3 border-t border-[#3A2E26]/10 space-y-3">
                  <p className="text-[#3A2E26]/80 text-xs leading-relaxed">
                    {headerSettings.product_description || "Infused with real saffron extract, camphor, and 100% coconut oil to remove sun tan and deeply nourish skin."}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[9px] uppercase tracking-wider text-[#3A2E26]/70">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#C97C5D] shrink-0" />
                      <span>Free Shipping &gt; ₹499</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-[#C97C5D] shrink-0" />
                      <span>30-Day Guarantee</span>
                    </div>
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
