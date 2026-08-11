import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { getReviews } from '../utils/api';

export default function Reviews({ settings }) {
  const headerBadge = settings?.reviews_header?.badge || settings?.reviews?.badge || "Reviews";
  const headerTitle = settings?.reviews_header?.title || settings?.reviews?.title || "What Our Customers Say";
  const ratingSubtext = settings?.reviews_header?.rating_subtext || settings?.reviews?.rating_subtext || "4.9 / 5 · Verified by Google · 2,400+ reviews";

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
    },
    {
      id: 'static-4',
      name: 'Elena P.',
      initial: 'E',
      rating: 5,
      verified: 'Verified Buyer',
      comment: '"Absolutely love the sandalwood aroma. It fills the whole bathroom without being overpowering. Skin feels amazingly soft!"'
    },
    {
      id: 'static-5',
      name: 'Michael T.',
      initial: 'M',
      rating: 5,
      verified: 'Google Verified',
      comment: '"Best soap I’ve ever used. The lather is insanely rich and it doesn’t dry my skin out like normal bar soaps do."'
    },
    {
      id: 'static-6',
      name: 'Priya R.',
      initial: 'P',
      rating: 5,
      verified: 'Verified Bather',
      comment: '"The kesar infusion genuinely brightened my skin tone over a few weeks. So luxurious and totally worth the price."'
    }
  ];

  const [reviewsList, setReviewsList] = useState(staticReviews);
  const [editingReviewId, setEditingReviewId] = useState(() => localStorage.getItem('hausmade_editing_review_id'));
  const [editingReviewData, setEditingReviewData] = useState(() => {
    const data = localStorage.getItem('hausmade_editing_review_data');
    return data ? JSON.parse(data) : null;
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(null);

  const minSwipeDistance = 50;

  // Touch Handlers
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) setActiveIndex(prev => prev + 1);
    if (distance < -minSwipeDistance) setActiveIndex(prev => prev - 1);
  };

  // Mouse Drag Handlers
  const onMouseDown = (e) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    const distance = dragStartX - e.clientX;
    if (distance > minSwipeDistance) {
      setActiveIndex(prev => prev + 1);
      setIsDragging(false);
    } else if (distance < -minSwipeDistance) {
      setActiveIndex(prev => prev - 1);
      setIsDragging(false);
    }
  };

  const onMouseUp = () => setIsDragging(false);
  const onMouseLeave = () => setIsDragging(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1)); // We will modulo this in getCardStyle
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getCardStyle = (idx, len) => {
    if (len === 0) return {};
    let diff = (idx - activeIndex) % len;
    
    if (diff < -Math.floor(len/2)) diff += len;
    if (diff > Math.floor(len/2)) diff -= len;

    let translateX = 0;
    let scale = 1;
    let opacity = 1;
    let zIndex = 30;

    if (diff === 0) {
        translateX = 0;
        scale = 1;
        opacity = 1;
        zIndex = 30;
    } else if (diff === 1) {
        translateX = 85;
        scale = 0.85;
        opacity = 0.5;
        zIndex = 20;
    } else if (diff === -1) {
        translateX = -85;
        scale = 0.85;
        opacity = 0.5;
        zIndex = 20;
    } else if (diff === 2) {
        translateX = 160;
        scale = 0.7;
        opacity = 0.15;
        zIndex = 10;
    } else if (diff === -2) {
        translateX = -160;
        scale = 0.7;
        opacity = 0.15;
        zIndex = 10;
    } else {
        translateX = diff > 0 ? 250 : -250;
        scale = 0.5;
        opacity = 0;
        zIndex = 0;
    }

    return {
        transform: `translateX(${translateX}%) scale(${scale})`,
        opacity,
        zIndex,
        pointerEvents: diff === 0 ? 'auto' : 'none',
        transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
    };
  };

  useEffect(() => {
    async function loadReviews() {
      try {
        const fetched = await getReviews();
        if (fetched && fetched.length > 0) {
          const formatted = fetched.map(r => {
            const rawComment = r.comment || '';
            const cleanComment = (rawComment.startsWith('"') && rawComment.endsWith('"'))
              ? rawComment
              : `"${rawComment}"`;
            return {
              id: r.id || r._id,
              name: r.userName,
              initial: r.userName ? r.userName.charAt(0).toUpperCase() : 'V',
              rating: r.rating,
              verified: 'Verified Buyer',
              comment: cleanComment
            };
          });
          if (formatted.length < 6) {
            const needed = 6 - formatted.length;
            const remaining = staticReviews.slice(formatted.length, formatted.length + needed);
            setReviewsList([...formatted, ...remaining]);
          } else {
            setReviewsList(formatted);
          }
        } else {
          setReviewsList(staticReviews);
        }
      } catch (err) {
        console.error('Failed to load dynamic reviews:', err);
        setReviewsList(staticReviews);
      }
    }
    loadReviews();

    const handleStorageChange = () => {
      setEditingReviewId(localStorage.getItem('hausmade_editing_review_id'));
      const data = localStorage.getItem('hausmade_editing_review_data');
      if (data) {
        try {
          setEditingReviewData(JSON.parse(data));
        } catch (e) {
          console.error(e);
        }
      } else {
        setEditingReviewData(null);
      }
    };

    const handleMessage = (event) => {
      if (event.data && event.data.type === 'update-editing-review') {
        setEditingReviewId(event.data.editingReviewId);
        setEditingReviewData(event.data.editingReviewData);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const finalReviews = (() => {
    if (editingReviewId) {
      const matched = reviewsList.find(r => r.id === editingReviewId || r._id === editingReviewId);
      return [{
        id: editingReviewId,
        name: editingReviewData?.name || matched?.name || 'Customer Name',
        initial: (editingReviewData?.name || matched?.name || 'C').charAt(0).toUpperCase(),
        rating: editingReviewData?.rating || matched?.rating || 5,
        verified: 'Verified Buyer',
        comment: `"${editingReviewData?.comment || matched?.comment || ''}"`
      }];
    }
    return reviewsList;
  })();

  return (
    <section id="reviews" className="py-16 lg:py-24 bg-[#F5F1E8] scroll-mt-20 overflow-hidden relative">
      {/* Abstract background blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#8C7A5B]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#C97C5D]/5 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

      <div className="w-full relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16 px-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="h-[1px] w-8 bg-[#3A2E26]/20"></span>
            <span className="text-[#8C7A5B] font-bold text-[10px] sm:text-xs uppercase tracking-widest">{headerBadge}</span>
            <span className="h-[1px] w-8 bg-[#3A2E26]/20"></span>
          </div>
          
          <h2 className="font-serif-brand text-3xl sm:text-4xl lg:text-5xl font-normal text-[#3A2E26] mt-2">
            {headerTitle}
          </h2>

          <div className="flex items-center justify-center gap-2 text-xs text-[#3A2E26]/70 mt-4 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8C7A5B]" />
            <span className="uppercase tracking-wider">{ratingSubtext}</span>
          </div>
        </div>

        {/* Coverflow Container */}
        <div 
          className="relative w-full h-[380px] sm:h-[450px] flex justify-center items-center overflow-hidden max-w-[1400px] mx-auto py-8 cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndHandler}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {finalReviews.map((rev, idx) => {
            const style = getCardStyle(idx, finalReviews.length);
            return (
              <div
                key={rev.id || idx}
                style={style}
                className="absolute w-[85vw] sm:w-[360px] md:w-[420px] h-[300px] sm:h-[340px] rounded-[2rem] p-8 sm:p-10 border shadow-2xl flex flex-col bg-white border-[#3A2E26]/5 shadow-black/5"
              >
                <div className="absolute -top-6 right-4 text-[120px] font-serif-brand leading-none select-none transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 text-[#8C7A5B]/10">"</div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex text-[#FBBF24] mb-5">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current drop-shadow-sm" />
                    ))}
                  </div>

                  <p className="text-base sm:text-lg font-serif-brand italic leading-relaxed mb-6 line-clamp-4 text-[#3A2E26]/90">
                    {rev.comment}
                  </p>
                  
                  {/* Author Footer */}
                  <div className="flex items-center gap-4 mt-auto">
                    <div className="w-12 h-12 rounded-full font-serif-brand font-bold text-lg flex items-center justify-center shrink-0 bg-[#8C7A5B]/10 text-[#8C7A5B]">
                      {rev.initial}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-snug tracking-wide text-[#3A2E26]">
                        {rev.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1 text-[#3A2E26]/50">
                          <ShieldCheck className="w-3 h-3" />
                          {rev.verified}
                        </span>
                      </div>
                    </div>
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
