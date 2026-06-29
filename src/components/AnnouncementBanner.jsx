import React, { useState } from 'react';
import { Copy, Check, Gift } from 'lucide-react';

export default function AnnouncementBanner() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText('HAUS10');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-gradient-to-r from-[#2D231C] via-[#C97C5D] to-[#2D231C] text-white py-2.5 px-4 text-xs font-medium text-center flex items-center justify-center gap-2 sm:gap-3 shadow-md z-50 border-b border-white/10">
      
      {/* Special Offer Badge */}
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 font-bold text-[11px] uppercase tracking-wider shadow-xs animate-pulse">
        <Gift className="w-3 h-3 text-amber-300" />
        <span>Limited Offer</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <span className="text-white/90 font-sans">
          Use promo code <strong className="bg-white/20 px-2 py-0.5 rounded-md font-mono font-bold tracking-widest uppercase text-white shadow-xs border border-white/20">HAUS10</strong> for extra <span className="text-amber-200 font-bold">10% OFF</span> at checkout!
        </span>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white px-2.5 py-1 rounded-md transition-all text-[11px] font-semibold border border-white/20 shadow-xs ml-1 cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3 text-amber-200" />}
          <span>{copied ? 'Copied!' : 'Copy Code'}</span>
        </button>
      </div>
    </div>
  );
}
