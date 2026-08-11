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
    <section id="story" className="py-20 lg:py-32 bg-[#FDFBF7] scroll-mt-20 relative overflow-hidden border-t border-b border-[#3A2E26]/5">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Workshop Image Frame */}
          <div className="lg:col-span-5 relative order-2 lg:order-1">
            <div className="relative mx-auto max-w-sm lg:max-w-md">
              <div className="relative rounded-[2rem] overflow-hidden shadow-xl border border-[#3A2E26]/5">
                <img
                  src={imageUrl}
                  alt="Founder Crafting Soap in Workshop"
                  className="w-full h-[400px] sm:h-[500px] md:h-[600px] object-cover transition-transform duration-[15s] hover:scale-105"
                />
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-[#3A2E26]/5 shadow-sm text-center">
                  <p className="font-serif-brand text-lg text-[#3A2E26]">{authorName}</p>
                  <p className="text-[10px] text-[#7A8B6F] uppercase tracking-[0.15em] mt-1 font-bold">{authorTitle}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Story Narrative Text */}
          <div className="lg:col-span-7 space-y-8 order-1 lg:order-2 lg:pl-8">
            <div className="flex items-center gap-4">
              <span className="h-[1px] w-12 bg-[#3A2E26]/20"></span>
              <span className="text-[#8C7A5B] font-bold text-xs uppercase tracking-[0.2em]">{subtitle}</span>
            </div>

            <h2 className="font-serif-brand text-3xl sm:text-5xl lg:text-6xl font-normal text-[#3A2E26] leading-[1.1]">
              {title}
            </h2>

            <div className="space-y-6 text-base sm:text-lg text-[#3A2E26]/75 leading-relaxed font-light">
              <p>{paragraph1}</p>
              <p>{paragraph2}</p>
            </div>

            {/* Micro Pillars */}
            {rawPillars.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-[#3A2E26]/10 mt-8">
                {rawPillars.map((pillar, idx) => {
                  const Icon = iconMap[pillar.icon] || Sprout;
                  return (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="mt-1 shrink-0">
                        <Icon className="w-5 h-5 text-[#8C7A5B]" />
                      </div>
                      <div>
                        <h4 className="font-serif-brand font-bold text-base text-[#3A2E26]">{pillar.title}</h4>
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
