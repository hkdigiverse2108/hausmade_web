import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, ArrowRight } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(isLoginTab ? 'Welcome back! Logged in successfully.' : 'Account created successfully! Welcome to Hausmade™.');
    if (onLoginSuccess) onLoginSuccess({ name: name || email.split('@')[0] || 'Member' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-[#F5F1E8] rounded-3xl p-6 sm:p-8 border border-white/80 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Ambient Accents */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#C97C5D]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-[#7A8B6F]/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#3A2E26]/5 hover:bg-[#3A2E26]/10 text-[#3A2E26] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#C97C5D] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-serif-brand text-2xl font-bold text-[#3A2E26]">
            {isLoginTab ? 'Welcome to Hausmade™' : 'Join The Botanical Club'}
          </h3>
          <p className="text-xs sm:text-sm text-[#3A2E26]/70 mt-1">
            {isLoginTab ? 'Log in to manage orders & subscription' : 'Unlock VIP rewards & early access releases'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#3A2E26]/10 p-1 rounded-2xl mb-6">
          <button
            onClick={() => setIsLoginTab(true)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isLoginTab ? 'bg-white text-[#3A2E26] shadow-sm' : 'text-[#3A2E26]/60 hover:text-[#3A2E26]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLoginTab(false)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !isLoginTab ? 'bg-white text-[#3A2E26] shadow-sm' : 'text-[#3A2E26]/60 hover:text-[#3A2E26]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginTab && (
            <div>
              <label className="block text-xs font-bold text-[#3A2E26] uppercase tracking-wider mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#3A2E26]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#3A2E26]/15 text-sm text-[#3A2E26] placeholder:text-[#3A2E26]/40 focus:outline-none focus:border-[#C97C5D]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#3A2E26] uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#3A2E26]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#3A2E26]/15 text-sm text-[#3A2E26] placeholder:text-[#3A2E26]/40 focus:outline-none focus:border-[#C97C5D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3A2E26] uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#3A2E26]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#3A2E26]/15 text-sm text-[#3A2E26] placeholder:text-[#3A2E26]/40 focus:outline-none focus:border-[#C97C5D]"
              />
            </div>
          </div>

          {isLoginTab && (
            <div className="flex justify-end">
              <a href="#" className="text-xs text-[#C97C5D] font-semibold hover:underline">Forgot password?</a>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-[#C97C5D] hover:bg-[#b36c4f] text-white font-bold rounded-2xl shadow-md transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isLoginTab ? 'Sign In to Account' : 'Register Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-[#3A2E26]/60">
            By continuing, you agree to Hausmade's <a href="#" className="underline">Terms</a> & <a href="#" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
