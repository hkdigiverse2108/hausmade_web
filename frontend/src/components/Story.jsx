import React from 'react';
import { Heart, Sparkles, Sprout, Leaf, Award, ShieldCheck, Flower2, Droplets, HeartHandshake, CheckCircle2 } from 'lucide-react';

export default function Story({ settings }) {
  const title = settings?.title || "From our kitchen counter to your daily sanctuary.";
  const subtitle = settings?.subtitle || "Our Heritage";
  const paragraph1 = settings?.paragraph1 || "Hausmade began in the autumn of 2018 when our founder Elena could not find a commercial soap that didn’t leave her skin dry, itchy, and irritated by synthetic dyes and fake fragrances.";
  const paragraph2 = settings?.paragraph2 || "We went back to ancient cold-process saponification roots: slowly combining raw organic butter, wildflower honey, and steam-distilled essential oils. Every single bar is poured by hand, cut with guitar wire, and cured for 6 full weeks to ensure a long-lasting, ultra-creamy bar.";
  const imageUrl = settings?.image_url || "/images/founder-workshop.png";
  const authorName = settings?.author_name || "Elena Vance — Master Artisan";
  const authorTitle = settings?.author_title || "Hand-pouring batches in Vermont";

  const iconMap = {
    Sprout, Sparkles, Leaf, Award, ShieldCheck, Flower2, Droplets, HeartHandshake, CheckCircle2
  };

  const defaultPillars = [
    { title: "Sustainable Farming", subtitle: "Ethically sourced non-GMO herbs", icon: "Sprout" },
    { title: "Zero Chemicals", subtitle: "Free from parabens & sulfates", icon: "Sparkles" }
  ];

  const rawPillars = settings?.pillars && settings.pillars.length > 0 ? settings.pillars : defaultPillars;

  return (
    <section id="story" className="py-24 lg:py-36 bg-[#FDFBF7] scroll-mt-20 relative overflow-hidden border-t border-b border-[#3A2E26]/5">
      {/* Decorative oversized watermark */}
      <div className="absolute top-0 left-0 text-[#3A2E26]/[0.02] font-serif-brand text-[30rem] leading-none select-none pointer-events-none -translate-y-1/4 -translate-x-1/4">
        H
      </div>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Workshop Image Frame */}
          <div className="lg:col-span-5 relative order-2 lg:order-1 flex justify-center">
            <div className="relative w-full max-w-sm lg:max-w-md group">
              <div className="absolute -inset-4 border border-[#C97C5D]/30 rounded-t-full rounded-b-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              <div className="relative rounded-t-full rounded-b-[2rem] overflow-hidden shadow-2xl border border-[#3A2E26]/10 transform transition-transform duration-700 group-hover:-translate-y-2">
                <img
                  src={imageUrl}
                  alt="Founder Crafting Soap in Workshop"
                  className="w-full h-[450px] sm:h-[550px] md:h-[650px] object-cover transition-transform duration-[20s] hover:scale-110"
                />
                <div className="absolute bottom-6 left-6 right-6 bg-[#FDFBF7]/90 backdrop-blur-xl p-6 rounded-3xl border border-[#3A2E26]/5 shadow-lg text-center transform translate-y-2 opacity-90 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <p className="font-serif-brand text-xl text-[#3A2E26]">{authorName}</p>
                  <p className="text-[10px] text-[#C97C5D] uppercase tracking-[0.2em] mt-1.5 font-bold">{authorTitle}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Story Narrative Text */}
          <div className="lg:col-span-7 space-y-10 order-1 lg:order-2 lg:pl-12 relative z-10">
            <div className="flex items-center gap-4">
              <span className="h-[1px] w-12 bg-[#3A2E26]/20"></span>
              <span className="text-[#8C7A5B] font-bold text-xs uppercase tracking-[0.2em]">{subtitle}</span>
            </div>

            <h2 className="font-serif-brand text-4xl sm:text-5xl lg:text-7xl font-normal text-[#3A2E26] leading-[1.05] tracking-tight">
              {title}
            </h2>

            <div className="space-y-6 text-base sm:text-lg lg:text-xl text-[#3A2E26]/75 leading-relaxed font-light">
              <p className="first-letter:text-7xl first-letter:font-serif-brand first-letter:text-[#C97C5D] first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8]">{paragraph1}</p>
              <p>{paragraph2}</p>
            </div>

            {/* Micro Pillars */}
            {rawPillars.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-[#3A2E26]/10 mt-8">
                {rawPillars.map((pillar, idx) => {
                  const Icon = iconMap[pillar.icon] || Sprout;
                  return (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="mt-1 shrink-0 p-3 rounded-full bg-[#C97C5D]/5 border border-[#C97C5D]/10">
                        <Icon className="w-5 h-5 text-[#C97C5D]" />
                      </div>
                      <div>
                        <h4 className="font-serif-brand font-bold text-lg text-[#3A2E26]">{pillar.title}</h4>
                        <p className="text-sm text-[#3A2E26]/60 mt-1">{pillar.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
