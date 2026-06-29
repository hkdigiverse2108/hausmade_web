import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, Sparkles } from 'lucide-react';

export default function SocialProofToast() {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);

  const mockOrders = [
    { name: 'Priya S.', city: 'Mumbai', pack: 'Pack of 3 (Most Popular)', time: '2 minutes ago' },
    { name: 'Rahul M.', city: 'Delhi', pack: 'Pack of 5 (Best Value)', time: '5 minutes ago' },
    { name: 'Ananya R.', city: 'Bangalore', pack: 'Pack of 3', time: '12 minutes ago' },
    { name: 'Vikram K.', city: 'Surat', pack: 'Pack of 2', time: '1 minute ago' },
    { name: 'Sneha P.', city: 'Pune', pack: 'Single Soap Bar', time: '8 minutes ago' },
  ];

  useEffect(() => {
    // Show first toast after 4 seconds
    const timer1 = setTimeout(() => {
      showRandomToast();
    }, 4000);

    // Show recurring toast every 20 seconds
    const interval = setInterval(() => {
      showRandomToast();
    }, 22000);

    return () => {
      clearTimeout(timer1);
      clearInterval(interval);
    };
  }, []);

  const showRandomToast = () => {
    const randomOrder = mockOrders[Math.floor(Math.random() * mockOrders.length)];
    setToast(randomOrder);
    setVisible(true);
    setTimeout(() => setVisible(false), 5000);
  };

  if (!visible || !toast) return null;

  return (
    <div className="fixed bottom-20 left-4 z-40 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#3A2E26]/15 shadow-2xl max-w-xs flex items-center gap-3 animate-slideRight">
      <div className="w-10 h-10 rounded-xl bg-[#C97C5D]/15 text-[#C97C5D] flex items-center justify-center shrink-0">
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
