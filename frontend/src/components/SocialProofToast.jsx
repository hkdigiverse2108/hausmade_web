import React, { useState, useEffect } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { getRecentOrders } from '../utils/api';

export default function SocialProofToast() {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);
  const [realOrders, setRealOrders] = useState([]);



  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '1 minute ago';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins === 1) return '1 minute ago';
    if (mins < 60) return `${mins} minutes ago`;
    const hours = Math.floor(mins / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    return '1 day ago';
  };

  useEffect(() => {
    async function loadRecentOrders() {
      try {
        const data = await getRecentOrders();
        if (data && data.length > 0) {
          setRealOrders(data);
        }
      } catch (err) {
        console.error("Failed to load real-time social proof orders:", err);
      }
    }
    loadRecentOrders();
    // Poll for new orders every 60 seconds
    const pollInterval = setInterval(loadRecentOrders, 60000);
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    // Show first toast after 4 seconds
    const timer1 = setTimeout(() => {
      showRandomToast();
    }, 4000);

    // Show recurring toast every 22 seconds
    const interval = setInterval(() => {
      showRandomToast();
    }, 22000);

    return () => {
      clearTimeout(timer1);
      clearInterval(interval);
    };
  }, [realOrders]);

  const showRandomToast = () => {
    if (realOrders.length > 0) {
      const randomOrder = realOrders[Math.floor(Math.random() * realOrders.length)];
      setToast({
        name: randomOrder.name,
        city: randomOrder.city,
        pack: randomOrder.pack,
        time: getRelativeTime(randomOrder.created_at)
      });
      setVisible(true);
      setTimeout(() => setVisible(false), 5000);
    }
  };

  if (!visible || !toast) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:bottom-24 sm:left-6 sm:right-auto z-50 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-[#3A2E26]/15 shadow-2xl max-w-md sm:max-w-xs flex items-center gap-3 animate-fadeIn sm:animate-slideRight">
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#C97C5D]/15 text-[#C97C5D] flex items-center justify-center shrink-0">
        <ShoppingBag className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-bold text-[#3A2E26] truncate">
          {toast.name} from {toast.city}
        </p>
        <p className="text-[11px] text-[#7A8B6F] font-semibold truncate">
          Purchased {toast.pack}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">{toast.time} • Verified Order</p>
      </div>

      <button onClick={() => setVisible(false)} className="text-gray-400 hover:text-gray-600 self-start">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
