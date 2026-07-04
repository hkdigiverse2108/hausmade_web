import React, { useState, useEffect } from 'react';
import { X, Calendar, Hash, Package, MapPin, CreditCard, ShoppingBag, Loader2, Sparkles } from 'lucide-react';
import { getUserOrders } from '../utils/api';

export default function OrderHistoryModal({ isOpen, onClose, token, onWriteReview }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && token) {
      fetchOrders();
    }
  }, [isOpen, token]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUserOrders(token);
      // Sort orders by date descending
      const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(sorted);
    } catch (err) {
      setError(err.message || 'Failed to fetch order history');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    delivered: 'bg-green-50 text-green-700 border-green-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 w-full h-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F1E8] to-[#EAE3D2] text-[#3A2E26] overflow-y-auto flex flex-col animate-fadeIn font-sans">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#7A8B6F]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#C97C5D]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Nav Bar */}
      <div className="sticky top-0 bg-white/70 backdrop-blur-xl border-b border-[#3A2E26]/10 px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7A8B6F] to-[#8FA283] flex items-center justify-center text-white shadow-md">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif-brand text-xl font-bold tracking-tight text-[#3A2E26]">Hausmade™ Orders</h1>
            <p className="text-[9px] uppercase tracking-widest text-[#7A8B6F] font-bold">Your personal botanical purchase registry</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-[#3A2E26] hover:bg-[#3A2E26]/90 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
        >
          <span>Exit History</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#3A2E26]/60">
            <Loader2 className="w-10 h-10 animate-spin text-[#7A8B6F] mb-3" />
            <p className="text-sm font-semibold">Retrieving your order ledger...</p>
          </div>
        ) : error ? (
          <div className="p-5 text-sm font-semibold text-red-800 bg-red-50 border border-red-200 rounded-2xl text-center shadow-xs">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[#3A2E26]/15 rounded-3xl bg-[#FDFBF7]/80 backdrop-blur-md p-8">
            <Package className="w-16 h-16 text-[#3A2E26]/30 mb-4" />
            <p className="text-lg font-bold text-[#3A2E26]">No orders recorded</p>
            <p className="text-xs text-[#3A2E26]/50 mt-1.5 max-w-sm">
              You haven't placed any botanical orders yet. Select a product pack on the store home page to get started.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-3 bg-[#7A8B6F] hover:bg-[#68775E] text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border-b border-[#3A2E26]/10 pb-4">
              <h2 className="font-serif-brand text-2xl font-bold tracking-tight text-[#3A2E26]">Order History Ledger</h2>
              <p className="text-xs text-[#3A2E26]/60 mt-0.5">Showing {orders.length} placed orders</p>
            </div>

            {orders.map((order) => (
              <div 
                key={order.orderId || order._id} 
                className="bg-[#FDFBF7] rounded-3xl p-6 border border-[#3A2E26]/10 shadow-xs hover:shadow-sm transition-all"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#3A2E26]/5 pb-4 mb-4">
                  <div className="flex items-center gap-3.5">
                    <span className="text-xs font-extrabold text-[#C97C5D] bg-[#C97C5D]/10 px-3 py-1 rounded-xl tracking-wider">
                      {order.orderId}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-[#3A2E26]/60 font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${statusColors[order.status?.toLowerCase()] || 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {order.status || 'processing'}
                    </span>
                    <span className="text-xs font-bold text-[#7A8B6F] bg-[#7A8B6F]/10 px-2.5 py-1 rounded-lg">
                      {order.paymentMethod.toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-[#3A2E26]">
                      ₹{order.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items & Shipping Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Items List */}
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="text-[10px] font-bold text-[#3A2E26]/50 uppercase tracking-widest">
                      Products Purchased
                    </h4>
                    <div className="space-y-2.5">
                      {order.cartItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-[#3A2E26]/5 shadow-xs">
                          <img 
                            src={item.image} 
                            alt={item.title} 
                            className="w-12 h-12 object-cover rounded-xl border border-[#3A2E26]/10 bg-[#F5F1E8]"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#3A2E26] truncate">{item.title}</p>
                            <p className="text-[10px] text-[#3A2E26]/60 font-medium mt-0.5">
                              Quantity: {item.quantity} × ₹{item.unitPrice}
                              {item.isSubscription && <span className="ml-2 text-[#7A8B6F] font-bold">(Auto-Refill)</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {order.status?.toLowerCase() === 'delivered' && (
                              <button
                                onClick={() => onWriteReview({ id: item.packId, title: item.title })}
                                className="px-2.5 py-1.5 bg-[#7A8B6F] hover:bg-[#6b7c60] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer"
                              >
                                Write Review
                              </button>
                            )}
                            <span className="text-xs font-bold text-[#3A2E26]">
                              ₹{parseFloat(item.totalPrice).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-[#3A2E26]/50 uppercase tracking-widest">
                      Destination Details
                    </h4>
                    <div className="bg-white p-4 rounded-2xl border border-[#3A2E26]/5 shadow-xs text-xs font-medium space-y-2">
                      <p className="font-bold text-[#3A2E26]">{order.shippingAddress.fullName}</p>
                      <p className="text-[#3A2E26]/75 leading-relaxed flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C97C5D] shrink-0 mt-0.5" />
                        <span>{order.shippingAddress.address}, {order.shippingAddress.city} - {order.shippingAddress.pincode}</span>
                      </p>
                      <p className="text-[#3A2E26]/70 pt-1 border-t border-[#3A2E26]/5">Phone: {order.shippingAddress.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
