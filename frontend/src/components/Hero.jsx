import React, { useState, useEffect } from 'react';
import { Star, ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export default function Hero({ settings, onNavigate }) {
  const [isOverDark, setIsOverDark] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const badge = document.getElementById('rotating-badge');
      if (!badge) return;
      
      const rect = badge.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      // Temporarily hide the badge so elementsFromPoint looks 'behind' it
      // Using visibility instead of display to prevent CSS animations from resetting
      const originalVisibility = badge.style.visibility;
      badge.style.visibility = 'hidden';
      const elements = document.elementsFromPoint(x, y);
      badge.style.visibility = originalVisibility;

      if (!elements) return;

      const overDark = elements.some(el => {
        const bg = window.getComputedStyle(el).backgroundColor;
        return (
          el.classList.contains('bg-[#241D17]') || 
          el.classList.contains('bg-[#1A1512]') || 
          el.classList.contains('bg-[#3A2E26]') ||
          bg === 'rgb(36, 29, 23)' || 
          bg === 'rgb(26, 21, 18)' ||
          bg === 'rgb(58, 46, 38)'
        );
      });
      
      setIsOverDark(overDark);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <section className="min-h-screen w-full flex flex-col justify-center overflow-hidden bg-[#FDFBF7] relative">
        {/* Soft Ambient Glowing Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#F3E5D8] blur-[120px] opacity-60 pointer-events-none z-0"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#E8DCCB] blur-[150px] opacity-50 pointer-events-none z-0"></div>
        <div className="absolute top-[30%] right-[20%] w-[40vw] h-[40vw] rounded-full bg-[#FFF] blur-[100px] opacity-40 pointer-events-none z-0"></div>

        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center relative z-10">
          
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
                  href="/products"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/products');
                  }}
                  className="group relative inline-flex items-center justify-center bg-[#3A2E26] text-[#FDFBF7] px-8 py-4 text-[10px] uppercase tracking-[0.2em] font-bold overflow-hidden transition-all duration-500 hover:bg-[#C97C5D] cursor-pointer"
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
                  onClick={(e) => {
                    if (secondary_button_link.startsWith('#')) {
                      e.preventDefault();
                      onNavigate('/', secondary_button_link);
                    }
                  }}
                  className="group inline-flex items-center justify-center text-[#3A2E26] px-2 py-4 text-[10px] uppercase tracking-[0.2em] font-bold relative cursor-pointer"
                >
                  {secondary_button_text}
                  <span className="absolute bottom-3 left-2 w-0 h-[1px] bg-[#3A2E26] transition-all duration-500 group-hover:w-[calc(100%-16px)]"></span>
                </a>
              )}
            </div>
          </div>

          {/* Right Side: Imagery with Soft Shadows */}
          <div className="w-full md:w-1/2 min-h-[50vh] md:h-screen relative flex items-center justify-center p-8 lg:p-12 overflow-hidden">
           {/* Main Image - Soft Professional Rectangle */}
           <div className="relative w-full max-w-[380px] aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl animate-float z-10 border-4 border-white/60 backdrop-blur-sm">
              <img 
                 src={settings?.image_url || "/images/soap-hero.png"}
                 alt="Primary Hero"
                 className="w-full h-full object-cover origin-center transition-transform duration-[10s] ease-out hover:scale-105"
                 onError={(e) => { e.target.onerror = null; e.target.src = "/images/soap-hero.png"; }}
              />
           </div>

           {/* Secondary Overlapping Image */}
           <div className="absolute bottom-[12%] left-[5%] md:left-0 lg:left-[5%] w-48 lg:w-60 aspect-[4/3] rounded-[1.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-[8px] border-white/80 animate-float-reverse z-20" style={{ animationDelay: '0.5s' }}>
              <img 
                 src={settings?.secondary_image_url || "/images/soap-stack.png"}
                 alt="Soap Stack"
                 className="w-full h-full object-cover origin-center transition-transform duration-[10s] ease-out hover:scale-105"
                 onError={(e) => { e.target.onerror = null; e.target.src = "/images/soap-stack.png"; }}
              />
           </div>

           {/* Subtle Text Badge overlay (Fixed & Rotating) */}
           <a 
              href="#"
              onClick={(e) => {
                e.preventDefault();
                let num = (settings?.social_links?.whatsapp || "").replace(/[^0-9]/g, '');
                if (num.length === 10) num = '91' + num;
                if (!num) return;
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                window.open(isMobile ? `https://wa.me/${num}` : `https://web.whatsapp.com/send?phone=${num}`, '_blank', 'noopener,noreferrer');
              }}
              id="rotating-badge"
              className={`fixed bottom-8 right-8 z-[99] w-32 h-32 hidden lg:flex items-center justify-center cursor-pointer transition-all duration-500 hover:scale-105 ${
                isOverDark ? 'opacity-100 mix-blend-normal' : 'opacity-80 mix-blend-multiply'
              }`}
           >
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[spin_20s_linear_infinite]">
                 <path id="circle" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none" />
                 <text className={`text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-500 ${
                   isOverDark ? 'fill-[#FDFBF7]' : 'fill-[#3A2E26]'
                 }`}>
                   <textPath href="#circle">
                     {settings?.hero?.rotating_text || "HANDCRAFTED • 100% PURE ART •"}
                   </textPath>
                 </text>
              </svg>
              
              {/* WhatsApp Icon */}
              <div className="relative z-10 w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-500 shadow-sm bg-[#25D366] text-white">
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                 </svg>
              </div>
           </a>
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
