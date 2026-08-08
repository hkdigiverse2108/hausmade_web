import React from 'react';

export default function InstagramFeed({ settings }) {
  const feed = settings?.instagram_feed;
  if (!feed) return null;

  return (
    <section className="bg-[#FDFBF7] py-16 md:py-24 border-t border-[#3A2E26]/5">
      <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-[1px] w-12 bg-[#3A2E26]/20"></div>
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#8C7A5B]">
            {feed.username || '@hausmade'}
          </span>
          <div className="h-[1px] w-12 bg-[#3A2E26]/20"></div>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-serif text-[#3A2E26] mb-3">
          {feed.title || 'Follow Us on Instagram'}
        </h2>
        
        <p className="text-[#3A2E26]/60 text-sm md:text-base">
          {feed.subtitle || 'A glimpse into our world'}
        </p>
      </div>

      <div className="max-w-[1300px] mx-auto px-6 md:px-12 lg:px-16">
        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 py-4">
          {feed.posts && feed.posts.length > 0 ? (
            [...feed.posts].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((post, idx) => (
              <a 
                key={idx} 
                href={post.post_url || 'https://instagram.com/'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-none w-[70%] sm:w-[45%] md:w-[30%] lg:w-[calc(16.666%-13.33px)] aspect-square snap-start relative group block overflow-hidden bg-[#FDFBF7]"
              >
              <img 
                src={post.image_url || '/images/pack-single.png'} 
                alt={`Instagram post ${idx + 1}`} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                <svg className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-75 group-hover:scale-100 transform" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
            </a>
          ))
        ) : (
          <div className="w-full text-center py-8 text-[#3A2E26]/50 italic text-sm">
            No Instagram posts available.
          </div>
        )}
      </div>
      </div>
    </section>
  );
}
