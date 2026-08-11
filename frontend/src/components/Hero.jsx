import React from 'react';
import { Star, ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export default function Hero({ settings }) {
  const badge = settings?.badge || "Hausmade™ Luxury Bath Element";
  const title_normal_1 = settings?.title_normal_1 || "Raw. Pure.";
  const title_italic = settings?.title_italic || "Hausmade.";
  const title_normal_2 = settings?.title_normal_2 || "";
  const description = settings?.description || "Purely handmade cleansing bar infused with real saffron extract, camphor, and 100% coconut oil. Naturally removes sun tan, fades dark spots, and brightens your daily complexing glow.";

  const primary_button_text = settings?.primary_button_text || "Select Your Pack";
  const primary_button_link = settings?.primary_button_link || "#product-selector";
  const secondary_button_text = settings?.secondary_button_text || "Discover Our Craft";
  const secondary_button_link = settings?.secondary_button_link || "#story";

  const trustBadges = (settings?.trust_badges && settings.trust_badges.length > 0)
    ? settings.trust_badges
    : (settings?.hero?.trust_badges && settings.hero.trust_badges.length > 0)
      ? settings.hero.trust_badges
      : [
          { title: "100% Natural Ingredients", description: "Pure essential oils & plant extracts", icon: "Leaf" },
          { title: "Small-Batch Cold Processed", description: "Cured slowly for 6 weeks", icon: "Award" },
          { title: "Cruelty-Free & Plastic-Free", description: "Zero synthetic chemicals or packaging waste", icon: "ShieldCheck" }
        ];

  return (
    <>
      <section className="min-h-screen w-full flex flex-col justify-center overflow-hidden bg-[#FDFBF7]">
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center">
          
          {/* Left Side: Typography & CTA */}
          <div className="w-full md:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 pt-32 pb-16 md:py-32 relative z-10">
            
            <div className="mb-8">
              <span className="inline-block border-b border-[#3A2E26] pb-1 text-[9px] uppercase tracking-[0.25em] font-bold text-[#3A2E26]">
                {badge}
              </span>
            </div>

            <h1 className="font-serif-brand text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-normal tracking-tight text-[#3A2E26] leading-[1.05] mb-8">
              {title_normal_1} <br/>
              <span className="italic font-light text-[#C97C5D]">{title_italic}</span>
              {title_normal_2 && <><br/>{title_normal_2}</>}
            </h1>

            <p className="text-sm sm:text-base text-[#3A2E26]/70 max-w-md font-light leading-relaxed mb-12">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {primary_button_text && (
                <a
                  href={primary_button_link}
                  className="group relative inline-flex items-center justify-center bg-[#3A2E26] text-[#FDFBF7] px-8 py-4 text-[10px] uppercase tracking-[0.2em] font-bold overflow-hidden transition-all duration-500 hover:bg-[#C97C5D]"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {primary_button_text}
                    <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" />
                  </span>
                </a>
              )}

              {secondary_button_text && (
                <a
                  href={secondary_button_link}
                  className="group inline-flex items-center justify-center text-[#3A2E26] px-2 py-4 text-[10px] uppercase tracking-[0.2em] font-bold relative"
                >
                  {secondary_button_text}
                  <span className="absolute bottom-3 left-2 w-0 h-[1px] bg-[#3A2E26] transition-all duration-500 group-hover:w-[calc(100%-16px)]"></span>
                </a>
              )}
            </div>
          </div>

          {/* Right Side: Editorial Imagery */}
          <div className="w-full md:w-1/2 min-h-[50vh] md:h-screen relative flex items-center justify-center p-8 lg:p-12 overflow-hidden">
           {/* Main Image - Professional Soft Rectangle */}
           <div className="relative w-full max-w-[380px] aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl animate-float z-10 border-4 border-[#FDFBF7]/50">
              <img 
                 src={settings?.image_url || "/images/soap-hero.png"}
                 alt="Primary Hero"
                 className="w-full h-full object-cover origin-center transition-transform duration-[10s] ease-out hover:scale-105"
                 onError={(e) => { e.target.onerror = null; e.target.src = "/images/soap-hero.png"; }}
              />
           </div>

           {/* Secondary Overlapping Image */}
           <div className="absolute bottom-[12%] left-[5%] md:left-0 lg:left-[5%] w-48 lg:w-60 aspect-[4/3] rounded-[1.5rem] overflow-hidden shadow-2xl border-[8px] border-[#FDFBF7] animate-float-reverse z-20" style={{ animationDelay: '0.5s' }}>
              <img 
                 src="/images/soap-stack.png"
                 alt="Soap Stack"
                 className="w-full h-full object-cover origin-center transition-transform duration-[10s] ease-out hover:scale-105"
              />
           </div>

           {/* Subtle Text Badge overlay (Fixed & Rotating) */}
           <div className="fixed bottom-8 right-8 z-[99] w-32 h-32 hidden lg:flex items-center justify-center opacity-80 mix-blend-multiply pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_20s_linear_infinite]">
                 <path id="circle" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                 <text className="text-[10px] uppercase tracking-[0.2em] font-bold fill-[#3A2E26]">
                   <textPath href="#circle">
                     {settings?.hero?.rotating_text || "HANDCRAFTED • 100% PURE ART •"}
                   </textPath>
                 </text>
              </svg>
           </div>
        </div>
        </div>
      </section>

      {/* Trust Strip */}
      {trustBadges && trustBadges.length > 0 && (
        <div className="border-t border-b border-[#3A2E26]/10 bg-[#FDFBF7] py-8">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            {trustBadges.slice(0,3).map((badge, idx) => {
              const IconComp = LucideIcons[badge.icon] || LucideIcons.Check;
              return (
                <div key={idx} className="flex flex-col md:flex-row items-center md:items-start gap-4">
                  <div className="text-[#C97C5D] shrink-0">
                    <IconComp className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#3A2E26] text-[10px] uppercase tracking-widest mb-1">{badge.title}</h4>
                    <p className="text-xs text-[#3A2E26]/60">{badge.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
