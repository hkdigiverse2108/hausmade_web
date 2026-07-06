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

export default function ProductSelector({ products = [], onAddToCart, onBuyNow, onAddToWishlist, wishlistItems = [], selectedPack, setSelectedPack, isSubscription, setIsSubscription, quantity, setQuantity, activeImageIndex, setActiveImageIndex, settings }) {
  const activeDurations = settings?.subscription_durations || [6, 12];
  const activeQuantities = settings?.subscription_quantities || [2, 4, 6];
  const activeFrequencies = settings?.subscription_frequencies || ["monthly", "every_3_months"];

  const [durationMonths, setDurationMonths] = useState(() => activeDurations[0] || 6);
  const [soapsPerMonth, setSoapsPerMonth] = useState(() => activeQuantities[0] || 2);
  const [deliveryFrequency, setDeliveryFrequency] = useState(() => activeFrequencies[0] || 'monthly');

  React.useEffect(() => {
    if (settings) {
      const activeD = settings.subscription_durations || [6, 12];
      const activeQ = settings.subscription_quantities || [2, 4, 6];
      const activeF = settings.subscription_frequencies || ["monthly", "every_3_months"];
      
      if (activeD.length > 0 && !activeD.includes(durationMonths)) {
        setDurationMonths(activeD[0]);
      }
      if (activeQ.length > 0 && !activeQ.includes(soapsPerMonth)) {
        setSoapsPerMonth(activeQ[0]);
      }
      if (activeF.length > 0 && !activeF.includes(deliveryFrequency)) {
        setDeliveryFrequency(activeF[0]);
      }
    }
  }, [settings]);

  React.useEffect(() => {
    if (settings && settings.subscription_active === false && isSubscription) {
      setIsSubscription(false);
    }
  }, [settings, isSubscription, setIsSubscription]);

  const items = (products && products.length > 0 ? products : PACK_OPTIONS).filter(p => p.active !== false);
  const pack = items.find(p => p.id === selectedPack) || items[2] || items[0];

  const images = [
    { src: pack.image, alt: `${pack.title} Hausmade Kesar Soap Packaging` },
    { src: '/images/soap-hero.png', alt: 'Hausmade Kesar Soap Single Box' },
    { src: '/images/founder-workshop.png', alt: 'Artisan Workshop Studio' }
  ];

  // Base pricing
  const singleSoap = items.find(i => i.id === 'single') || items[0] || { basePrice: 299.0 };
  const discountPct = settings?.subscription_discount_pct !== undefined ? settings.subscription_discount_pct : 15.0;
  const subUnitPrice = singleSoap.basePrice * (1.0 - (discountPct / 100.0));
  
  // Deliveries soaps count
  const soapsPerDelivery = deliveryFrequency === 'every_3_months' ? soapsPerMonth * 3 : soapsPerMonth;
  const subPackPrice = subUnitPrice * soapsPerDelivery;

  const discountMultiplier = isSubscription ? (1.0 - (discountPct / 100.0)) : 1.0;
  
  const finalPricePerPack = isSubscription ? subPackPrice.toFixed(2) : (pack.basePrice * discountMultiplier).toFixed(2);
  const unitPrice = isSubscription ? subUnitPrice.toFixed(2) : ((pack.basePrice * discountMultiplier) / pack.count).toFixed(2);
  
  const totalSubPrice = subUnitPrice * soapsPerMonth * durationMonths;
  const totalPrice = isSubscription ? totalSubPrice.toFixed(2) : (parseFloat(finalPricePerPack) * quantity).toFixed(2);
  
  const isPackOutOfStock = pack.stock !== undefined && pack.stock <= 0;
  const isPackLowStock = pack.stock !== undefined && pack.stock > 0 && pack.stock <= 5;

  const handleAdd = () => {
    if (isSubscription) {
      onAddToCart({
        packId: 'single',
        title: `Botanical Soap - Subscription (${durationMonths} Months)`,
        count: soapsPerMonth,
        isSubscription: true,
        frequency: deliveryFrequency === 'every_3_months' ? 'Every 3 Months' : 'Every Month',
        subscriptionDetails: {
          durationMonths,
          soapsPerMonth,
          deliveryFrequency
        },
        unitPrice,
        packPrice: finalPricePerPack,
        quantity: 1,
        totalPrice,
        image: '/images/pack-single.png'
      });
    } else {
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
    }
  };

  const handleBuy = () => {
    if (isSubscription) {
      onBuyNow({
        packId: 'single',
        title: `Botanical Soap - Subscription (${durationMonths} Months)`,
        count: soapsPerMonth,
        isSubscription: true,
        frequency: deliveryFrequency === 'every_3_months' ? 'Every 3 Months' : 'Every Month',
        subscriptionDetails: {
          durationMonths,
          soapsPerMonth,
          deliveryFrequency
        },
        unitPrice,
        packPrice: finalPricePerPack,
        quantity: 1,
        totalPrice,
        image: '/images/pack-single.png'
      });
    } else {
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
    }
  };

  return (
    <section id="product-selector" className="py-16 lg:py-24 bg-[#F5F1E8] border-t border-b border-[#3A2E26]/10 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[#C97C5D] font-bold text-xs uppercase tracking-widest">Choose Your Ritual</span>
          <h2 className="font-serif-brand text-2xl sm:text-4xl lg:text-5xl font-normal text-[#3A2E26] mt-2">
            Select Your Handmade Batch
          </h2>
          <p className="text-[#3A2E26]/70 mt-3 text-base sm:text-lg">
            Handcrafted with organic botanical butter and essential oils. Stock up and save more per bar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Side: Product Gallery */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-28">
            <div className="relative rounded-3xl overflow-hidden bg-white shadow-lg border border-[#3A2E26]/10 aspect-square">
              <img
                src={images[activeImageIndex].src}
                alt={images[activeImageIndex].alt}
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
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C97C5D] block">Luxury Bath Element</span>
                  <h3 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#3A2E26]">
                    Hausmade™ Kesar Soap
                  </h3>
                </div>
                <span className="bg-[#C97C5D]/15 text-[#C97C5D] text-xs font-bold px-3 py-1 rounded-full border border-[#C97C5D]/30">
                  75g Bar
                </span>
              </div>

              {/* Star Rating summary */}
              <div className="flex items-center gap-3 mt-2">
                <a href="#reviews" className="flex items-center text-[#C97C5D] hover:underline">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                  <span className="ml-2 font-bold text-[#3A2E26] text-sm">4.9 ★</span>
                </a>
                <span className="text-sm text-[#3A2E26]/50">•</span>
                <a href="#reviews" className="text-sm text-[#7A8B6F] font-medium hover:underline">
                  480+ Happy Glow Reviews
                </a>
              </div>

              <p className="text-[#3A2E26]/80 text-sm sm:text-base mt-3 leading-relaxed">
                A purely handmade cleansing bar infused with real saffron extract, camphor, and 100% coconut oil. Helps remove sun tanning, fade dark spots, and deeply nourish skin for natural daily glow care. Suitable for all skins.
              </p>


            </div>

            {/* Purchase Type Toggle (One-time vs Subscribe & Save) */}
            {settings?.subscription_active !== false && (
              <div className="border-t border-b border-[#3A2E26]/10 py-5 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 block">
                  Purchase Option
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSubscription(false)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                      !isSubscription
                        ? 'border-[#7A8B6F] bg-[#7A8B6F]/10 shadow-sm'
                        : 'border-[#3A2E26]/15 bg-white/50 hover:border-[#3A2E26]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-[#3A2E26] text-sm">One-Time Purchase</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!isSubscription ? 'border-[#7A8B6F] bg-[#7A8B6F]' : 'border-gray-400'}`}>
                        {!isSubscription && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <span className="text-xs text-[#3A2E26]/70 mt-2">Standard pricing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSubscription(true)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSubscription
                        ? 'border-[#C97C5D] bg-[#C97C5D]/10 shadow-sm'
                        : 'border-[#3A2E26]/15 bg-white/50 hover:border-[#3A2E26]/30'
                    }`}
                  >
                    <div className="absolute top-0 right-0 bg-[#C97C5D] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase">
                      Save Extra {discountPct}%
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-[#3A2E26] text-sm flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-[#C97C5D]" /> Subscribe & Save
                      </span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSubscription ? 'border-[#C97C5D] bg-[#C97C5D]' : 'border-gray-400'}`}>
                        {isSubscription && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <span className="text-xs text-[#C97C5D] font-medium mt-2">Flexible delivery, cancel anytime</span>
                  </button>
                </div>

                {/* Custom Subscription Configuration or Pack Selector */}
                {isSubscription && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-[#C97C5D]/5 rounded-3xl p-5 border border-[#C97C5D]/25 space-y-4 shadow-xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#C97C5D] block">Configure Your Subscription</span>
                      
                      {/* Soap quantity choice */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3A2E26]/85">
                          1. How many soaps do you need per month? (Monthly Quantity)
                        </label>
                        <div className="flex items-center gap-3 bg-white border border-[#3A2E26]/15 rounded-2xl p-1.5 w-fit">
                          <button
                            type="button"
                            onClick={() => setSoapsPerMonth(prev => Math.max(1, prev - 1))}
                            className="w-8 h-8 rounded-lg bg-[#3A2E26]/5 hover:bg-[#3A2E26]/10 flex items-center justify-center font-bold text-sm text-[#3A2E26] select-none transition-colors cursor-pointer border-none"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={soapsPerMonth}
                            onChange={(e) => setSoapsPerMonth(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-12 text-center font-bold text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-[#3A2E26]"
                          />
                          <button
                            type="button"
                            onClick={() => setSoapsPerMonth(prev => prev + 1)}
                            className="w-8 h-8 rounded-lg bg-[#3A2E26]/5 hover:bg-[#3A2E26]/10 flex items-center justify-center font-bold text-sm text-[#3A2E26] select-none transition-colors cursor-pointer border-none"
                          >
                            +
                          </button>
                          <span className="text-xs font-bold text-[#3A2E26]/70 pr-3">
                            {soapsPerMonth === 1 ? 'Soap' : 'Soaps'} / Month
                          </span>
                        </div>
                      </div>

                      {/* Duration choice */}
                      {activeDurations.length > 0 && (
                        <div className="space-y-2">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3A2E26]/85">
                            2. Select subscription duration (Plan Duration)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {activeDurations.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setDurationMonths(d)}
                                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                                  durationMonths === d
                                    ? 'border-[#C97C5D] bg-[#C97C5D]/10 text-[#C97C5D] shadow-xs'
                                    : 'border-[#3A2E26]/15 bg-white text-[#3A2E26] hover:border-[#3A2E26]/30'
                                }`}
                              >
                                {d >= 12 ? (d % 12 === 0 ? `${d / 12} Year${d / 12 > 1 ? 's' : ''}` : `${d} Months`) : `${d} Months`}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Delivery Frequency choice */}
                      {activeFrequencies.length > 0 && (
                        <div className="space-y-2">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#3A2E26]/85">
                            3. When should we deliver? (Choose Delivery Cycle)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {activeFrequencies.map((f) => (
                              <button
                                key={f}
                                type="button"
                                onClick={() => setDeliveryFrequency(f)}
                                className={`py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                                  deliveryFrequency === f
                                    ? 'border-[#C97C5D] bg-[#C97C5D]/10 text-[#C97C5D] shadow-xs'
                                    : 'border-[#3A2E26]/15 bg-white text-[#3A2E26] hover:border-[#3A2E26]/30'
                                }`}
                              >
                                {f === 'monthly' ? 'Every Month' : f === 'every_3_months' ? 'Every 3 Months' : f.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cost summary explanation */}
                      <div className="p-4 bg-white rounded-2xl border border-[#3A2E26]/10 text-xs space-y-2 text-[#3A2E26]/85 font-medium">
                        <div className="flex justify-between">
                          <span>Regular soap price (Base Price/Soap):</span>
                          <span className="line-through text-gray-400">₹{singleSoap.basePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[#C97C5D]">
                          <span>Subscription Discount ({discountPct}% Off):</span>
                          <span>-₹{(singleSoap.basePrice * (discountPct / 100)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-gray-100 pt-2">
                          <span>Net Price per soap:</span>
                          <span>₹{subUnitPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col gap-2 text-xs text-[#3A2E26] bg-[#C97C5D]/10 p-3.5 rounded-xl mt-2 border border-[#C97C5D]/30 shadow-xs">
                          <div className="flex justify-between items-center text-[10px] text-[#3A2E26]/75 uppercase tracking-wider font-bold">
                            <span>Delivery Cycle:</span>
                            <span>
                              {deliveryFrequency === 'every_3_months'
                                ? `Every 3 months (${soapsPerMonth * 3} soaps)`
                                : `Every month (${soapsPerMonth} soaps)`
                              }
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-[#C97C5D]/25 pt-2">
                            <span className="font-bold text-[11px] text-[#C97C5D] uppercase tracking-wider">
                              Total Subscription Cost ({durationMonths} Months):
                            </span>
                            <span className="text-sm font-extrabold text-[#C97C5D] bg-white px-2.5 py-1 rounded-lg border border-[#C97C5D]/20 shadow-xs">
                              ₹{(subUnitPrice * soapsPerMonth * durationMonths).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}

            {!isSubscription && (
              /* Pack Size Selector */
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70">
                    Select Pack Size
                  </label>
                  <div className="flex items-center gap-2">
                    {isPackLowStock && (
                      <span className="text-xs text-[#C97C5D] font-bold animate-pulse">
                        Only {pack.stock} left!
                      </span>
                    )}
                    {isPackOutOfStock && (
                      <span className="text-xs text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                        Out of Stock
                      </span>
                    )}
                    <span className="text-xs text-[#7A8B6F] font-semibold">
                      ₹{unitPrice} / soap bar
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((p) => {
                    const pPrice = (p.basePrice * discountMultiplier).toFixed(2);
                    const pUnit = ((p.basePrice * discountMultiplier) / p.count).toFixed(2);
                    const isSelected = selectedPack === p.id;
                    const isWishlisted = wishlistItems.some(item => item.id === p.id);
                    const isOutOfStock = p.stock !== undefined && p.stock <= 0;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPack(p.id)}
                        className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between cursor-pointer select-none ${
                          isSelected
                            ? isOutOfStock
                              ? 'border-red-400 bg-red-50/10 ring-2 ring-red-400/20 shadow-md scale-[1.01]'
                              : 'border-[#7A8B6F] bg-white ring-2 ring-[#7A8B6F]/30 shadow-md scale-[1.01]'
                            : 'border-[#3A2E26]/15 bg-white/60 hover:bg-white hover:border-[#3A2E26]/30'
                        } ${isOutOfStock ? 'opacity-85' : ''}`}
                      >
                        {/* Wishlist Icon Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToWishlist(p);
                          }}
                          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-[#C97C5D]/5 hover:bg-[#C97C5D]/15 text-[#C97C5D] transition-all cursor-pointer z-10"
                          aria-label="Toggle wishlist"
                          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-[#C97C5D] text-[#C97C5D]' : 'text-[#3A2E26]/40 hover:text-[#C97C5D]'}`} />
                        </button>

                        {/* Badges */}
                        {p.popular && (
                          <span className="absolute -top-2.5 left-3 bg-[#7A8B6F] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            Most Popular
                          </span>
                        )}
                        {p.bestValue && (
                          <span className="absolute -top-2.5 left-3 bg-[#C97C5D] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            Best Value
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="absolute -top-2.5 left-3 bg-red-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                            Out of Stock
                          </span>
                        )}

                        <div className="flex items-start justify-between w-full pr-8">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#3A2E26] text-base">{p.title}</span>
                            {p.savingsBadge && (
                              <span className="inline-block mt-1.5 self-start text-[10px] font-bold text-[#C97C5D] bg-[#C97C5D]/15 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                {p.savingsBadge}
                              </span>
                            )}
                            {isOutOfStock ? (
                              <span className="text-[11px] font-bold text-red-600 mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span> Out of Stock
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-green-700 mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> In Stock ({p.stock} left)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex items-baseline justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold text-[#3A2E26]">₹{pPrice}</span>
                          </div>
                          <span className="text-xs text-[#3A2E26]/60">₹{pUnit} / bar</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stepper, Add to Cart, Buy Now Row */}
            <div className="pt-4 border-t border-[#3A2E26]/10 space-y-3">
              <div className="flex items-center gap-3">
                {/* Stepper */}
                {!isSubscription && (
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
                )}

                {/* Add to Cart Outline Button */}
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!isSubscription && isPackOutOfStock}
                  className={`flex-1 h-12 border-2 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all duration-300 flex items-center justify-center shadow-xs ${
                    !isSubscription && isPackOutOfStock
                      ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-[#7A8B6F] text-[#7A8B6F] hover:bg-[#7A8B6F] hover:text-white cursor-pointer'
                  }`}
                >
                  {isSubscription ? 'ADD SUBSCRIPTION' : (isPackOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART')}
                </button>
              </div>

              {/* Buy Now Solid Button */}
              <button
                type="button"
                onClick={handleBuy}
                disabled={!isSubscription && isPackOutOfStock}
                className={`w-full h-12 font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 ${
                  !isSubscription && isPackOutOfStock
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#C97C5D] hover:bg-[#b06749] text-white cursor-pointer'
                }`}
              >
                <span>{isSubscription ? 'SUBSCRIBE NOW' : (isPackOutOfStock ? 'OUT OF STOCK' : 'BUY NOW')}</span>
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
