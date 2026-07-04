import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, CreditCard, Truck, Smartphone, Banknote, ArrowRight, Sparkles, Loader2, Compass, Navigation } from 'lucide-react';
import { placeOrder, updateUserProfile, validateCoupon } from '../utils/api';

export default function CheckoutModal({ isOpen, onClose, cartItems, onOrderComplete, token, user }) {
  const [step, setStep] = useState('shipping'); // 'shipping', 'payment', 'success'
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'cod', 'card'
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedAddressId, setSelectedAddressId] = useState('custom');
  const [saveToProfile, setSaveToProfile] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    state: 'Gujarat'
  });

  const getAvailableAddresses = () => {
    const list = [];
    if (user) {
      if (user.addresses && user.addresses.length > 0) {
        return user.addresses;
      }
      if (user.address_line1 || user.city) {
        list.push({
          id: 'legacy-profile',
          label: 'Saved Address',
          address_line1: user.address_line1 || '',
          address_line2: user.address_line2 || '',
          city: user.city || '',
          state: user.state || 'Gujarat',
          zip_code: user.zip_code || '',
          country: user.country || 'India',
          is_default: true
        });
      }
    }
    return list;
  };

  const availableAddresses = getAvailableAddresses();

  useEffect(() => {
    if (user) {
      const addrs = getAvailableAddresses();
      if (addrs.length > 0) {
        const defaultAddr = addrs.find(a => a.is_default) || addrs[0];
        setSelectedAddressId(defaultAddr.id);
        setFormData({
          fullName: user.name || '',
          email: user.email || '',
          phone: user.mobile || '',
          address: `${defaultAddr.address_line1}${defaultAddr.address_line2 ? `, ${defaultAddr.address_line2}` : ''}`,
          city: defaultAddr.city || '',
          pincode: defaultAddr.zip_code || '',
          state: defaultAddr.state || 'Gujarat'
        });
      } else {
        setSelectedAddressId('custom');
        setFormData({
          fullName: user.name || '',
          email: user.email || '',
          phone: user.mobile || '',
          address: '',
          city: '',
          pincode: '',
          state: 'Gujarat'
        });
      }
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const rawSubtotal = cartItems.reduce((acc, item) => acc + parseFloat(item.totalPrice), 0);
  const discountAmount = (rawSubtotal * discount).toFixed(2);
  const shippingFee = rawSubtotal >= 499 || rawSubtotal === 0 ? 0 : 49;
  const grandTotal = (rawSubtotal - parseFloat(discountAmount) + shippingFee).toFixed(2);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!coupon.trim()) return;
    try {
      const data = await validateCoupon(coupon.trim());
      setDiscount(data.discount);
      setCouponApplied(true);
    } catch (err) {
      alert(err.message || 'Invalid coupon code.');
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

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');
    const generatedId = 'HM-' + Math.floor(100000 + Math.random() * 900000);

    const orderData = {
      orderId: generatedId,
      shippingAddress: formData,
      cartItems: cartItems.map(item => ({
        packId: item.packId,
        title: item.title,
        count: item.count,
        isSubscription: item.isSubscription,
        frequency: item.frequency || null,
        unitPrice: String(item.unitPrice),
        packPrice: String(item.packPrice),
        quantity: item.quantity,
        totalPrice: String(item.totalPrice),
        image: item.image
      })),
      subtotal: parseFloat(rawSubtotal),
      discountAmount: parseFloat(discountAmount),
      shippingFee: parseFloat(shippingFee),
      grandTotal: parseFloat(grandTotal),
      paymentMethod: paymentMethod
    };

    try {
      // If saving this address to profile
      if (saveToProfile && user) {
        try {
          const newAddr = {
            id: `addr-${Date.now()}`,
            label: 'Shipping Address',
            address_line1: formData.address,
            address_line2: '',
            city: formData.city,
            state: formData.state,
            zip_code: formData.pincode,
            country: 'India',
            is_default: !(user.addresses && user.addresses.length > 0)
          };
          const updatedAddresses = user.addresses ? [...user.addresses, newAddr] : [newAddr];
          const payload = {
            addresses: updatedAddresses
          };
          await updateUserProfile(payload, token);
        } catch (e) {
          console.error("Failed to auto-save address to profile", e);
        }
      }

      await placeOrder(orderData, token);
      setOrderId(generatedId);
      setStep('success');
      if (onOrderComplete) onOrderComplete();
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setFormData({
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.mobile || '',
      address: `${addr.address_line1}${addr.address_line2 ? `, ${addr.address_line2}` : ''}`,
      city: addr.city || '',
      pincode: addr.zip_code || '',
      state: addr.state || 'Gujarat'
    });
  };

  const handleSelectCustomAddress = () => {
    setSelectedAddressId('custom');
    setFormData({
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.mobile || '',
      address: '',
      city: '',
      pincode: '',
      state: 'Gujarat'
    });
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F1E8] to-[#EAE3D2] text-[#3A2E26] overflow-y-auto flex flex-col animate-fadeIn font-sans">
      {/* Background Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#7A8B6F]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#C97C5D]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Nav Bar */}
      <div className="sticky top-0 bg-white/70 backdrop-blur-xl border-b border-[#3A2E26]/10 px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C97C5D] to-[#E09F80] flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-serif-brand text-xl font-bold tracking-tight text-[#3A2E26]">Hausmade™ Checkout</h1>
            <p className="text-[9px] uppercase tracking-widest text-[#7A8B6F] font-bold">Secure SSL Encrypted Checkout Gate</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-[#3A2E26] hover:bg-[#3A2E26]/90 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
        >
          <span>Exit Checkout</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid Container */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8 relative z-10">
        
        {step === 'success' ? (
          /* STEP 3: SUCCESS / CONFIRMATION (Full Center Layout) */
          <div className="w-full max-w-xl mx-auto bg-[#FDFBF7] border border-[#3A2E26]/10 rounded-3xl p-8 shadow-sm text-center space-y-6 self-center my-auto">
            <div className="w-20 h-20 bg-[#7A8B6F]/20 text-[#7A8B6F] rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[#C97C5D]">Order Confirmed!</span>
              <h3 className="font-serif-brand text-3xl font-bold text-[#3A2E26]">Thank You, {formData.fullName.split(' ')[0]}!</h3>
              <p className="text-sm text-gray-600">Your Hausmade™ Kesar Soap order has been placed successfully.</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5F1E8] border border-[#3A2E26]/10 text-left space-y-2 text-xs">
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
                <span className="font-bold text-[#C97C5D]">₹{grandTotal}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500">A confirmation SMS & email has been sent to {formData.phone || 'your mobile'}.</p>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#3A2E26] hover:bg-black text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Left Side: Shipping Address & Payment options */}
            <div className="flex-1 space-y-6">
              
              {/* Progress Indicator */}
              <div className="bg-[#FDFBF7] border border-[#3A2E26]/10 rounded-2xl p-4 flex items-center justify-center gap-6 text-xs font-bold shadow-xs">
                <span className={`flex items-center gap-1.5 ${step === 'shipping' ? 'text-[#C97C5D]' : 'text-gray-400'}`}>
                  <Truck className="w-4 h-4" /> 1. Shipping Address
                </span>
                <span className="text-gray-300">|</span>
                <span className={`flex items-center gap-1.5 ${step === 'payment' ? 'text-[#C97C5D]' : 'text-gray-400'}`}>
                  <CreditCard className="w-4 h-4" /> 2. Payment Option
                </span>
              </div>

              {/* STEP 1: SHIPPING */}
              {step === 'shipping' && (
                <form onSubmit={handleProceedToPayment} className="bg-[#FDFBF7] border border-[#3A2E26]/10 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
                  <h3 className="font-serif-brand text-lg font-bold text-[#3A2E26]">Delivery Address</h3>

                  {/* Saved Address Book Selection */}
                  {availableAddresses && availableAddresses.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <label className="block text-[10px] font-bold text-[#3A2E26]/70 uppercase tracking-widest">
                        Choose Delivery Target:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {availableAddresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectAddress(addr)}
                            className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                              selectedAddressId === addr.id
                                ? 'border-[#7A8B6F] bg-[#7A8B6F]/5'
                                : 'border-[#3A2E26]/10 hover:border-[#3A2E26]/20 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#3A2E26]/5 text-[#3A2E26] rounded">
                                {addr.label}
                              </span>
                              {addr.is_default && (
                                <span className="text-[9px] font-bold uppercase text-[#7A8B6F]">Default</span>
                              )}
                            </div>
                            <p className="text-xs text-[#3A2E26] leading-relaxed line-clamp-2">
                              {addr.address_line1}, {addr.city}
                            </p>
                          </div>
                        ))}
                        
                        <div
                          onClick={handleSelectCustomAddress}
                          className={`p-3 rounded-xl border-2 border-dashed text-left cursor-pointer transition-all flex items-center justify-center min-h-[74px] ${
                            selectedAddressId === 'custom'
                              ? 'border-[#7A8B6F] bg-[#7A8B6F]/5'
                              : 'border-[#3A2E26]/10 hover:border-[#3A2E26]/20 bg-white'
                          }`}
                        >
                          <span className="text-xs font-bold text-[#3A2E26]/70">+ Custom Address</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        placeholder="e.g. John Doe"
                        value={formData.fullName}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1.5">Mobile Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="e.g. 9876543210"
                        value={formData.phone}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1.5">Email Address (Optional)</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="For receipt & shipping updates..."
                      value={formData.email}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1.5">Flat / House No. / Street Address *</label>
                    <input
                      type="text"
                      name="address"
                      required
                      placeholder="Street name, landmark details..."
                      value={formData.address}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1.5">City *</label>
                      <input
                        type="text"
                        name="city"
                        required
                        placeholder="e.g. Surat"
                        value={formData.city}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1.5">Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        required
                        placeholder="e.g. 395007"
                        value={formData.pincode}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all"
                      />
                    </div>
                  </div>

                  {user && (
                    <label className="flex items-center gap-2 pt-1 pb-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveToProfile}
                        onChange={(e) => setSaveToProfile(e.target.checked)}
                        className="rounded text-[#7A8B6F] focus:ring-[#7A8B6F]/40 h-4 w-4 border-[#3A2E26]/20"
                      />
                      <span className="text-xs font-bold text-[#3A2E26]/80">Save this address to my profile address book</span>
                    </label>
                  )}

                  <button
                    type="submit"
                    className="w-full h-12 bg-[#3A2E26] hover:bg-black text-white font-bold text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Continue to Payment Option</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* STEP 2: PAYMENT METHOD */}
              {step === 'payment' && (
                <div className="bg-[#FDFBF7] border border-[#3A2E26]/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-serif-brand text-lg font-bold text-[#3A2E26]">Choose Payment Option</h3>
                    <button
                      type="button"
                      onClick={() => setStep('shipping')}
                      className="text-xs font-bold text-[#C97C5D] hover:underline cursor-pointer"
                    >
                      ← Back to Shipping
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    <label className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-[#C97C5D] bg-[#C97C5D]/5' : 'border-[#3A2E26]/10 bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-[#C97C5D]" />
                        <div>
                          <p className="font-bold text-sm text-[#3A2E26]">UPI Instant Payment (GPay / PhonePe / Paytm)</p>
                          <p className="text-[10px] text-gray-500">Instant verification, prompt dispatch</p>
                        </div>
                      </div>
                      <input type="radio" name="payment" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} className="text-[#C97C5D]" />
                    </label>

                    <label className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-[#7A8B6F] bg-[#7A8B6F]/5' : 'border-[#3A2E26]/10 bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <Banknote className="w-5 h-5 text-[#7A8B6F]" />
                        <div>
                          <p className="font-bold text-sm text-[#3A2E26]">Cash On Delivery (COD)</p>
                          <p className="text-[10px] text-gray-500">Pay cash upon home delivery receipt</p>
                        </div>
                      </div>
                      <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                    </label>

                    <label className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-purple-600 bg-purple-50/30' : 'border-[#3A2E26]/10 bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-bold text-sm text-[#3A2E26]">Credit / Debit Card / Net Banking</p>
                          <p className="text-[10px] text-gray-500">Visa, Mastercard, RuPay, Maestro</p>
                        </div>
                      </div>
                      <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                    </label>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F5F1E8] border border-[#3A2E26]/10 text-xs space-y-1">
                    <p className="font-bold text-[#3A2E26]">Shipping Address Details:</p>
                    <p className="text-[#3A2E26]/80">{formData.fullName} ({formData.phone})</p>
                    <p className="text-[#3A2E26]/80">{formData.address}, {formData.city} - {formData.pincode}</p>
                  </div>

                  {error && (
                    <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl">
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full h-12 bg-[#7A8B6F] hover:bg-[#68775E] text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Order (₹{grandTotal})</span>
                        <ShieldCheck className="w-4.5 h-4.5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Right Side: Order Summary Card */}
            <div className="w-full lg:w-96 shrink-0 space-y-6">
              <div className="bg-[#FDFBF7] border border-[#3A2E26]/10 rounded-3xl p-6 shadow-sm space-y-5 sticky top-24">
                <h3 className="font-serif-brand text-lg font-bold text-[#3A2E26] border-b pb-3">Order Summary</h3>

                {/* Items loop */}
                <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex gap-3 items-center text-xs">
                      <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover border" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-[#3A2E26]">{item.title}</p>
                        <p className="text-gray-500 mt-0.5">Qty: {item.quantity} × ₹{item.packPrice}</p>
                      </div>
                      <span className="font-bold text-[#3A2E26]">₹{item.totalPrice}</span>
                    </div>
                  ))}
                </div>

                {/* Coupon code */}
                <div className="flex gap-2 pt-2 border-t border-[#3A2E26]/10">
                  <input
                    type="text"
                    placeholder="PROMO CODE (HAUS10)"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#3A2E26]/20 text-xs font-semibold uppercase tracking-wider focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-[#3A2E26] hover:bg-black text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-xs text-[#7A8B6F] font-bold">✓ Coupon HAUS10 applied! (10% off)</p>
                )}

                {/* Pricing totals */}
                <div className="space-y-2 pt-3 border-t border-[#3A2E26]/10 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cart Subtotal:</span>
                    <span className="font-semibold">₹{rawSubtotal.toFixed(2)}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-[#C97C5D]">
                      <span>Discount (10%):</span>
                      <span>-₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping Delivery:</span>
                    <span className="font-semibold">{shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm pt-2 border-t border-[#3A2E26]/10 text-[#3A2E26]">
                    <span>Grand Total:</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
