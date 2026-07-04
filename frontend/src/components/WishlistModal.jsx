import React from 'react';
import { X, Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

export default function WishlistModal({ isOpen, onClose, wishlistItems, onRemoveFromWishlist, onAddToCart, onBuyNow }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn" 
        onClick={onClose} 
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F5F1E8] shadow-2xl flex flex-col justify-between border-l border-[#3A2E26]/10 animate-slideLeft text-[#3A2E26]">
          
          {/* Header */}
          <div className="p-6 bg-white border-b border-[#3A2E26]/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Heart className="w-5 h-5 text-[#C97C5D] fill-[#C97C5D]" />
              <h3 className="font-serif-brand font-bold text-xl text-[#3A2E26]">Your Wishlist</h3>
              <span className="bg-[#C97C5D]/15 text-[#C97C5D] text-xs font-bold px-2.5 py-0.5 rounded-full">
                {wishlistItems.length} items
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#3A2E26]/60 hover:text-[#3A2E26] rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Wishlist Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {wishlistItems.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-16 h-16 bg-[#C97C5D]/10 text-[#C97C5D] rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8" />
                </div>
                <p className="font-serif-brand font-bold text-xl text-[#3A2E26]">Your wishlist is empty</p>
                <p className="text-sm text-[#3A2E26]/70">Explore our handcrafted soaps and save your favorites.</p>
                <button
                  onClick={() => {
                    onClose();
                    const el = document.getElementById('product-selector');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-4 px-6 py-3 bg-[#7A8B6F] hover:bg-[#68775E] text-white text-sm font-semibold rounded-full transition-colors cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              wishlistItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white p-4 rounded-2xl border border-[#3A2E26]/10 shadow-sm flex gap-4 items-center relative group"
                >
                  {/* Item Image */}
                  <img 
                    src={item.image || '/images/pack-3.png'} 
                    alt={item.title} 
                    className="w-16 h-16 rounded-xl object-cover border border-[#3A2E26]/10 shrink-0 bg-white" 
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif-brand font-bold text-base text-[#3A2E26] truncate">{item.title}</h4>
                    <p className="text-xs text-[#7A8B6F] font-semibold mt-0.5">
                      ₹{item.basePrice.toFixed(2)}
                    </p>
                    
                    {/* Action Links */}
                    <div className="flex items-center gap-3.5 mt-2.5">
                      <button
                        onClick={() => {
                          onAddToCart({
                            packId: item.id,
                            title: item.title,
                            count: item.count,
                            isSubscription: false,
                            frequency: null,
                            unitPrice: (item.basePrice / item.count).toFixed(2),
                            packPrice: item.basePrice.toFixed(2),
                            quantity: 1,
                            totalPrice: item.basePrice.toFixed(2),
                            image: item.image
                          });
                          onClose();
                        }}
                        className="text-[10px] font-extrabold uppercase tracking-widest text-[#7A8B6F] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Add to Cart</span>
                      </button>
                      <button
                        onClick={() => {
                          onBuyNow({
                            packId: item.id,
                            title: item.title,
                            count: item.count,
                            isSubscription: false,
                            frequency: null,
                            unitPrice: (item.basePrice / item.count).toFixed(2),
                            packPrice: item.basePrice.toFixed(2),
                            quantity: 1,
                            totalPrice: item.basePrice.toFixed(2),
                            image: item.image
                          });
                          onClose();
                        }}
                        className="text-[10px] font-extrabold uppercase tracking-widest text-[#C97C5D] hover:underline cursor-pointer"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveFromWishlist(item)}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-all cursor-pointer absolute top-3 right-3"
                    title="Remove from Wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
