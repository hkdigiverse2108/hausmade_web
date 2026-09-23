import React, { useState, useEffect } from 'react';
import { Search, Package, MapPin, Truck, CheckCircle2, ChevronRight, AlertCircle, Calendar, XCircle, Loader2, ShoppingBag, X } from 'lucide-react';
import { trackOrderShipment, cancelGuestOrder } from '../utils/api';

export default function OrderTracking() {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelEmailOrPhone, setCancelEmailOrPhone] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id') || params.get('awb');
    if (id) {
      setTrackingId(id);
      fetchTrackingInfo(id);
    }
  }, []);

  const fetchTrackingInfo = async (idToQuery) => {
    const targetId = idToQuery || trackingId;
    if (!targetId.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await trackOrderShipment(targetId.trim());
      setTrackingData(data);
    } catch (err) {
      setError(err.message || 'Tracking details not found. Please verify your Order ID or Waybill number.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTrackingInfo();
  };

  const formatScanTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      let strVal = String(timeStr).trim();
      if (!strVal.endsWith('Z') && !strVal.includes('+') && !strVal.includes('GMT')) {
        strVal = strVal.replace(' ', 'T') + 'Z';
      }
      const d = new Date(strVal);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    } catch (e) {
      return String(timeStr);
    }
  };

  const handleGuestCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelEmailOrPhone.trim()) return;

    setCancelling(true);
    setCancelError(null);

    try {
      const targetOrderId = trackingData?.order_info?.order_id || trackingData?.order_id || trackingId;
      await cancelGuestOrder(targetOrderId, cancelEmailOrPhone.trim());
      setCancelSuccess('Your order has been cancelled successfully.');
      setShowCancelModal(false);
      setCancelEmailOrPhone('');
      fetchTrackingInfo(targetOrderId);
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel order. Please verify your Email/Phone number.');
    } finally {
      setCancelling(false);
    }
  };

  const getMilestoneIndex = (status) => {
    const cleanStatus = status?.toLowerCase() || '';
    if (cleanStatus.includes('delivered')) return 4;
    if (cleanStatus.includes('out for delivery') || cleanStatus.includes('out_for_delivery')) return 3;
    if (cleanStatus.includes('in transit') || cleanStatus.includes('in_transit') || cleanStatus.includes('dispatched') || cleanStatus.includes('transit')) return 2;
    if (cleanStatus.includes('manifested') || cleanStatus.includes('shipped') || cleanStatus.includes('pickup')) return 1;
    return 0;
  };

  const currentMilestone = trackingData ? getMilestoneIndex(trackingData.status_name) : 0;

  const milestones = [
    { label: 'Order Placed', desc: 'Store received your order' },
    { label: 'Packed & Manifested', desc: 'Handed over to Delhivery Express' },
    { label: 'In Transit', desc: 'Package is on the way' },
    { label: 'Out for Delivery', desc: 'Rider is arriving today' },
    { label: 'Delivered', desc: 'Successfully received' }
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3A2E26] pt-32 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-3xl bg-[#7A8B6F]/10 text-[#7A8B6F]">
            <Truck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-serif">Track Your Cleansing Ritual</h1>
          <p className="text-sm text-[#3A2E26]/60 max-w-md mx-auto">
            Enter your Hausmade Order ID or Delhivery Waybill (AWB) number to watch your handmade soap progress to your doorstep.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-3xl border border-[#3A2E26]/10 shadow-sm flex gap-3 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-[#3A2E26]/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Enter Order ID or Delhivery AWB..."
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50/50 rounded-2xl text-sm focus:outline-none focus:bg-white border border-[#3A2E26]/5 focus:border-[#3A2E26] font-semibold transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#3A2E26] hover:bg-[#2A201A] disabled:opacity-50 text-white rounded-2xl text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer border-none flex items-center justify-center gap-2"
          >
            {loading ? 'Fetching Status...' : 'Track Package'}
          </button>
        </form>

        {cancelSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-3xl text-green-800 text-xs font-semibold flex items-center justify-between gap-2.5 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <span>{cancelSuccess}</span>
            </div>
            <button onClick={() => setCancelSuccess(null)} className="text-green-700 hover:text-green-900 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-3xl text-red-700 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {trackingData && (
          <div className="bg-white rounded-3xl border border-[#3A2E26]/10 shadow-sm overflow-hidden animate-fadeIn space-y-6 p-6 sm:p-8">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#3A2E26]/5 pb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A8B6F]">Shipment Status</span>
                <h2 className="text-xl font-extrabold text-[#3A2E26] mt-0.5 flex items-center gap-2">
                  {trackingData.status_name === 'Cancelled' ? (
                    <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-bold uppercase tracking-wider rounded-lg">
                      CANCELLED
                    </span>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#7A8B6F] inline-block animate-pulse"></span>
                      {trackingData.status_name}
                    </>
                  )}
                </h2>
                {trackingData.waybill && (
                  <p className="text-xs text-[#3A2E26]/50 font-mono mt-1">Delhivery AWB: <span className="font-bold">{trackingData.waybill}</span></p>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="bg-[#FDFBF7] border border-[#E6D5C3]/40 p-4 rounded-2xl shrink-0 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#7A8B6F]" />
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-[#3A2E26]/40">Est. Delivery</div>
                    <div className="text-sm font-extrabold text-[#3A2E26]">{trackingData.expected_date}</div>
                  </div>
                </div>

                {trackingData.status_name !== 'Cancelled' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (trackingData?.order_info && !trackingData.order_info.can_cancel) {
                        setError("Order has already been shipped and cannot be cancelled automatically. Please contact customer support for assistance.");
                        return;
                      }
                      setShowCancelModal(true);
                    }}
                    className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold uppercase tracking-wider rounded-2xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Order</span>
                  </button>
                )}
              </div>
            </div>

            {/* Order Items & Address Summary if available */}
            {trackingData.order_info && (
              <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#3A2E26]/5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#3A2E26]/5 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#3A2E26]">
                    <ShoppingBag className="w-4 h-4 text-[#C97C5D]" />
                    <span>Order #{trackingData.order_info.order_id}</span>
                  </div>
                  {trackingData.order_info.grand_total && (
                    <span className="text-sm font-extrabold text-[#3A2E26]">
                      ₹{parseFloat(trackingData.order_info.grand_total).toFixed(2)}
                    </span>
                  )}
                </div>

                {trackingData.order_info.cart_items?.length > 0 && (
                  <div className="space-y-2">
                    {trackingData.order_info.cart_items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs font-semibold text-[#3A2E26]/80">
                        {item.image && (
                          <img src={item.image} alt={item.title} className="w-8 h-8 object-cover rounded-lg border border-[#3A2E26]/10" />
                        )}
                        <span className="flex-1 truncate">{item.title}</span>
                        <span className="text-[#3A2E26]/50">x{item.quantity}</span>
                        <span className="font-bold text-[#3A2E26]">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {trackingData.status_name !== 'Cancelled' && (
              <div className="py-4">
                <div className="relative flex justify-between items-start w-full">
                  
                  <div className="absolute left-6 right-6 top-5 h-0.5 bg-gray-100 -z-0" />
                  <div 
                    className="absolute left-6 top-5 h-0.5 bg-[#7A8B6F] transition-all duration-700 -z-0"
                    style={{ width: `${(currentMilestone / 4) * 85}%` }}
                  />

                  {milestones.map((m, idx) => {
                    const isDone = idx <= currentMilestone;
                    const isActive = idx === currentMilestone;
                    return (
                      <div key={idx} className="flex flex-col items-center text-center relative z-10 w-1/5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isDone 
                            ? 'bg-[#7A8B6F] text-white shadow-md' 
                            : 'bg-white text-gray-300 border-2 border-gray-100'
                        }`}>
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider mt-3 block ${
                          isDone ? 'text-[#3A2E26]' : 'text-gray-300'
                        } ${isActive ? 'font-extrabold text-[#7A8B6F]' : ''}`}>
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t border-[#3A2E26]/5 pt-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#3A2E26]/50">Package Journey Logs</h3>
              <div className="relative pl-6 space-y-6">
                
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-100" />

                {trackingData.scans?.map((scan, idx) => (
                  <div key={idx} className="relative flex gap-4 text-xs font-medium items-start">
                    
                    <div className="absolute -left-[20.5px] w-2.5 h-2.5 rounded-full bg-[#7A8B6F] border-2 border-white shadow-sm mt-1" />

                    <div className="flex-1">
                      <div className="font-bold text-[#3A2E26]">{scan.activity}</div>
                      <div className="text-[10px] text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#C97C5D]" />
                        <span>{scan.location || 'In Transit'}</span>
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-gray-400 font-mono self-start mt-0.5">
                      {formatScanTime(scan.time)}
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Guest Order Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#3A2E26]/10 shadow-2xl max-w-md w-full p-6 space-y-5 relative">
            <button 
              onClick={() => { setShowCancelModal(false); setCancelError(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex p-2.5 rounded-2xl bg-red-50 text-red-600 mb-1">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-[#3A2E26] font-serif">Cancel Order #{trackingData?.order_info?.order_id || trackingData?.order_id}</h3>
              <p className="text-xs text-[#3A2E26]/60">
                To confirm cancellation of your order, please enter your registered Email ID or Mobile Number.
              </p>
            </div>

            {cancelError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <form onSubmit={handleGuestCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1">
                  Registered Email ID or Phone Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. name@example.com or 9876543210"
                  value={cancelEmailOrPhone}
                  onChange={(e) => setCancelEmailOrPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/50 rounded-2xl text-xs font-semibold border border-[#3A2E26]/10 focus:outline-none focus:border-[#3A2E26] transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCancelModal(false); setCancelError(null); }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-[#3A2E26] rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    <span>Confirm Cancel</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

