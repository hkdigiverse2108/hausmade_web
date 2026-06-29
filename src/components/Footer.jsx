import React, { useState } from 'react';
import { Sparkles, Send, Heart, Share2, Globe, MessageCircle } from 'lucide-react';


export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#3A2E26] text-[#F5F1E8] pt-16 pb-12 border-t border-[#3A2E26]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-white/10">
          
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-4">
            <a href="#" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#C97C5D] flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-serif-brand text-2xl font-bold tracking-tight text-white">
                Hausmade<span className="text-xs text-[#C97C5D]">™</span>
              </span>
            </a>
            <p className="text-xs text-[#C97C5D] uppercase tracking-widest font-bold">
              Reveal Your Artisanal Beauty
            </p>
            <p className="text-sm text-[#F5F1E8]/70 leading-relaxed font-light max-w-sm">
              Purely handmade luxury bath elements infused with real saffron, camphor, and 100% pure coconut oil. Product of India.
            </p>
            <div className="pt-2 text-xs text-[#F5F1E8]/60 space-y-1">
              <p><strong className="text-white">Marketing By:</strong> HAUSMADE</p>
              <p>305 Muktidham Society, Near Sitanagar Chowk, Surat - 395 010 (Guj.)</p>
            </div>
          </div>

          {/* Nav Links Col */}
          <div className="md:col-span-4 grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-serif-brand font-bold text-sm text-white uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2.5 text-sm text-[#F5F1E8]/70">
                <li><a href="#product-selector" className="hover:text-[#C97C5D] transition-colors">Shop Packs</a></li>
                <li><a href="#story" className="hover:text-[#C97C5D] transition-colors">Our Story</a></li>
                <li><a href="#ingredients" className="hover:text-[#C97C5D] transition-colors">Ingredients</a></li>
                <li><a href="#reviews" className="hover:text-[#C97C5D] transition-colors">Reviews</a></li>
                <li><a href="#faq" className="hover:text-[#C97C5D] transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif-brand font-bold text-sm text-white uppercase tracking-wider mb-4">Customer Care</h4>
              <ul className="space-y-2.5 text-xs text-[#F5F1E8]/70">
                <li><strong className="text-white block mb-0.5">Helpline:</strong> +91 76000 81431</li>
                <li><strong className="text-white block mb-0.5">Email:</strong> info@hausmade.in</li>
                <li><strong className="text-white block mb-0.5">Website:</strong> www.hausmade.in</li>
                <li><span className="text-[#C97C5D] font-semibold">@HAUSMADE_SOAP</span></li>
              </ul>
            </div>
          </div>


          {/* Newsletter Col */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="font-serif-brand font-bold text-sm text-white uppercase tracking-wider">Join The Botanical Journal</h4>
            <p className="text-sm text-[#F5F1E8]/70 font-light">
              Subscribe for secret small-batch batch drops, wellness tips, and 10% off your first order.
            </p>

            {subscribed ? (
              <div className="p-3.5 rounded-xl bg-[#7A8B6F]/20 text-[#7A8B6F] text-sm font-semibold border border-[#7A8B6F]/40 animate-fadeIn">
                ✓ Thank you for subscribing! Check your inbox soon.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7A8B6F]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#7A8B6F] hover:bg-[#68775E] text-white rounded-xl transition-colors shrink-0"
                  aria-label="Subscribe"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Payment Badges Mock */}
            <div className="pt-2">
              <span className="text-[11px] text-white/40 block mb-2 uppercase tracking-wider">Guaranteed Safe Checkout</span>
              <div className="flex items-center space-x-2 text-xs text-white/60 font-semibold">
                <span className="px-2 py-1 bg-white/10 rounded">VISA</span>
                <span className="px-2 py-1 bg-white/10 rounded">Mastercard</span>
                <span className="px-2 py-1 bg-white/10 rounded">Amex</span>
                <span className="px-2 py-1 bg-white/10 rounded">ApplePay</span>
                <span className="px-2 py-1 bg-white/10 rounded">ShopPay</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#F5F1E8]/50 gap-4">
          <p>© {new Date().getFullYear()} PureBotanica Goods Co. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Handcrafted with <Heart className="w-3.5 h-3.5 text-[#C97C5D] fill-current" /> for healthy skin.
          </p>
        </div>

      </div>
    </footer>
  );
}
