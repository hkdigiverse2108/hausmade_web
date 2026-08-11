import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQ({ settings }) {
  const [openIndex, setOpenIndex] = useState(0);

  const fallbackFaqs = [
    {
      q: 'How long does one soap bar typically last?',
      a: 'When kept dry on a draining soap dish between uses, one Hausmade bar lasts approximately 3 to 4 weeks for daily shower use by a single person. Because we cure our soap for 6 full weeks, our bars are firmer and last longer than high-water commercial bars.'
    },
    {
      q: 'Is this soap safe for sensitive skin and eczema?',
      a: 'Yes, absolutely! Our French Lavender & Oat bar was specially formulated for sensitive and reactive skin. We use colloidal oats to calm inflammation and organic plant oils that restore the natural moisture barrier without synthetic detergents.'
    },
    {
      q: 'What is your shipping policy?',
      a: 'We ship all orders in 100% plastic-free, recyclable cardboard boxes. Standard shipping takes 3-5 business days. All orders over $35 ship completely FREE!'
    },

    {
      q: 'Are your soaps vegan and cruelty-free?',
      a: 'All our soap varieties are 100% cruelty-free and never tested on animals. Our formulations use pure plant oils, raw wildflower honey, and organic botanical powders.'
    },
    {
      q: 'What is your 30-day return policy?',
      a: 'We want you to love your bathing experience! If you are not completely delighted with your purchase for any reason within 30 days, reach out to our customer care team and we will provide a full refund or exchange — no hassle required.'
    }
  ];

  const faqs = settings?.faqs && settings.faqs.length > 0 ? settings.faqs : fallbackFaqs;

  const headerBadge = settings?.faq_header?.badge || settings?.faqs_header?.badge || "Got Questions?";
  const headerTitle = settings?.faq_header?.title || settings?.faqs_header?.title || "Frequently Asked Questions";
  const headerDescription = settings?.faq_header?.description || settings?.faqs_header?.description || "Everything you need to know about our handcrafted soaps and ordering process.";

  return (
    <section id="faq" className="py-20 lg:py-32 bg-[#FDFBF7] scroll-mt-20">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        
        {/* Elegant Minimal Header */}
        <div className="text-center mb-16 lg:mb-24">
          {headerBadge && (
            <span className="text-[#8C7A5B] font-medium text-xs uppercase tracking-[0.2em] mb-4 block">
              {headerBadge}
            </span>
          )}
          {headerTitle && (
            <h2 className="font-serif-brand text-4xl sm:text-5xl font-normal text-[#3A2E26] leading-tight mb-6">
              {headerTitle}
            </h2>
          )}
          {headerDescription && (
            <p className="text-[#3A2E26]/60 text-base sm:text-lg max-w-2xl mx-auto">
              {headerDescription}
            </p>
          )}
        </div>

        {/* Minimalist Accordion */}
        <div className="border-t border-[#3A2E26]/10">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const num = (idx + 1).toString().padStart(2, '0');
            
            return (
              <div key={idx} className="border-b border-[#3A2E26]/10">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full py-6 sm:py-8 text-left flex items-start sm:items-center justify-between gap-6 group"
                >
                  <div className="flex items-start sm:items-center gap-6 w-full">
                    <span className="font-serif-brand text-lg text-[#8C7A5B]/50 font-medium">
                      {num}
                    </span>
                    <span className={`font-serif-brand text-xl sm:text-2xl transition-colors duration-300 ${
                      isOpen ? 'text-[#C97C5D]' : 'text-[#3A2E26] group-hover:text-[#C97C5D]'
                    }`}>
                      {faq.q}
                    </span>
                  </div>
                  
                  {/* Simple Elegant Icon */}
                  <div className="relative w-6 h-6 shrink-0 flex items-center justify-center mt-1 sm:mt-0">
                    <div className={`absolute w-4 h-[1px] bg-[#3A2E26] transition-transform duration-500 ${
                      isOpen ? 'rotate-180 bg-[#C97C5D]' : ''
                    }`}></div>
                    <div className={`absolute w-4 h-[1px] bg-[#3A2E26] transition-transform duration-500 ${
                      isOpen ? 'rotate-180 opacity-0 bg-[#C97C5D]' : 'rotate-90 opacity-100'
                    }`}></div>
                  </div>
                </button>

                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    isOpen ? 'max-h-[500px] opacity-100 pb-8' : 'max-h-0 opacity-0 pb-0'
                  }`}
                >
                  <div className="pl-11 sm:pl-12 pr-4 sm:pr-12 text-base sm:text-lg leading-relaxed text-[#3A2E26]/70 font-light">
                    {faq.a}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
