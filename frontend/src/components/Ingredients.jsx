import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Flower2, Droplets, HeartHandshake, CheckCircle2, XCircle, Leaf } from 'lucide-react';

export default function Ingredients({ settings }) {
  const [visibleCards, setVisibleCards] = useState([]);
  const [tableVisible, setTableVisible] = useState(false);
  const sectionRef = useRef(null);
  const tableRef = useRef(null);

  // Icon mapping for dynamic ingredients from admin
  const iconMap = { Sparkles, Flower2, Droplets, HeartHandshake, Leaf, CheckCircle2 };

  // Visual style presets that cycle through for each ingredient
  const stylePresets = [
    { gradient: 'from-[#C97C5D]/20 to-[#E8A87C]/10', iconBg: 'bg-gradient-to-br from-[#C97C5D] to-[#E8A87C]', glow: 'shadow-[#C97C5D]/20', accent: '#C97C5D' },
    { gradient: 'from-[#7A8B6F]/20 to-[#A3B899]/10', iconBg: 'bg-gradient-to-br from-[#7A8B6F] to-[#A3B899]', glow: 'shadow-[#7A8B6F]/20', accent: '#7A8B6F' },
    { gradient: 'from-[#8C7A5B]/20 to-[#B8A88A]/10', iconBg: 'bg-gradient-to-br from-[#8C7A5B] to-[#B8A88A]', glow: 'shadow-[#8C7A5B]/20', accent: '#8C7A5B' },
    { gradient: 'from-[#5B8C7A]/20 to-[#89B8A3]/10', iconBg: 'bg-gradient-to-br from-[#5B8C7A] to-[#89B8A3]', glow: 'shadow-[#5B8C7A]/20', accent: '#5B8C7A' },
  ];

  const fallbackIngredients = [
    { name: 'Pure Kashmiri Kesar (Saffron)', icon: 'Sparkles', benefit: 'Known for skin-glowing properties, reduces post-shave hyperpigmentation and calms razor burn.' },
    { name: 'Organic Shea Butter Cushion', icon: 'HeartHandshake', benefit: 'Creates a rich protective barrier on skin so razors glide smoothly without nicks or irritation.' },
    { name: 'Steam-Distilled Sandalwood Oil', icon: 'Flower2', benefit: 'Provides an authentic earthy botanical scent while naturally calming shaved skin follicles.' },
    { name: 'Cold-Pressed Coconut Glycerin', icon: 'Droplets', benefit: 'Whips into a dense micro-foam lather that holds moisture against hair follicles for a close shave.' }
  ];

  const rawIngredients = settings?.ingredients && settings.ingredients.length > 0 ? settings.ingredients : fallbackIngredients;

  // Merge dynamic data with visual styles
  const ingredients = rawIngredients.map((item, idx) => ({
    ...item,
    icon: iconMap[item.icon] || Sparkles,
    ...stylePresets[idx % stylePresets.length]
  }));

  const comparison = [
    { feature: 'Dense Shaving Cushion Lather', commercial: false, pure: true, detail: 'Commercial foams collapse quickly; Hausmade holds dense foam' },
    { feature: 'Pure Kashmiri Kesar Infusion', commercial: false, pure: true, detail: 'Infused with real saffron strands to brighten skin tone' },
    { feature: 'Zero Synthetic Propellants', commercial: false, pure: true, detail: 'Canned foams use chemical butane gas that dries out skin' },
    { feature: '6-Week Cold Cured Puck', commercial: false, pure: true, detail: 'Hand-cured for max longevity in a shaving bowl' },
    { feature: 'Zero Plastic Packaging', commercial: false, pure: true, detail: 'Wrapped in 100% biodegradable recycled paper' }
  ];

  // Intersection observer for staggered card animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger card reveals
            ingredients.forEach((_, idx) => {
              setTimeout(() => {
                setVisibleCards(prev => [...new Set([...prev, idx])]);
              }, idx * 180);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Table animation observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTableVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    if (tableRef.current) observer.observe(tableRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="ingredients" className="py-16 lg:py-28 bg-[#F5F1E8] scroll-mt-20 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#7A8B6F]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C97C5D]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-[#8C7A5B]/3 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7A8B6F]/10 border border-[#7A8B6F]/20 mb-4">
            <Leaf className="w-3.5 h-3.5 text-[#7A8B6F]" />
            <span className="text-[#7A8B6F] font-bold text-xs uppercase tracking-widest">Pure & Honest</span>
          </div>
          <h2 className="font-serif-brand text-3xl sm:text-4xl lg:text-5xl font-normal text-[#3A2E26] mt-2 leading-tight">
            Ingredients You Can{' '}
            <span className="relative inline-block">
              Pronounce
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M2 6C50 2 150 2 198 6" stroke="#C97C5D" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
              </svg>
            </span>
          </h2>
          <p className="text-[#3A2E26]/60 mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Every bar is crafted with intention. No fillers, no mysterious chemicals, just whole plant remedies sourced from nature's finest botanicals.
          </p>
        </div>

        {/* Premium Ingredients Grid */}
        <div ref={sectionRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-14 sm:mb-24">
          {ingredients.map((item, idx) => {
            const Icon = item.icon;
            const isVisible = visibleCards.includes(idx);
            return (
              <div
                key={idx}
                className={`group relative transition-all duration-700 ease-out ${
                  isVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                {/* Animated gradient border */}
                <div className="absolute -inset-[1px] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-transparent via-[#3A2E26]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Card */}
                <div className={`relative bg-white/80 backdrop-blur-xl p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-white/60 shadow-lg hover:shadow-2xl ${item.glow} transition-all duration-500 transform group-hover:-translate-y-2 group-hover:bg-white/95 flex flex-col justify-between h-full overflow-hidden`}>
                  
                  {/* Subtle gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl sm:rounded-3xl`} />
                  
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 overflow-hidden rounded-2xl sm:rounded-3xl">
                    <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
                  </div>

                  <div className="relative z-10">
                    {/* Icon with gradient background */}
                    <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${item.iconBg} flex items-center justify-center mb-4 sm:mb-6 shadow-lg transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="font-serif-brand font-bold text-sm sm:text-lg lg:text-xl text-[#3A2E26] mb-2 sm:mb-3 group-hover:text-[#3A2E26] transition-colors leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#3A2E26]/60 leading-relaxed group-hover:text-[#3A2E26]/75 transition-colors">
                      {item.benefit}
                    </p>
                  </div>

                  {/* Bottom accent line */}
                  <div 
                    className="mt-4 sm:mt-6 h-[2px] rounded-full w-0 group-hover:w-full transition-all duration-700 ease-out"
                    style={{ background: `linear-gradient(to right, ${item.accent}, transparent)` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Premium Comparison Chart */}
        <div 
          ref={tableRef}
          className={`relative max-w-4xl mx-auto transition-all duration-1000 ease-out ${
            tableVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {/* Glow behind card */}
          <div className="absolute -inset-4 bg-gradient-to-br from-[#7A8B6F]/10 via-transparent to-[#C97C5D]/10 rounded-[2rem] blur-2xl" />
          
          <div className="relative max-w-full overflow-hidden bg-gradient-to-br from-[#EFECE6] to-[#F5F1E8] p-4 sm:p-10 md:p-12 rounded-3xl border border-[#3A2E26]/8 transform transition-all duration-500 hover:shadow-[0_25px_60px_-12px_rgba(58,46,38,0.15)]">
            
            <div className="text-center mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#C97C5D]/10 border border-[#C97C5D]/20 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#C97C5D]" />
                <span className="text-[#C97C5D] font-bold text-[10px] uppercase tracking-widest">The Difference</span>
              </div>
              <h3 className="font-serif-brand text-2xl sm:text-3xl lg:text-4xl font-normal text-[#3A2E26]">
                Why Hausmade is <span className="italic text-[#7A8B6F]">Different</span>
              </h3>
              <p className="text-sm sm:text-base text-[#3A2E26]/55 mt-2 max-w-lg mx-auto">
                Mass-market soaps are technically synthetic detergent bars. Here is how we compare:
              </p>
            </div>

            <div className="overflow-x-auto w-full rounded-2xl border border-[#3A2E26]/8 shadow-inner bg-white/60 backdrop-blur-sm scrollbar-thin">
              <table className="w-full min-w-[520px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#3A2E26]/10">
                    <th className="py-5 px-4 sm:px-6 font-bold text-xs sm:text-sm text-[#3A2E26] uppercase tracking-wider">Botanical Quality</th>
                    <th className="py-5 px-4 sm:px-6 font-bold text-xs sm:text-sm text-center text-[#3A2E26]/40 uppercase tracking-wider">
                      <span className="inline-flex flex-col items-center">
                        <span className="text-xs">Mass-Market</span>
                        <span className="text-[10px] text-[#3A2E26]/30 font-normal normal-case">Synthetic bars</span>
                      </span>
                    </th>
                    <th className="py-5 px-4 sm:px-6 font-bold text-xs sm:text-sm text-center text-[#7A8B6F] bg-gradient-to-b from-[#7A8B6F]/8 to-[#7A8B6F]/3 relative uppercase tracking-wider">
                      <span className="relative z-10 flex flex-col items-center">
                        <span className="text-xs">Hausmade™</span>
                        <span className="text-[10px] text-white bg-[#7A8B6F] px-2.5 py-0.5 rounded-full mt-1 font-bold tracking-wider shadow-sm">
                          Best Choice
                        </span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A2E26]/5 text-sm sm:text-base">
                  {comparison.map((row, index) => (
                    <tr 
                      key={index} 
                      className={`group hover:bg-[#7A8B6F]/5 transition-all duration-500 ${
                        tableVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                      }`}
                      style={{ transitionDelay: `${400 + index * 120}ms` }}
                    >
                      <td className="py-4 sm:py-5 px-4 sm:px-6 transition-all duration-300 group-hover:pl-7">
                        <p className="font-semibold text-[#3A2E26] text-sm sm:text-base group-hover:text-[#7A8B6F] transition-colors">{row.feature}</p>
                        <p className="text-[11px] sm:text-xs text-[#3A2E26]/45 mt-0.5 leading-relaxed">{row.detail}</p>
                      </td>
                      <td className="py-4 sm:py-5 px-4 sm:px-6 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-50 border border-red-200/50 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-red-100">
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 sm:py-5 px-4 sm:px-6 text-center bg-[#7A8B6F]/3 group-hover:bg-[#7A8B6F]/8 transition-colors">
                        <div className="flex items-center justify-center">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#7A8B6F]/15 border border-[#7A8B6F]/20 flex items-center justify-center transition-all duration-300 group-hover:scale-125 group-hover:bg-[#7A8B6F]/25 group-hover:shadow-md group-hover:shadow-[#7A8B6F]/20">
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#7A8B6F]" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom trust badge */}
            <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/70 border border-[#7A8B6F]/15 shadow-sm">
                <Leaf className="w-3.5 h-3.5 text-[#7A8B6F]" />
                <span className="text-[11px] sm:text-xs font-bold text-[#3A2E26]/60 uppercase tracking-wider">100% Verified Botanical Ingredients</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
