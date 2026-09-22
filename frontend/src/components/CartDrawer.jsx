import React from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onOpenCheckout, onStartShopping, settings }) {

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.totalPrice)), 0).toFixed(2);
  const freeThreshold = settings?.shipping?.free_shipping_threshold ?? 499;
  const stdShippingFee = settings?.shipping?.standard_fee ?? 49;

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
                {cartItems.length} items
              </span>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-[#3A2E26] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border border-[#3A2E26]/10">
                  <ShoppingBag className="w-6 h-6 text-[#3A2E26]/30" />
                </div>
                <div>
                  <p className="text-[#3A2E26] font-bold">Your cart is empty</p>
                  <p className="text-[#3A2E26]/60 text-sm mt-1">Looks like you haven't added<br/>any handmade soaps yet.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onStartShopping) onStartShopping();
                  }}
                  className="mt-4 px-6 py-2.5 bg-[#3A2E26] text-white text-xs font-bold uppercase tracking-widest rounded-full transition-transform hover:scale-105"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cartItems.map((item, idx) => (
                <div key={`${item.id || idx}-${idx}`} className="flex gap-4 p-4 bg-white rounded-2xl border border-[#3A2E26]/10 relative group">
                  <button 
                    onClick={() => onRemoveItem(idx)}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-[#3A2E26]/10 rounded-full flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-20 h-20 bg-[#F5F1E8] rounded-xl overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply opacity-90" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="font-bold text-[#3A2E26] text-sm leading-tight">{item.name || item.title}</h4>
                    <p className="text-[#3A2E26]/60 text-xs mt-1">
                      {item.isSubscription ? (
                        <span className="text-[#7A8B6F] font-semibold tracking-wide text-[10px] uppercase">Subscribe & Save (Every {item.deliveryFrequency?.replace('_', ' ') || 'Month'})</span>
                      ) : (
                        `₹${item.price || item.unitPrice || item.packPrice} each`
                      )}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 bg-[#F5F1E8] rounded-lg px-2 py-1">
                        <button 
                          onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center text-[#3A2E26]/70 hover:text-[#3A2E26]"
                        >−</button>
                        <span className="text-xs font-bold text-[#3A2E26] min-w-[12px] text-center">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center text-[#3A2E26]/70 hover:text-[#3A2E26]"
                        >+</button>
                      </div>
                      <span className="font-bold text-[#3A2E26]">₹{item.totalPrice}</span>
                    </div>
                  </div>
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
                    {parseFloat(subtotal) >= freeThreshold ? 'FREE' : `₹${stdShippingFee}`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenCheckout) onOpenCheckout();
                }}
                className="w-full py-4 bg-[#3A2E26] hover:bg-transparent text-white hover:text-[#3A2E26] border border-[#3A2E26] font-bold rounded-none transition-colors flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em]"
              >

                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
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
