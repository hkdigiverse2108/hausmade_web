import React, { useState, useEffect } from 'react';
import { Copy, Check, Gift } from 'lucide-react';
import { getActiveCoupons } from '../utils/api';

export default function AnnouncementBanner({ settings }) {
  const [copied, setCopied] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveCoupons()
      .then(data => {
        setActiveCoupons(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If admin explicitly turned off the banner, hide it
  if (settings && settings.active === false) {
    return null;
  }

  // If no active coupons exist, hide the banner automatically
  if (!loading && activeCoupons.length === 0) {
    return null;
  }

  // Don't render while loading to avoid flash
  if (loading) return null;

  // Pick the featured coupon: use admin-selected code or default to first active coupon
  const selectedCode = settings?.coupon_code || '';
  const featuredCoupon = selectedCode
    ? activeCoupons.find(c => c.code === selectedCode) || activeCoupons[0]
    : activeCoupons[0];

  // Build banner text
  const badgeText = settings?.badge_text || 'Limited Offer';
  let bannerText = settings?.text || '';

  // Auto-generate text if none is set or if it still has the old hardcoded default
  if (!bannerText || bannerText === 'Use promo code HAUS10 for extra 10% OFF at checkout!') {
    if (featuredCoupon) {
      const discountText = featuredCoupon.discount > 0
        ? `${(featuredCoupon.discount * 100).toFixed(0)}% OFF`
        : 'FREE SHIPPING';
      bannerText = featuredCoupon.description
        ? featuredCoupon.description
        : `Use promo code ${featuredCoupon.code} for extra ${discountText} at checkout!`;
    }
  }

  const couponCode = featuredCoupon?.code || '';

  return (
    <div className="relative bg-gradient-to-r from-[#2D231C] via-[#C97C5D] to-[#2D231C] text-white py-2 sm:py-2.5 px-3 sm:px-4 text-[10px] sm:text-xs font-medium text-center flex items-center justify-center gap-1.5 sm:gap-3 shadow-md z-50 border-b border-white/10 flex-wrap">
      
      {/* Special Offer Badge */}
      <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 font-bold text-[11px] uppercase tracking-wider shadow-xs animate-pulse">
        <Gift className="w-3 h-3 text-amber-300" />
        <span>{badgeText}</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <span className="text-white/90 font-sans">
          {bannerText}
        </span>

        {couponCode && (
          <button
            onClick={() => handleCopy(couponCode)}
            className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white px-2.5 py-1 rounded-md transition-all text-[11px] font-semibold border border-white/20 shadow-xs ml-1 cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3 text-amber-200" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
