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
      q: 'How does the Subscribe & Save subscription work?',
      a: 'When you choose Subscribe & Save, you lock in an extra 15% discount on every order. We deliver fresh soap according to your selected frequency (every 1, 2, or 3 months). You can modify your schedule, pause, or cancel at any time directly from your email link.'
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

  return (
    <section id="faq" className="py-16 lg:py-24 bg-[#F5F1E8] scroll-mt-20">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <span className="text-[#7A8B6F] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-1.5">
            <HelpCircle className="w-4 h-4" /> Got Questions?
          </span>
          <h2 className="font-serif-brand text-2xl sm:text-4xl font-normal text-[#3A2E26] mt-2">
            Frequently Asked Questions
          </h2>
          <p className="text-[#3A2E26]/70 mt-2 text-sm sm:text-base">
            Everything you need to know about our handcrafted soaps and ordering process.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#3A2E26]/10 shadow-sm overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 md:p-6 text-left flex items-center justify-between gap-3 font-serif-brand font-bold text-base sm:text-lg text-[#3A2E26] hover:text-[#7A8B6F] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[#7A8B6F] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-sm sm:text-base text-[#3A2E26]/80 leading-relaxed font-light border-t border-[#3A2E26]/5 pt-4 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
