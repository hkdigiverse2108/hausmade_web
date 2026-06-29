import React from 'react';
import { Heart, Sparkles, Sprout } from 'lucide-react';

export default function Story() {
  return (
    <section id="story" className="py-16 lg:py-24 bg-[#7A8B6F]/10 scroll-mt-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Workshop Image Frame */}
          <div className="lg:col-span-6 relative order-2 lg:order-1">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute -inset-3 rounded-3xl bg-[#C97C5D]/20 blur-lg" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img
                  src="/images/founder-workshop.png"
                  alt="Founder Crafting Soap in Workshop"
                  className="w-full h-[400px] sm:h-[480px] object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-md">
                  <p className="font-serif-brand font-bold text-sm text-[#3A2E26]">Elena Vance — Master Artisan</p>
                  <p className="text-xs text-[#7A8B6F] font-medium">Hand-pouring batches in Vermont</p>
                </div>
              </div>
            </div>
          </div>

          {/* Story Narrative Text */}
          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C97C5D]/15 text-[#C97C5D] text-xs font-bold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5 fill-current" /> Our Heritage
            </div>

            <h2 className="font-serif-brand text-3xl sm:text-4xl lg:text-5xl font-normal text-[#3A2E26] leading-tight">
              From our kitchen counter to your daily sanctuary.
            </h2>

            <p className="text-base sm:text-lg text-[#3A2E26]/80 leading-relaxed font-light">
              PureBotanica began in the autumn of 2018 when our founder Elena could not find a commercial soap that didn’t leave her skin dry, itchy, and irritated by synthetic dyes and fake fragrances.
            </p>

            <p className="text-base sm:text-lg text-[#3A2E26]/80 leading-relaxed font-light">
              We went back to ancient cold-process saponification roots: slowly combining raw organic butter, wildflower honey, and steam-distilled essential oils. Every single bar is poured by hand, cut with guitar wire, and cured for 6 full weeks to ensure a long-lasting, ultra-creamy bar.
            </p>

            {/* Micro Pillars */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#3A2E26]/10">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white text-[#7A8B6F] shadow-sm mt-1">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif-brand font-bold text-sm text-[#3A2E26]">Sustainable Farming</h4>
                  <p className="text-xs text-[#3A2E26]/70 mt-0.5">Ethically sourced non-GMO herbs</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white text-[#C97C5D] shadow-sm mt-1">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif-brand font-bold text-sm text-[#3A2E26]">Zero Chemicals</h4>
                  <p className="text-xs text-[#3A2E26]/70 mt-0.5">Free from parabens & sulfates</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
