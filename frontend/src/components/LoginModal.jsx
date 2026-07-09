import React, { useState, useRef } from 'react';
import { X, Mail, Lock, User, Sparkles, ArrowRight, ShieldCheck, Check, Phone, Eye, EyeOff, Loader2, Key } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { registerUser, loginUser, sendOtp, verifyOtp, socialLogin } from '../utils/api';

// A styled 6-digit OTP input using separate boxes
function OtpBoxes({ value, onChange }) {
  const inputsRef = useRef([]);

  // Create an array of 6 elements for the 6 boxes
  const boxes = Array(6).fill('');

  // Sync value prop to the individual boxes
  const getBoxValue = (index) => {
    return value[index] || '';
  };

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      // If cleared, update parent state
      const newValue = value.slice(0, index) + value.slice(index + 1);
      onChange(newValue);
      return;
    }

    // If multiple characters pasted/entered, distribute them
    const digits = val.split('');
    let newValue = value.split('');
    
    for (let i = 0; i < digits.length; i++) {
      if (index + i < 6) {
        newValue[index + i] = digits[i];
      }
    }
    
    const finalVal = newValue.join('').slice(0, 6);
    onChange(finalVal);

    // Determine where to focus
    const nextIndex = Math.min(index + digits.length, 5);
    if (inputsRef.current[nextIndex]) {
      inputsRef.current[nextIndex].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!getBoxValue(index) && index > 0) {
        // Focus previous input and clear it
        const newValue = value.slice(0, index - 1) + value.slice(index);
        onChange(newValue);
        if (inputsRef.current[index - 1]) {
          inputsRef.current[index - 1].focus();
        }
      } else {
        const newValue = value.slice(0, index) + value.slice(index + 1);
        onChange(newValue);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      if (inputsRef.current[index - 1]) {
        inputsRef.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowRight' && index < 5) {
      if (inputsRef.current[index + 1]) {
        inputsRef.current[index + 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      onChange(pastedData);
      const focusIndex = Math.min(pastedData.length, 5);
      if (inputsRef.current[focusIndex]) {
        inputsRef.current[focusIndex].focus();
      }
    }
  };

  return (
    <div className="flex justify-center items-center gap-2 sm:gap-3 py-2" onPaste={handlePaste}>
      {boxes.map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={getBoxValue(index)}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-2xl bg-white border border-[#3A2E26]/20 text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/20 transition-all shadow-sm hover:border-[#C97C5D]/40"
        />
      ))}
    </div>
  );
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess, showNotification, isAdminOnly = false }) {
  const { loginWithPopup } = useAuth0();

  const handleGoogleLogin = async () => {
    const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN || '';
    if (auth0Domain.includes('dev-your-domain') || !auth0Domain) {
      // Dev mode: simulate Google login via social-login endpoint
      // Use the email already typed in the form, or prompt for one
      const googleEmail = email.trim() || window.prompt('Enter your Google email for mock login:');
      if (!googleEmail) return;

      try {
        const data = await socialLogin(googleEmail, `Google User`, 'google');
        localStorage.setItem('hausmade_token', data.token);
        localStorage.setItem('hausmade_user', JSON.stringify(data.user));

        if (showNotification) {
          showNotification('Google Login Successful', 'success');
        }
        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }
        onClose();
      } catch (err) {
        if (showNotification) {
          showNotification(err.message || 'Google login failed', 'error');
        }
      }
    } else {
      // Production: trigger actual Auth0 popup login
      try {
        await loginWithPopup({ authorizationParams: { connection: 'google-oauth2' } });
      } catch (err) {
        if (showNotification) {
          showNotification(err.message || 'Google login failed', 'error');
        }
      }
    }
  };

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Email OTP states
  const [loginMethod, setLoginMethod] = useState(isAdminOnly ? 'password' : 'otp'); // 'password' or 'otp'
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Reset form states when modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setName('');
      setShowPassword(false);
      setLoading(false);
      setError('');
      setOtpSent(false);
      setOtpCode('');
      setOtpLoading(false);
      setLoginMethod(isAdminOnly ? 'password' : 'otp');
    }
  }, [isOpen, isAdminOnly]);

  if (!isOpen) return null;

  const isLogin = isAdminOnly ? true : isLoginTab;

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

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your Email Address first');
      return;
    }
    setOtpLoading(true);
    setError('');
    try {
      await sendOtp({ email: email });
      setOtpSent(true);
      if (showNotification) {
        showNotification('Verification code sent to your email!', 'success');
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin && loginMethod === 'otp' && !otpSent) {
      await handleSendOtp();
      return;
    }

    setLoading(true);

    // Additional client-side check for signup password strength
    if (!isLogin && strengthScore < 3) {
      setError('Please make sure your password is at least "Good" before registering.');
      setLoading(false);
      return;
    }

    try {
      let data;
      if (isLogin) {
        if (!email) {
          throw new Error('Please enter your Email Address');
        }
        if (loginMethod === 'otp') {
          if (!otpCode) {
            throw new Error('Please enter the verification code sent to your email');
          }
          data = await verifyOtp({ email: email }, otpCode);
        } else {
          data = await loginUser(email, password);
        }
        
        if (isAdminOnly && !data.user?.is_admin) {
          throw new Error('Access denied. Administrator credentials required.');
        }
      } else {
        data = await registerUser(name, email, undefined, password);
      }
      
      localStorage.setItem('hausmade_token', data.token);
      localStorage.setItem('hausmade_user', JSON.stringify(data.user));
      
      if (showNotification) {
        showNotification(isLogin ? 'Welcome back! Logged in successfully.' : 'Account created successfully! Welcome to Hausmade™ Club.', 'success');
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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs font-sans">
      {/* Backdrop click to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-[#FDFBF7] rounded-3xl border border-[#3A2E26]/10 shadow-2xl overflow-hidden text-[#3A2E26] flex flex-col md:flex-row min-h-[520px] animate-scaleUp z-10">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#3A2E26]/60 hover:text-[#3A2E26] rounded-full hover:bg-[#3A2E26]/5 transition-colors z-20 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

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
                {isAdminOnly ? 'Admin Dashboard Login' : 'Welcome to Hausmade™'}
              </h3>
              <p className="text-[11px] text-[#3A2E26]/70 mt-0.5 max-w-xs mx-auto">
                {isAdminOnly 
                  ? 'Log in with your administrator account' 
                  : 'Enter your email to sign in or create your account using a secure verification code (OTP)'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {isLogin ? (
                /* LOGIN FLOW */
                <>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold text-[#3A2E26] uppercase tracking-widest">
                        Email Address
                      </label>
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        disabled={loginMethod === 'otp' && otpSent}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] placeholder:text-[#3A2E26]/40 focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/20 transition-all font-medium disabled:bg-gray-50 disabled:text-[#3A2E26]/50"
                      />
                    </div>
                  </div>

                  {loginMethod === 'password' ? (
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
                  ) : (
                    otpSent && (
                      <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[11px] font-bold text-[#3A2E26] uppercase tracking-widest">
                            Verification Code (OTP)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setOtpSent(false);
                              setOtpCode('');
                            }}
                            className="text-[10px] font-bold text-[#C97C5D] hover:underline uppercase tracking-wider cursor-pointer"
                          >
                            Change Email
                          </button>
                        </div>
                        <OtpBoxes value={otpCode} onChange={setOtpCode} />
                        <div className="flex justify-end mt-1.5">
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={otpLoading}
                            className="text-[10px] font-bold text-[#3A2E26]/60 hover:text-[#3A2E26] hover:underline cursor-pointer disabled:opacity-50"
                          >
                            {otpLoading ? 'Sending...' : "Didn't receive code? Resend"}
                          </button>
                        </div>
                      </div>
                    )
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
                disabled={loading || otpLoading}
                className="w-full py-3 mt-4 bg-[#3A2E26] hover:bg-black text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading || otpLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isLogin 
                        ? (loginMethod === 'otp' 
                            ? (otpSent ? 'Verify & Sign In' : 'Send Verification Code') 
                            : 'Sign In') 
                        : 'Create Account'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {!isAdminOnly && (
              <>
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
              </>
            )}


            {/* Security Assurance Footer */}
            <div className="mt-6 pt-4 border-t border-[#3A2E26]/10 text-center flex items-center justify-center gap-1.5 text-[10px] text-[#3A2E26]/50">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7A8B6F]" />
              <span>256-bit SSL Encrypted & Private</span>
            </div>
          </div>
        </div>
      </div>
  );
}
