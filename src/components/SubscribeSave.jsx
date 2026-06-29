import React from 'react';
import { RefreshCw, Truck, Calendar, Sparkles, ShieldCheck, Tag, ArrowRight } from 'lucide-react';

export default function SubscribeSave() {
  return (
    <section className="py-12 lg:py-16 bg-[#F5F1E8] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Banner Card */}
        <div className="relative bg-gradient-to-br from-[#3A2E26] via-[#2D231C] to-[#3A2E26] rounded-3xl p-8 sm:p-12 border border-[#C97C5D]/30 shadow-2xl overflow-hidden text-white">
          
          {/* Ambient Background Decorative Glows */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#C97C5D]/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#7A8B6F]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C97C5D]/20 border border-[#C97C5D]/40 text-[#E8A589] text-xs font-semibold uppercase tracking-widest backdrop-blur-md shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-[#C97C5D]" /> 
                <span>Subscribe & Save Club</span>
              </div>

              {/* Title */}
              <h2 className="font-serif-brand text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Never Run Out. <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8A589] to-[#D88A6E]">
                  Save 15% On Every Delivery
                </span>
              </h2>

              <p className="text-base sm:text-lg text-white/80 max-w-xl leading-relaxed font-light">
                Enjoy fresh, 100% cold-cured botanical soaps delivered directly to your door. Completely flexible schedule with zero long-term commitment.
              </p>

              {/* Perks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition-colors">
                  <div className="p-2 rounded-xl bg-[#C97C5D]/20 text-[#E8A589]">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-white/90">Free Priority Delivery</span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition-colors">
                  <div className="p-2 rounded-xl bg-[#7A8B6F]/25 text-[#A3B897]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-white/90">Flexible 1, 2, 3 Mo. Cycle</span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs hover:bg-white/10 transition-colors">
                  <div className="p-2 rounded-xl bg-white/15 text-white">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-white/90">1-Click Easy Cancellation</span>
                </div>
              </div>
            </div>

            {/* Right Action Widget Column */}
            <div className="lg:col-span-5 text-center">
              <div className="relative p-6 sm:p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl space-y-5">
                
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C97C5D] to-[#E8A589] text-white shadow-md mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>

                <div>
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-[#E8A589] uppercase tracking-wider mb-1">
                    <Tag className="w-3.5 h-3.5" /> Instant VIP Perk
                  </div>
                  <h3 className="font-serif-brand font-bold text-2xl text-white">
                    Ready For Lather On Autopilot?
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70 mt-1">
                    Select subscription on any soap pack below to lock in your 15% discount.
                  </p>
                </div>

                <a
                  href="#product-selector"
                  className="group inline-flex items-center justify-center gap-2 w-full py-4 px-6 bg-gradient-to-r from-[#C97C5D] to-[#D88A6E] hover:from-[#d68564] hover:to-[#c47a5e] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base transform hover:-translate-y-0.5"
                >
                  <span>Configure Your Subscription</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
