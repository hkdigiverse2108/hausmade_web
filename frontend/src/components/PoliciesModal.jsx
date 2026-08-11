import React from 'react';
import { X, ShieldCheck, FileText, Truck, RotateCcw } from 'lucide-react';
import { defaultTerms, defaultPrivacy, defaultShipping, defaultRefund } from '../utils/policyDefaults';

export default function PoliciesModal({ isOpen, onClose, defaultTab = 'terms', settings }) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'refund', label: 'Return & Refund', icon: RotateCcw },
  ];

  const getPolicyContent = () => {
    switch (activeTab) {
      case 'privacy':
        return {
          title: 'Privacy Policy',
          text: settings?.policies_privacy || defaultPrivacy
        };
      case 'shipping':
        return {
          title: 'Shipping & Delivery Policy',
          text: settings?.policies_shipping || defaultShipping
        };
      case 'refund':
        return {
          title: 'Return & Refund Policy',
          text: settings?.policies_refund || defaultRefund
        };
      case 'terms':
      default:
        return {
          title: 'Terms & Conditions',
          text: settings?.policies_terms || defaultTerms
        };
    }
  };

  const { title, text } = getPolicyContent();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1e1c18]/60 backdrop-blur-[4px] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-[#FDFBF7] rounded-[24px] shadow-[0_25px_60px_-15px_rgba(58,46,38,0.25)] border border-[#E6D5C3] max-w-4xl w-full h-[90vh] sm:h-[80vh] overflow-hidden transform transition-all duration-300 scale-100 flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Top Decorative Brand Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#C97C5D] via-[#E6D5C3] to-[#C97C5D] absolute top-0 left-0" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E6D5C3]/40">
          <div className="flex items-center gap-2">
            <span className="font-serif-brand text-2xl font-bold tracking-tight text-[#3A2E26]">
              Store Policies
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#3A2E26]/40 hover:text-[#3A2E26] hover:bg-[#F5EFE6] transition-all p-1.5 rounded-full focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 bg-[#F5EFE6]/50 border-r border-[#E6D5C3]/30 p-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-none font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap md:w-full text-left ${
                    isActive 
                      ? 'bg-[#C97C5D] text-white  shadow-[#C97C5D]/10' 
                      : 'text-[#3A2E26]/75 hover:text-[#3A2E26] hover:bg-[#F5EFE6]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#3A2E26]/60'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Policy Text Container */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto text-[#5C4F46] leading-relaxed font-sans text-sm scrollbar-thin">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#3A2E26] font-serif border-b border-[#E6D5C3]/40 pb-2">{title}</h3>
              <p className="text-xs text-[#5C4F46]/60 -mt-2">Last Updated: July 2026</p>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#5C4F46]">
                {text}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
