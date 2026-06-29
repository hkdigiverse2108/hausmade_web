import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowUp } from 'lucide-react';

export default function StickyMobileBar({ packTitle, price, onAddToCart, onScrollToSelector }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const selectorElement = document.getElementById('product-selector');
      if (selectorElement) {
        const rect = selectorElement.getBoundingClientRect();
        // Show sticky bar once scrolled past the product selector top
        if (rect.bottom < 100 && window.scrollY > 400) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md p-3.5 border-t border-[#3A2E26]/10 shadow-2xl flex items-center justify-between gap-3 animate-slideUp">
      <div onClick={onScrollToSelector} className="cursor-pointer">
        <p className="font-serif-brand font-bold text-xs text-[#3A2E26] truncate">{packTitle}</p>
        <p className="text-sm font-bold text-[#7A8B6F]">${price}</p>
      </div>

      <button
        onClick={onAddToCart}
        className="flex-1 py-3 px-4 bg-[#7A8B6F] active:bg-[#68775E] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
      >
        <ShoppingBag className="w-4 h-4" />
        <span>Add To Cart • ${price}</span>
      </button>
    </div>
  );
}
