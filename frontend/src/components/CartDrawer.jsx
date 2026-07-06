import React from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onOpenCheckout, onStartShopping }) {

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.totalPrice)), 0).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fadeIn" 
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-[100vw] sm:max-w-md bg-[#F5F1E8] shadow-2xl flex flex-col justify-between border-l border-[#3A2E26]/10 animate-slideLeft">
          
          {/* Header */}
          <div className="p-6 bg-white border-b border-[#3A2E26]/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[#7A8B6F]" />
              <h3 className="font-serif-brand font-bold text-xl text-[#3A2E26]">Your Cart</h3>
              <span className="bg-[#7A8B6F]/15 text-[#7A8B6F] text-xs font-bold px-2.5 py-0.5 rounded-full">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[#3A2E26]/60 hover:text-[#3A2E26] rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-[#7A8B6F]/10 text-[#7A8B6F] rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="font-serif-brand font-bold text-xl text-[#3A2E26]">Your cart is empty</p>
                <p className="text-sm text-[#3A2E26]/70">Explore our handcrafted soaps and pick your batch.</p>
                <button
                  onClick={onStartShopping}
                  className="mt-4 px-6 py-3 bg-[#7A8B6F] text-white text-sm font-semibold rounded-full hover:bg-[#68775E] transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <div key={index} className="bg-white p-4 rounded-2xl border border-[#3A2E26]/10 shadow-sm flex gap-4 items-center">
                  <img src={item.image} alt={item.title} className="w-20 h-20 rounded-xl object-cover border" />
                  <div className="flex-1">
                    <h4 className="font-serif-brand font-bold text-base text-[#3A2E26]">{item.title}</h4>
                    <p className="text-xs text-[#7A8B6F] font-semibold mt-0.5">
                      {item.isSubscription ? `Subscribed (${item.frequency})` : 'One-Time Purchase'}
                    </p>
                    <p className="text-xs text-[#3A2E26]/60">₹{item.unitPrice} / bar</p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[#3A2E26]/20 rounded-lg bg-[#F5F1E8]">
                        <button
                          onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                          className="px-2 py-0.5 text-xs font-bold text-[#3A2E26]"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-[#3A2E26]">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                          className="px-2 py-0.5 text-xs font-bold text-[#3A2E26]"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-[#3A2E26] text-sm">₹{item.totalPrice}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="p-2 text-red-400 hover:text-red-600 self-start"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cartItems.length > 0 && (
            <div className="p-6 bg-white border-t border-[#3A2E26]/10 space-y-4">
              <div className="space-y-2 text-sm text-[#3A2E26]">
                <div className="flex justify-between">
                  <span className="text-[#3A2E26]/70">Subtotal</span>
                  <span className="font-bold">₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3A2E26]/70">Shipping</span>
                  <span className="font-bold text-[#7A8B6F]">
                    {parseFloat(subtotal) >= 499 ? 'FREE' : '₹49'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenCheckout) onOpenCheckout();
                }}
                className="w-full py-4 bg-[#7A8B6F] hover:bg-[#68775E] text-white font-bold rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2 text-base"
              >

                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-[#3A2E26]/60 pt-1">
                <ShieldCheck className="w-4 h-4 text-[#7A8B6F]" />
                <span>256-bit Encrypted SSL Checkout</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
