import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(isLoginTab ? 'Welcome back! Logged in successfully.' : 'Account created successfully! Welcome to Hausmade™ Club.');
    if (onLoginSuccess) onLoginSuccess({ name: name || email.split('@')[0] || 'Member' });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-gradient-to-b from-[#2D231C] via-[#241B15] to-[#1C1510] rounded-3xl p-6 sm:p-10 border border-[#C97C5D]/40 shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Ambient Glowing Orbs */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#C97C5D]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-[#7A8B6F]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer border border-white/10 shadow-xs"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#C97C5D] to-[#E8A589] text-white shadow-lg mb-3 mx-auto border border-white/20">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="font-serif-brand text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {isLoginTab ? 'Welcome to Hausmade™' : 'Join Botanical VIP'}
          </h3>
          <p className="text-xs sm:text-sm text-white/70 mt-1.5 font-light max-w-xs mx-auto">
            {isLoginTab ? 'Sign in to access your orders, subscription & rewards' : 'Unlock 15% subscriber discounts & early releases'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 p-1.5 rounded-2xl mb-7 border border-white/10 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsLoginTab(true)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              isLoginTab 
                ? 'bg-gradient-to-r from-[#C97C5D] to-[#D88A6E] text-white shadow-md' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLoginTab(false)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
              !isLoginTab 
                ? 'bg-gradient-to-r from-[#C97C5D] to-[#D88A6E] text-white shadow-md' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4.5">
          {!isLoginTab && (
            <div>
              <label className="block text-[11px] font-bold text-white/80 uppercase tracking-widest mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Arjun Patel"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/30 transition-all font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-white/80 uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/30 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white/80 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/30 transition-all font-medium"
              />
            </div>
          </div>

          {isLoginTab && (
            <div className="flex justify-end pt-0.5">
              <a href="#" className="text-xs text-[#E8A589] font-medium hover:underline">Forgot password?</a>
            </div>
          )}

          <button
            type="submit"
            className="group w-full py-4 px-6 bg-gradient-to-r from-[#C97C5D] via-[#D88A6E] to-[#C97C5D] hover:opacity-95 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
          >
            <span>{isLoginTab ? 'Sign In to Account' : 'Register VIP Account'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Security Assurance Footer */}
        <div className="mt-7 pt-5 border-t border-white/10 text-center flex items-center justify-center gap-1.5 text-[11px] text-white/60">
          <ShieldCheck className="w-3.5 h-3.5 text-[#A3B897]" />
          <span>256-bit SSL Encrypted & Private</span>
        </div>
      </div>
    </div>
  );
}
