import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, CreditCard, Truck, Smartphone, Banknote, ArrowRight, Sparkles } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, cartItems, onOrderComplete }) {
  const [step, setStep] = useState('shipping'); // 'shipping', 'payment', 'success'
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'cod', 'card'
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    state: 'Gujarat'
  });

  if (!isOpen) return null;

  const rawSubtotal = cartItems.reduce((acc, item) => acc + parseFloat(item.totalPrice), 0);
  const discountAmount = (rawSubtotal * discount).toFixed(2);
  const shippingFee = rawSubtotal >= 35 || rawSubtotal === 0 ? 0 : 4.99;
  const grandTotal = (rawSubtotal - parseFloat(discountAmount) + shippingFee).toFixed(2);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (coupon.toUpperCase() === 'HAUS10') {
      setDiscount(0.10);
      setCouponApplied(true);
    } else {
      alert('Invalid coupon code. Try HAUS10!');
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address || !formData.pincode) {
      alert('Please fill in all required shipping fields.');
      return;
    }
    setStep('payment');
  };

  const handlePlaceOrder = () => {
    const generatedId = 'HM-' + Math.floor(100000 + Math.random() * 900000);
    setOrderId(generatedId);
    setStep('success');
    if (onOrderComplete) onOrderComplete();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#3A2E26]/10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#F5F1E8] p-5 border-b border-[#3A2E26]/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif-brand font-bold text-xl text-[#3A2E26]">Hausmade™ Checkout</span>
            <span className="bg-[#C97C5D] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Secure SSL</span>
          </div>
          <button onClick={onClose} className="p-2 text-[#3A2E26]/60 hover:text-[#3A2E26] rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Progress Indicator */}
          {step !== 'success' && (
            <div className="flex items-center justify-center gap-4 text-xs font-semibold pb-4 border-b border-gray-100">
              <span className={`flex items-center gap-1 ${step === 'shipping' ? 'text-[#C97C5D] font-bold' : 'text-gray-400'}`}>
                <Truck className="w-4 h-4" /> 1. Shipping Address
              </span>
              <span className="text-gray-300">•</span>
              <span className={`flex items-center gap-1 ${step === 'payment' ? 'text-[#C97C5D] font-bold' : 'text-gray-400'}`}>
                <CreditCard className="w-4 h-4" /> 2. Payment Method
              </span>
            </div>
          )}

          {/* STEP 1: SHIPPING */}
          {step === 'shipping' && (
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              <h4 className="font-serif-brand font-bold text-lg text-[#3A2E26]">Customer & Shipping Information</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3A2E26] mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="e.g. Priyanshu Sharma"
                    value={formData.fullName}
                    onChange={handleFormChange}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C97C5D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3A2E26] mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C97C5D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A2E26] mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  name="email"
                  placeholder="For order updates & tracking..."
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C97C5D]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3A2E26] mb-1">Flat / House No. / Street Address *</label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="House number, street name, locality..."
                  value={formData.address}
                  onChange={handleFormChange}
                  className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C97C5D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3A2E26] mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    placeholder="Surat / Mumbai / Delhi"
                    value={formData.city}
                    onChange={handleFormChange}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C97C5D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#3A2E26] mb-1">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    placeholder="395010"
                    value={formData.pincode}
                    onChange={handleFormChange}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C97C5D]"
                  />
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="bg-[#F5F1E8] p-4 rounded-2xl space-y-2 text-sm text-[#3A2E26]">
                <div className="flex justify-between">
                  <span>Items ({cartItems.length}):</span>
                  <span className="font-bold">${rawSubtotal.toFixed(2)}</span>
                </div>
                
                {/* Coupon Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Promo code (HAUS10)"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border text-xs uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-[#3A2E26] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-black"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-xs text-[#7A8B6F] font-bold">✓ Promo HAUS10 applied! Saved ${discountAmount}</p>
                )}

                <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-300">
                  <span>Total Amount:</span>
                  <span className="text-[#C97C5D]">${grandTotal}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#C97C5D] hover:bg-[#b36c4f] text-white font-bold rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2 text-base"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* STEP 2: PAYMENT */}
          {step === 'payment' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h4 className="font-serif-brand font-bold text-lg text-[#3A2E26]">Select Payment Option</h4>
                <button onClick={() => setStep('shipping')} className="text-xs text-[#7A8B6F] font-bold hover:underline">
                  ← Edit Shipping
                </button>
              </div>

              <div className="space-y-3">
                <label className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-[#C97C5D] bg-[#C97C5D]/10' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-[#C97C5D]" />
                    <div>
                      <p className="font-bold text-sm text-[#3A2E26]">UPI Instant (GPay / PhonePe / Paytm / BHIM)</p>
                      <p className="text-xs text-gray-500">Instant verification & faster dispatch</p>
                    </div>
                  </div>
                  <input type="radio" name="pay" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                </label>

                <label className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-[#C97C5D] bg-[#C97C5D]/10' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <Banknote className="w-5 h-5 text-[#7A8B6F]" />
                    <div>
                      <p className="font-bold text-sm text-[#3A2E26]">Cash On Delivery (COD)</p>
                      <p className="text-xs text-gray-500">Pay cash when package arrives at your doorstep</p>
                    </div>
                  </div>
                  <input type="radio" name="pay" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                </label>

                <label className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-[#C97C5D] bg-[#C97C5D]/10' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-bold text-sm text-[#3A2E26]">Credit / Debit Card / Net Banking</p>
                      <p className="text-xs text-gray-500">Visa, Mastercard, RuPay, Maestro</p>
                    </div>
                  </div>
                  <input type="radio" name="pay" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                </label>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                <p className="font-bold text-gray-700">Shipping To:</p>
                <p className="text-gray-600">{formData.fullName} ({formData.phone})</p>
                <p className="text-gray-600">{formData.address}, {formData.city} - {formData.pincode}</p>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                className="w-full py-4 bg-[#7A8B6F] hover:bg-[#68775E] text-white font-bold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 text-base"
              >
                <span>Complete & Place Order (${grandTotal})</span>
                <ShieldCheck className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 3: SUCCESS / CONFIRMATION */}
          {step === 'success' && (
            <div className="text-center py-8 space-y-5 animate-fadeIn">
              <div className="w-20 h-20 bg-[#7A8B6F]/20 text-[#7A8B6F] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-widest text-[#C97C5D]">Order Confirmed!</span>
                <h3 className="font-serif-brand text-3xl font-bold text-[#3A2E26]">Thank You, {formData.fullName.split(' ')[0]}!</h3>
                <p className="text-sm text-gray-600">Your Hausmade™ Kesar Soap order has been placed successfully.</p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F5F1E8] border border-[#3A2E26]/10 max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between font-bold text-sm border-b pb-2">
                  <span>Order ID:</span>
                  <span className="text-[#C97C5D]">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Delivery:</span>
                  <span className="font-bold text-[#7A8B6F]">3-5 Business Days</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-bold uppercase">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Paid:</span>
                  <span className="font-bold">${grandTotal}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">A confirmation SMS & email has been sent to {formData.phone || 'your mobile'}.</p>

              <button
                onClick={onClose}
                className="px-8 py-3.5 bg-[#3A2E26] text-white font-bold text-sm rounded-full hover:bg-black transition-colors shadow-md"
              >
                Continue Browsing
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
