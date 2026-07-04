import React from 'react';
import { Leaf, Award, ShieldCheck, ArrowRight, Star } from 'lucide-react';

export default function Hero({ settings }) {
  const badge = settings?.badge || "Hausmade™ Luxury Bath Element";
  const title_normal_1 = settings?.title_normal_1 || "Reveal your";
  const title_italic = settings?.title_italic || "artisanal beauty";
  const title_normal_2 = settings?.title_normal_2 || "with Kesar.";
  const description = settings?.description || "Purely handmade cleansing bar infused with real saffron extract, camphor, and 100% coconut oil. Naturally removes sun tan, fades dark spots, and brightens your daily complexing glow.";

  return (
    <section className="pt-10 pb-10 sm:pt-16 sm:pb-16 lg:pt-20 lg:pb-24 relative overflow-hidden">
      {/* Soft background glow accents */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#7A8B6F]/15 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-40 right-10 w-80 h-80 bg-[#C97C5D]/15 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* Left Column: Headline & Value Prop */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C97C5D]/15 text-[#C97C5D] text-xs sm:text-sm font-semibold tracking-wide uppercase">
              <Star className="w-4 h-4 fill-current" />
              <span>{badge}</span>
            </div>

            <h1 className="font-serif-brand text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#3A2E26] leading-[1.15]">
              {title_normal_1} <span className="italic font-light text-[#C97C5D]">{title_italic}</span> {title_normal_2}
            </h1>

            <p className="text-base sm:text-xl text-[#3A2E26]/80 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
              {description}
            </p>



            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a
                href="#product-selector"
                className="w-full sm:w-auto px-8 py-4 bg-[#7A8B6F] hover:bg-[#68775E] text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group text-base"
              >
                <span>Select Your Pack</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>

              <a
                href="#story"
                className="w-full sm:w-auto px-7 py-4 bg-transparent border border-[#3A2E26]/20 hover:bg-[#3A2E26]/5 text-[#3A2E26] font-medium rounded-full transition-colors flex items-center justify-center text-base"
              >
                Discover Our Craft
              </a>
            </div>

            {/* Social proof quick rating */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 text-xs sm:text-sm text-[#3A2E26]/70">
              <div className="flex text-[#C97C5D]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                ))}
              </div>
              <span className="font-medium text-[#3A2E26]">4.8 / 5.0 rating</span>
              <span className="hidden sm:inline">•</span>
              <span>Over 2,400+ happy bathers</span>
            </div>
          </div>

          {/* Right Column: Hero Image Frame */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-tr from-[#7A8B6F]/30 to-[#C97C5D]/20 blur-xl opacity-70" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/60 bg-[#F5F1E8]">
                <img
                  src="/images/soap-hero.png"
                  alt="Handcrafted Botanical Soap Bar"
                  className="w-full h-[280px] sm:h-[420px] md:h-[480px] object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/40 shadow-lg flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#C97C5D]">Royal Saffron Formula</p>
                    <p className="font-serif-brand font-bold text-[#3A2E26] text-sm sm:text-base">Pure Kesar Artisanal Shaving Puck</p>

                  </div>
                  <span className="bg-[#C97C5D] text-white text-xs px-2.5 py-1 rounded-full font-bold">100% Pure</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Trust Strip Beneath Hero */}
        <div className="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-[#3A2E26]/10 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center sm:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3.5 p-3 rounded-2xl bg-white/40 border border-white/60">
            <div className="p-2.5 rounded-xl bg-[#7A8B6F]/15 text-[#7A8B6F]">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif-brand font-bold text-[#3A2E26] text-sm">100% Natural Ingredients</h4>
              <p className="text-xs text-[#3A2E26]/70">Pure essential oils & plant extracts</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3.5 p-3 rounded-2xl bg-white/40 border border-white/60">
            <div className="p-2.5 rounded-xl bg-[#C97C5D]/15 text-[#C97C5D]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif-brand font-bold text-[#3A2E26] text-sm">Small-Batch Cold Processed</h4>
              <p className="text-xs text-[#3A2E26]/70">Cured slowly for 6 weeks</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3.5 p-3 rounded-2xl bg-white/40 border border-white/60">
            <div className="p-2.5 rounded-xl bg-[#3A2E26]/10 text-[#3A2E26]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif-brand font-bold text-[#3A2E26] text-sm">Cruelty-Free & Plastic-Free</h4>
              <p className="text-xs text-[#3A2E26]/70">Zero synthetic chemicals or packaging waste</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
