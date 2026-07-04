import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { getReviews } from '../utils/api';

export default function Reviews() {
  const staticReviews = [
    {
      id: 'static-1',
      name: 'Roselin Mogaria',
      initial: 'R',
      rating: 5,
      verified: 'Google Verified',
      comment: '"Nice design. Must visit here . Good staff service"'
    },
    {
      id: 'static-2',
      name: 'Sarah M.',
      initial: 'S',
      rating: 5,
      verified: 'Verified Bather',
      comment: '"Saved my sensitive winter skin! Switching to the 3-pack of lavender oat soap transformed my shower routine. Creamy lather!"'
    },
    {
      id: 'static-3',
      name: 'David K.',
      initial: 'D',
      rating: 5,
      verified: 'Verified Bather',
      comment: '"Lasts twice as long as store soap. One bar lasted me nearly 4 weeks in the shower. The Subscribe & Save option is great."'
    }
  ];

  const [reviewsList, setReviewsList] = useState(staticReviews);

  useEffect(() => {
    async function loadReviews() {
      try {
        const fetched = await getReviews();
        if (fetched && fetched.length > 0) {
          const formatted = fetched.map(r => ({
            id: r.id || r._id,
            name: r.userName,
            initial: r.userName ? r.userName.charAt(0).toUpperCase() : 'V',
            rating: r.rating,
            verified: 'Verified Buyer',
            comment: `"${r.comment}"`
          }));
          setReviewsList([...staticReviews, ...formatted]);
        }
      } catch (err) {
        console.error('Failed to load dynamic reviews:', err);
      }
    }
    loadReviews();
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, reviewsList.length - (isMobile ? 1 : 3));

  // Auto-slide every 4.5 seconds
  useEffect(() => {
    if (reviewsList.length === 0) return;
    const timer = setInterval(() => {
      handleNext();
    }, 4500);
    return () => clearInterval(timer);
  }, [currentIndex, reviewsList.length, isMobile]);

  const handleNext = () => {
    if (reviewsList.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) > maxIndex ? 0 : prev + 1);
  };

  const handlePrev = () => {
    if (reviewsList.length === 0) return;
    setCurrentIndex((prev) => (prev - 1) < 0 ? maxIndex : prev - 1);
  };

  const handleDotClick = (idx) => {
    setCurrentIndex(idx);
  };

  return (
    <section id="reviews" className="py-16 lg:py-24 bg-[#EFECE6] scroll-mt-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Header matching requested style */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="h-[1px] w-12 bg-[#3A2E26]/20"></span>
            <span className="text-[#8C7A5B] font-bold text-xs uppercase tracking-widest">Reviews</span>
            <span className="h-[1px] w-12 bg-[#3A2E26]/20"></span>
          </div>
          
          <h2 className="font-serif-brand text-2xl sm:text-4xl lg:text-5xl font-normal text-[#3A2E26] mt-2">
            What Our Customers Say
          </h2>

          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#3A2E26]/70 mt-3 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#8C7A5B]" />
            <span>4.9 / 5 · Verified by Google · 2,400+ reviews</span>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-6xl mx-auto px-8 sm:px-10">
          
          {/* Previous Arrow Button */}
          <button
            onClick={handlePrev}
            className="absolute -left-1 sm:-left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 shadow-md border border-[#3A2E26]/10 flex items-center justify-center text-[#3A2E26] hover:bg-[#8C7A5B] hover:text-white transition-all cursor-pointer"
            aria-label="Previous review"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Review Cards Grid with smooth CSS track sliding */}
          <div className="w-full overflow-hidden min-h-[220px]">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (isMobile ? 100 : 33.3333)}%)` }}
            >
              {reviewsList.map((rev, idx) => (
                <div
                  key={`${rev.id}-${idx}`}
                  className="w-full md:w-1/3 shrink-0 px-2 sm:px-3"
                >
                  <div className="bg-[#F6F4F0] p-5 sm:p-6 md:p-8 rounded-2xl border border-[#3A2E26]/10 shadow-sm hover:shadow-lg hover:-translate-y-2 hover:scale-[1.02] hover:border-[#8C7A5B]/30 active:scale-[0.98] transition-all duration-300 ease-out flex flex-col justify-between h-full min-h-[180px] sm:min-h-[220px] cursor-pointer select-none">
                    <div>
                      {/* Author Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#8C7A5B] text-white font-serif-brand font-bold text-lg flex items-center justify-center shadow-xs shrink-0">
                          {rev.initial}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-[#3A2E26] leading-snug">
                            {rev.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex text-[#8C7A5B]">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                            </div>
                            <span className="text-[10px] text-[#3A2E26]/60 font-medium flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3 text-[#8C7A5B]" />
                              {rev.verified}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Comment */}
                      <p className="text-xs sm:text-sm text-[#3A2E26]/80 italic leading-relaxed font-light">
                        {rev.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Arrow Button */}
          <button
            onClick={handleNext}
            className="absolute -right-1 sm:-right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#8C7A5B] shadow-md flex items-center justify-center text-white hover:bg-[#77674b] transition-all cursor-pointer"
            aria-label="Next review"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

        </div>

        {/* Carousel Indicators / Dots */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === idx ? 'w-6 bg-[#8C7A5B]' : 'w-2 bg-[#3A2E26]/20'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
