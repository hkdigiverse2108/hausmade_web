import React from 'react';
import { Sparkles, Flower2, Droplets, HeartHandshake, CheckCircle2, XCircle } from 'lucide-react';

export default function Ingredients() {
  const ingredients = [
    {
      name: 'Pure Kashmiri Kesar (Saffron)',
      icon: Sparkles,
      benefit: 'Known for skin-glowing properties, reduces post-shave hyperpigmentation and calms razor burn.',
      color: 'bg-[#C97C5D]/15 text-[#C97C5D]'
    },
    {
      name: 'Organic Shea Butter Cushion',
      icon: HeartHandshake,
      benefit: 'Creates a rich protective barrier on skin so razors glide smoothly without nicks or irritation.',
      color: 'bg-[#7A8B6F]/15 text-[#7A8B6F]'
    },
    {
      name: 'Steam-Distilled Sandalwood Oil',
      icon: Flower2,
      benefit: 'Provides an authentic earthy botanical scent while naturally calming shaved skin follicles.',
      color: 'bg-[#3A2E26]/10 text-[#3A2E26]'
    },
    {
      name: 'Cold-Pressed Coconut Glycerin',
      icon: Droplets,
      benefit: 'Whips into a dense micro-foam lather that holds moisture against hair follicles for a close shave.',
      color: 'bg-[#7A8B6F]/15 text-[#7A8B6F]'
    }
  ];

  const comparison = [
    { feature: 'Dense Shaving Cushion Lather', commercial: false, pure: true, detail: 'Commercial foams collapse quickly; PureBotanica holds dense foam' },
    { feature: 'Pure Kashmiri Kesar Infusion', commercial: false, pure: true, detail: 'Infused with real saffron strands to brighten skin tone' },
    { feature: 'Zero Synthetic Propellants', commercial: false, pure: true, detail: 'Canned foams use chemical butane gas that dries out skin' },
    { feature: '6-Week Cold Cured Puck', commercial: false, pure: true, detail: 'Hand-cured for max longevity in a shaving bowl' },
    { feature: 'Zero Plastic Packaging', commercial: false, pure: true, detail: 'Wrapped in 100% biodegradable recycled paper' }
  ];


  return (
    <section id="ingredients" className="py-16 lg:py-24 bg-[#F5F1E8] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#7A8B6F] font-bold text-xs uppercase tracking-widest">Pure & Honest</span>
          <h2 className="font-serif-brand text-2xl sm:text-4xl lg:text-5xl font-normal text-[#3A2E26] mt-2">
            Ingredients You Can Pronounce
          </h2>
          <p className="text-[#3A2E26]/70 mt-3 text-base sm:text-lg">
            Every bar is crafted with intention. No fillers, no mysterious chemicals, just whole plant remedies.
          </p>
        </div>

        {/* Ingredients Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-20">
          {ingredients.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white/70 backdrop-blur-sm p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/80 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${item.color} flex items-center justify-center mb-3 sm:mb-5`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="font-serif-brand font-bold text-sm sm:text-xl text-[#3A2E26] mb-1 sm:mb-2">{item.name}</h3>
                  <p className="text-xs sm:text-sm text-[#3A2E26]/75 leading-relaxed">{item.benefit}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Why It's Different Section / Comparison Chart */}
        <div className="bg-[#EFECE6] p-6 sm:p-10 md:p-12 rounded-3xl shadow-xl border border-[#3A2E26]/10 max-w-4xl mx-auto transform transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
          <div className="text-center mb-8">
            <h3 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#3A2E26]">
              Why PureBotanica is Different
            </h3>
            <p className="text-sm sm:text-base text-[#3A2E26]/70 mt-2">
              Mass-market soaps are technically synthetic detergent bars. Here is how we compare:
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#3A2E26]/10 shadow-sm bg-white/50 backdrop-blur-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#3A2E26]/10 bg-[#3A2E26]/5">
                  <th className="py-5 px-5 font-bold text-sm text-[#3A2E26]">Botanical Quality</th>
                  <th className="py-5 px-5 font-bold text-sm text-center text-gray-500">Mass-Market Bars</th>
                  <th className="py-5 px-5 font-bold text-sm text-center text-[#7A8B6F] bg-[#7A8B6F]/10 relative">
                    <span className="relative z-10 flex flex-col items-center">
                      PureBotanica Soap
                      <span className="text-[10px] uppercase tracking-wider text-[#7A8B6F] bg-white border border-[#7A8B6F]/20 px-2 py-0.5 rounded-full mt-1 font-semibold animate-pulse">
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
                    className="group hover:bg-[#7A8B6F]/5 transition-all duration-300 transform hover:scale-[1.01]"
                  >
                    <td className="py-5 px-5 transition-all duration-300 group-hover:pl-7">
                      <p className="font-semibold text-[#3A2E26] group-hover:text-[#7A8B6F] transition-colors">{row.feature}</p>
                      <p className="text-xs text-[#3A2E26]/60 mt-0.5">{row.detail}</p>
                    </td>
                    <td className="py-5 px-5 text-center">
                      <XCircle className="w-6 h-6 text-red-400 mx-auto transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                    </td>
                    <td className="py-5 px-5 text-center bg-[#7A8B6F]/5 group-hover:bg-[#7A8B6F]/10 transition-colors">
                      <CheckCircle2 className="w-6 h-6 text-[#7A8B6F] mx-auto transition-all duration-300 group-hover:scale-125 group-hover:rotate-6" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}
