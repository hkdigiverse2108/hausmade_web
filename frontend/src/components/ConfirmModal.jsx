import React from 'react';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning' // 'danger' | 'warning' | 'info'
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-7 h-7 text-[#B85C4B]" />;
      case 'info':
        return <Info className="w-7 h-7 text-[#7A8B6F]" />;
      case 'warning':
      default:
        return <AlertTriangle className="w-7 h-7 text-[#C97C5D]" />;
    }
  };

  const getConfirmButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-[#B85C4B] hover:bg-[#A34E3F] text-white shadow-[#B85C4B]/20 focus:ring-[#B85C4B]/30';
      case 'info':
        return 'bg-[#7A8B6F] hover:bg-[#68785E] text-white shadow-[#7A8B6F]/20 focus:ring-[#7A8B6F]/30';
      case 'warning':
      default:
        return 'bg-[#C97C5D] hover:bg-[#B56B4D] text-white shadow-[#C97C5D]/20 focus:ring-[#C97C5D]/30';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Premium Backdrop Overlay */}
      <div 
        className="absolute inset-0 bg-[#1e1c18]/60 backdrop-blur-[4px] transition-opacity duration-300"
        onClick={onCancel}
      />
      
      {/* Modal Container */}
      <div className="relative bg-[#FDFBF7] rounded-[24px] shadow-[0_25px_60px_-15px_rgba(58,46,38,0.25)] border border-[#E6D5C3] max-w-md w-full overflow-hidden transform transition-all duration-300 scale-100 flex flex-col p-7 animate-in fade-in zoom-in-95">
        
        {/* Top Decorative Brand Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#C97C5D] via-[#E6D5C3] to-[#C97C5D] absolute top-0 left-0" />
        
        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-5 right-5 text-[#3A2E26]/40 hover:text-[#3A2E26] hover:bg-[#F5EFE6] transition-all p-1.5 rounded-full focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header/Icon Section */}
        <div className="flex items-start gap-4 mt-3">
          <div className="p-3 bg-[#F5EFE6] rounded-[16px] border border-[#E6D5C3]/40 shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-[#3A2E26] tracking-tight font-serif">
              {title}
            </h3>
            <p className="text-[#5C4F46] text-sm mt-2 leading-relaxed font-sans font-medium">
              {message}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-7">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-[#3A2E26]/80 hover:text-[#3A2E26] hover:bg-[#F5EFE6] border border-[#E6D5C3] font-bold text-xs uppercase tracking-wider rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3A2E26]/10"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-6 py-2.5 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all duration-200 transform hover:-translate-y-[1px] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#FDFBF7] ${getConfirmButtonStyles()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
