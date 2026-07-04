import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, ArrowRight, ShieldCheck, Check, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { registerUser, loginUser, sendOtp, verifyOtp } from '../utils/api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, showNotification }) {
  const { loginWithRedirect } = useAuth0();

  const handleGoogleLogin = () => {
    const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN || '';
    if (auth0Domain.includes('dev-your-domain') || !auth0Domain) {
      // Simulate Google login for local offline testing
      const mockUser = {
        name: 'Google User (Mock)',
        email: 'google.mock@example.com',
        mobile: '1234567890'
      };
      localStorage.setItem('hausmade_token', 'mock_google_jwt_token');
      localStorage.setItem('hausmade_user', JSON.stringify(mockUser));
      
      if (showNotification) {
        showNotification('Mock Google Login Successful (Offline Development Mode)', 'success');
      }
      if (onLoginSuccess) {
        onLoginSuccess(mockUser);
      }
      onClose();
    } else {
      // Trigger actual redirect
      loginWithRedirect({ authorizationParams: { connection: 'google-oauth2' } });
    }
  };

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Password Validation Criteria
  const passwordCriteria = {
    length: password.length >= 8,
    hasUpperLower: /[A-Z]/.test(password) && /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  };

  const getPasswordStrength = () => {
    let score = 0;
    if (passwordCriteria.length) score++;
    if (passwordCriteria.hasUpperLower) score++;
    if (passwordCriteria.hasNumber) score++;
    if (passwordCriteria.hasSpecial) score++;
    return score;
  };

  const strengthScore = getPasswordStrength();

  const getStrengthProgressStyle = () => {
    switch (strengthScore) {
      case 1:
        return { width: '25%', backgroundColor: '#EF4444', label: 'Weak' }; // Red
      case 2:
        return { width: '50%', backgroundColor: '#F97316', label: 'Fair' }; // Orange
      case 3:
        return { width: '75%', backgroundColor: '#EAB308', label: 'Good' }; // Yellow/Amber
      case 4:
        return { width: '100%', backgroundColor: '#22C55E', label: 'Strong' }; // Green
      default:
        return { width: '0%', backgroundColor: '#E5E7EB', label: 'Very Weak' };
    }
  };

  const strengthDetails = getStrengthProgressStyle();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!mobile) {
      setError('Please enter your mobile number first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendOtp(mobile);
      setOtpSent(true);
      if (showNotification) {
        showNotification('OTP sent successfully! Check server logs for code.', 'success');
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Additional client-side check for signup password strength
    if (!isLoginTab && strengthScore < 3) {
      setError('Please make sure your password is at least "Good" before registering.');
      setLoading(false);
      return;
    }

    try {
      let data;
      if (isLoginTab) {
        if (loginMethod === 'otp') {
          data = await verifyOtp(mobile, otp);
        } else {
          const identifier = email || mobile;
          if (!identifier) {
            throw new Error('Please enter your Email or Mobile number');
          }
          data = await loginUser(identifier, password);
        }
      } else {
        data = await registerUser(name, email, mobile, password);
      }
      
      localStorage.setItem('hausmade_token', data.token);
      localStorage.setItem('hausmade_user', JSON.stringify(data.user));
      
      if (showNotification) {
        showNotification(isLoginTab ? 'Welcome back! Logged in successfully.' : 'Account created successfully! Welcome to Hausmade™ Club.', 'success');
      }
      
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
      
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F1E8] to-[#EAE3D2] text-[#3A2E26] overflow-y-auto flex flex-col animate-fadeIn font-sans">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#7A8B6F]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#C97C5D]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Nav Bar */}
      <div className="sticky top-0 bg-white/70 backdrop-blur-xl border-b border-[#3A2E26]/10 px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C97C5D] to-[#E09F80] flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-serif-brand text-xl font-bold tracking-tight text-[#3A2E26]">Hausmade™ Account</h1>
            <p className="text-[9px] uppercase tracking-widest text-[#7A8B6F] font-bold">Sign In / Sign Up Gateway</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-[#3A2E26] hover:bg-[#3A2E26]/90 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
        >
          <span>Exit Account Gate</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Centered card container */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center relative z-10">
        <div className="w-full bg-[#FDFBF7] rounded-3xl border border-[#3A2E26]/10 shadow-2xl overflow-hidden text-[#3A2E26] flex flex-col md:flex-row min-h-[520px]">
          
          {/* Left Column - Image Section (Hidden on mobile) */}
          <div className="hidden md:flex md:w-1/2 relative bg-[#3A2E26] text-white flex-col justify-between p-10 overflow-hidden select-none">
            {/* Background Image */}
            <img 
              src="/botanical_soap.png" 
              alt="Handcrafted Botanical Soap" 
              className="absolute inset-0 w-full h-full object-cover opacity-75 hover:scale-105 transition-transform duration-1000"
            />
            {/* Dark Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#3A2E26] via-[#3A2E26]/30 to-transparent" />
            
            <div className="relative z-10">
              <span className="font-serif-brand text-2xl font-bold tracking-tight text-white block">
                Hausmade<span className="text-xs align-top text-[#C97C5D]">™</span>
              </span>
            </div>
            
            <div className="relative z-10 mt-auto">
              <h4 className="font-serif-brand text-2xl font-bold leading-tight mb-2 text-white">
                Botanical Simplicity.
              </h4>
              <p className="text-xs text-white/90 leading-relaxed max-w-sm">
                Pure ingredients, hand-poured and slow-cured for 6 weeks. Access your VIP benefits, subscription discounts, and early releases.
              </p>
            </div>
          </div>

          {/* Right Column - Form Section */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-center overflow-y-auto overflow-x-hidden relative z-10">

            {/* Brand Header */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#C97C5D] text-white shadow-md mb-2 mx-auto">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="font-serif-brand text-xl font-bold tracking-tight text-[#3A2E26]">
                {isLoginTab ? 'Welcome to Hausmade™' : 'Join Botanical'}
              </h3>
              <p className="text-[11px] text-[#3A2E26]/70 mt-0.5 max-w-xs mx-auto">
                {isLoginTab ? 'Sign in to access your orders, subscription & rewards' : 'Unlock 15% subscriber discounts & early releases'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-[#3A2E26]/5 p-1 rounded-2xl mb-4 border border-[#3A2E26]/5">
              <button
                type="button"
                onClick={() => { setIsLoginTab(true); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${isLoginTab ? 'bg-[#3A2E26] text-white shadow-sm' : 'text-[#3A2E26]/60 hover:text-[#3A2E26]'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsLoginTab(false); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${!isLoginTab ? 'bg-[#3A2E26] text-white shadow-sm' : 'text-[#3A2E26]/60 hover:text-[#3A2E26]'}`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {isLoginTab ? (
                /* LOGIN FLOW */
                <>
                  {/* Login Method Toggle */}
                  <div className="flex justify-center gap-4 mb-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => { setLoginMethod('password'); setError(''); }}
                      className={`pb-1 border-b-2 transition-all ${loginMethod === 'password' ? 'border-[#C97C5D] text-[#C97C5D]' : 'border-transparent text-[#3A2E26]/60'}`}
                    >
                      Password Login
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginMethod('otp'); setError(''); }}
                      className={`pb-1 border-b-2 transition-all ${loginMethod === 'otp' ? 'border-[#C97C5D] text-[#C97C5D]' : 'border-transparent text-[#3A2E26]/60'}`}
                    >
                      OTP Login
                    </button>
                  </div>

                  {loginMethod === 'password' ? (
                    /* PASSWORD LOGIN */
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1">
                          Email or Mobile Number
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={email || mobile}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.includes('@') || isNaN(val)) {
                                setEmail(val);
                                setMobile('');
                              } else {
                                setMobile(val);
                                setEmail('');
                              }
                            }}
                            placeholder="name@example.com or 9876543210"
                            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] placeholder:text-[#3A2E26]/40 focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/20 transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password..."
                            className="w-full pl-11 pr-12 py-2.5 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] placeholder:text-[#3A2E26]/40 focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/20 transition-all font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* OTP LOGIN */
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1">
                          Mobile Number
                        </label>
                        <div className="relative flex gap-2">
                          <div className="relative flex-1">
                            <Phone className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="tel"
                              required
                              disabled={otpSent}
                              value={mobile}
                              onChange={(e) => setMobile(e.target.value)}
                              placeholder="10-digit mobile number"
                              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] placeholder:text-[#3A2E26]/40 focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/20 transition-all font-medium disabled:opacity-60"
                            />
                          </div>
                          {!otpSent && (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={mobile.length !== 10 || loading}
                              className="px-4 py-2.5 bg-[#3A2E26] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-2xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                            >
                              Send OTP
                            </button>
                          )}
                        </div>
                      </div>

                      {otpSent && (
                        <div className="animate-fadeIn">
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[11px] font-bold text-[#3A2E26] uppercase tracking-widest">
                              Enter 6-Digit OTP
                            </label>
                            <button
                              type="button"
                              onClick={() => { setOtpSent(false); setOtp(''); }}
                              className="text-[10px] text-[#C97C5D] hover:underline font-bold"
                            >
                              Change Number
                            </button>
                          </div>
                          <div className="relative">
                            <ShieldCheck className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              required
                              maxLength={6}
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                              placeholder="e.g. 123456"
                              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] placeholder:text-[#3A2E26]/40 focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/20 transition-all font-medium tracking-widest text-center"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                /* REGISTRATION FLOW */
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] placeholder:text-[#3A2E26]/40 focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1">
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
                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] placeholder:text-[#3A2E26]/40 focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] placeholder:text-[#3A2E26]/40 focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Choose a strong password..."
                        className="w-full pl-11 pr-12 py-2.5 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] placeholder:text-[#3A2E26]/40 focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/20 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <div className="space-y-1.5 pt-1.5 animate-fadeIn">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#3A2E26]/70">
                        <span>Password Strength:</span>
                        <span style={{ color: getStrengthProgressStyle().backgroundColor }}>
                          {getStrengthProgressStyle().label}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-300"
                          style={{ 
                            width: getStrengthProgressStyle().width, 
                            backgroundColor: getStrengthProgressStyle().backgroundColor 
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-bold text-[#3A2E26]/50">
                        <div className="flex items-center gap-1">
                          <Check className={`w-3.5 h-3.5 ${passwordCriteria.length ? 'text-[#7A8B6F]' : 'text-gray-300'}`} />
                          <span>At least 8 characters</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className={`w-3.5 h-3.5 ${passwordCriteria.hasUpperLower ? 'text-[#7A8B6F]' : 'text-gray-300'}`} />
                          <span>Upper & Lowercase letters</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className={`w-3.5 h-3.5 ${passwordCriteria.hasNumber ? 'text-[#7A8B6F]' : 'text-gray-300'}`} />
                          <span>At least one number</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className={`w-3.5 h-3.5 ${passwordCriteria.hasSpecial ? 'text-[#7A8B6F]' : 'text-gray-300'}`} />
                          <span>One special character</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 animate-fadeIn">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (loginMethod === 'otp' && otpSent && otp.length !== 6)}
                className="w-full py-3 mt-4 bg-[#3A2E26] hover:bg-black text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{isLoginTab ? (loginMethod === 'otp' && !otpSent ? 'Get OTP Code' : 'Sign In') : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Separator */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#3A2E26]/10" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
                <span className="bg-[#FDFBF7] px-3.5 text-[#3A2E26]/60">Or Securely Connect</span>
              </div>
            </div>

            {/* Google Social Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 border border-[#3A2E26]/20 hover:bg-[#3A2E26]/5 text-[#3A2E26] font-bold rounded-2xl transition-all text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>


            {/* Security Assurance Footer */}
            <div className="mt-6 pt-4 border-t border-[#3A2E26]/10 text-center flex items-center justify-center gap-1.5 text-[10px] text-[#3A2E26]/50">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7A8B6F]" />
              <span>256-bit SSL Encrypted & Private</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
