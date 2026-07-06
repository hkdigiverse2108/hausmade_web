import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, ShieldCheck, Sparkles, Loader2, MapPin, Compass, Building, Globe, Navigation, ChevronRight, UserCheck, Check, Heart, ShoppingBag, Lock, LogOut, Trash2, Calendar, Hash, Package, RefreshCw } from 'lucide-react';
import { updateUserProfile, getUserOrders, getUserSubscriptions, requestUrgentSoap } from '../utils/api';

let isInitialPageLoad = true;

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  user, 
  token, 
  onProfileUpdate, 
  showNotification,
  wishlistItems = [],
  onRemoveFromWishlist,
  onAddToCart,
  onBuyNow,
  onLogout
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isInitialPageLoad) {
        isInitialPageLoad = false;
        setAnimate(false);
      } else {
        setAnimate(true);
      }
    }
  }, [isOpen]);
  
  // Multiple addresses states
  const [addresses, setAddresses] = useState([]);
  const [editingAddressId, setEditingAddressId] = useState(null); // ID of address being edited
  const [isAddingNew, setIsAddingNew] = useState(false); // boolean flag to toggle adding form

  // Form inputs for current address (either adding or editing)
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrCountry, setAddrCountry] = useState('India');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'address' | 'wishlist' | 'orders' | 'security'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [subsError, setSubsError] = useState('');

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingSecurity, setUpdatingSecurity] = useState(false);

  useEffect(() => {
    if (user) {
      setName((user.name && !user.name.startsWith('Member ')) ? user.name : '');
      setEmail(user.email || '');
      setMobile(user.mobile || '');
      
      // Initialize addresses
      if (user.addresses && user.addresses.length > 0) {
        setAddresses(user.addresses);
      } else if (user.address_line1 || user.city) {
        setAddresses([
          {
            id: 'default-legacy',
            label: 'Default Address',
            address_line1: user.address_line1 || '',
            address_line2: user.address_line2 || '',
            city: user.city || '',
            state: user.state || '',
            zip_code: user.zip_code || '',
            country: user.country || 'India',
            is_default: true
          }
        ]);
      } else {
        setAddresses([]);
      }
    }
  }, [user, isOpen]);

  const handleClose = () => {
    if (user) {
      setName((user.name && !user.name.startsWith('Member ')) ? user.name : '');
      setEmail(user.email || '');
      setMobile(user.mobile || '');
      if (user.addresses && user.addresses.length > 0) {
        setAddresses(user.addresses);
      } else if (user.address_line1 || user.city) {
        setAddresses([
          {
            id: 'default-legacy',
            label: 'Default Address',
            address_line1: user.address_line1 || '',
            address_line2: user.address_line2 || '',
            city: user.city || '',
            state: user.state || '',
            zip_code: user.zip_code || '',
            country: user.country || 'India',
            is_default: true
          }
        ]);
      } else {
        setAddresses([]);
      }
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsAddingNew(false);
    setEditingAddressId(null);
    if (onClose) onClose();
  };

  useEffect(() => {
    if (activeTab === 'orders' && token && isOpen) {
      loadUserOrders();
    }
  }, [activeTab, token, isOpen]);

  useEffect(() => {
    if (activeTab === 'subscriptions' && token && isOpen) {
      loadUserSubscriptions();
    }
  }, [activeTab, token, isOpen]);

  const loadUserSubscriptions = async () => {
    setLoadingSubs(true);
    setSubsError('');
    try {
      const data = await getUserSubscriptions(token);
      setSubscriptions(data);
    } catch (err) {
      setSubsError(err.message || 'Failed to fetch subscriptions');
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleRequestUrgentSoap = async (subId) => {
    if (!window.confirm('તાત્કાલિક સાબુ મંગાવવા માટે સહમત છો? આ ઓર્ડર માટે અલગથી ચૂકવણી કરવાની રહેશે અને આનાથી તમારા સબ્સ્ક્રિપ્શન ક્વોટા પર કોઈ અસર નહીં થાય.')) return;
    setLoading(true);
    try {
      await requestUrgentSoap(subId, token);
      showNotification('તાત્કાલિક ઓર્ડર સફળતાપૂર્વક જનરેટ થઈ ગયો છે! (Urgent order placed successfully)');
      loadUserSubscriptions();
    } catch (err) {
      showNotification(err.message || 'Urgent request failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUserOrders = async () => {
    setLoadingOrders(true);
    setOrdersError('');
    try {
      const data = await getUserOrders(token);
      const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setOrders(sorted);
    } catch (err) {
      setOrdersError(err.message || 'Failed to fetch order history');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      showNotification('Please enter a new password', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    setUpdatingSecurity(true);
    try {
      const payload = {
        current_password: currentPassword,
        password: newPassword
      };
      await updateUserProfile(payload, token);
      showNotification('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showNotification(err.message || 'Failed to update security credentials', 'error');
    } finally {
      setUpdatingSecurity(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!isOpen) return null;

  const handleSubmitPersonal = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name,
        email,
        mobile
      };

      const data = await updateUserProfile(payload, token);
      
      localStorage.setItem('hausmade_user', JSON.stringify(data.user));
      
      if (onProfileUpdate) {
        onProfileUpdate(data.user);
      }
      
      if (showNotification) {
        showNotification('Personal details saved successfully!', 'success');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      if (showNotification) {
        showNotification(err.message || 'Failed to update profile', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAddresses = async (updatedList) => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        name,
        email,
        mobile,
        // Legacy fallback fields (use default address if present)
        address_line1: updatedList.find(a => a.is_default)?.address_line1 || '',
        address_line2: updatedList.find(a => a.is_default)?.address_line2 || '',
        city: updatedList.find(a => a.is_default)?.city || '',
        state: updatedList.find(a => a.is_default)?.state || '',
        zip_code: updatedList.find(a => a.is_default)?.zip_code || '',
        country: updatedList.find(a => a.is_default)?.country || 'India',
        addresses: updatedList
      };

      const data = await updateUserProfile(payload, token);
      localStorage.setItem('hausmade_user', JSON.stringify(data.user));
      
      if (onProfileUpdate) {
        onProfileUpdate(data.user);
      }
      
      if (showNotification) {
        showNotification('Address book updated successfully!', 'success');
      }
    } catch (err) {
      setError(err.message || 'Failed to update addresses');
      if (showNotification) {
        showNotification(err.message || 'Failed to update addresses', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (addr) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label || 'Home');
    setAddrLine1(addr.address_line1 || '');
    setAddrLine2(addr.address_line2 || '');
    setAddrCity(addr.city || '');
    setAddrState(addr.state || '');
    setAddrZip(addr.zip_code || '');
    setAddrCountry(addr.country || 'India');
    setAddrIsDefault(addr.is_default || false);
  };

  const handleSaveAddressForm = () => {
    if (!addrLine1 || !addrCity || !addrState || !addrZip) {
      if (showNotification) showNotification('Please fill in all required address fields', 'error');
      return;
    }

    const addressData = {
      id: editingAddressId || `addr-${Date.now()}`,
      label: addrLabel,
      address_line1: addrLine1,
      address_line2: addrLine2,
      city: addrCity,
      state: addrState,
      zip_code: addrZip,
      country: addrCountry,
      is_default: addrIsDefault
    };

    let updatedList = [];
    if (editingAddressId) {
      updatedList = addresses.map(addr => addr.id === editingAddressId ? addressData : addr);
    } else {
      updatedList = [...addresses, addressData];
    }

    // Handle is_default rules: if this one is default, set others to false
    if (addrIsDefault) {
      updatedList = updatedList.map(addr => addr.id === addressData.id ? { ...addr, is_default: true } : { ...addr, is_default: false });
    } else if (updatedList.length === 1) {
      updatedList[0].is_default = true;
    }

    setAddresses(updatedList);
    setEditingAddressId(null);
    setIsAddingNew(false);
    
    handleSubmitAddresses(updatedList);
  };

  const handleDeleteAddress = (id) => {
    let updatedList = addresses.filter(addr => addr.id !== id);
    if (updatedList.length > 0 && !updatedList.some(a => a.is_default)) {
      updatedList[0].is_default = true;
    }
    setAddresses(updatedList);
    handleSubmitAddresses(updatedList);
  };

  const handleSetDefault = (id) => {
    const updatedList = addresses.map(addr => addr.id === id ? { ...addr, is_default: true } : { ...addr, is_default: false });
    setAddresses(updatedList);
    handleSubmitAddresses(updatedList);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 w-full h-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F1E8] to-[#EAE3D2] text-[#3A2E26] overflow-y-auto flex flex-col font-sans ${animate ? 'animate-fadeIn' : ''}`}
    >
      {/* Background Decorative Organic Accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#7A8B6F]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#C97C5D]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Premium Top Navigation Bar */}
      <div className="sticky top-0 bg-white/70 backdrop-blur-xl border-b border-[#3A2E26]/10 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#C97C5D] to-[#E09F80] flex items-center justify-center text-white shadow-md shadow-[#C97C5D]/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-serif-brand text-xl font-bold tracking-tight text-[#3A2E26]">Hausmade™ Profile Panel</h1>
            <p className="text-[9px] uppercase tracking-widest text-[#7A8B6F] font-bold">Manage settings & delivery address</p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="px-4 py-2 rounded-xl bg-[#3A2E26] hover:bg-[#3A2E26]/90 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
        >
          <span>Exit Settings</span>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-8 relative z-10">
        
        {/* Left Column: User Profile Overview Card & Sidebar Navigation */}
        <div className="w-full md:w-80 shrink-0 space-y-6">
          <div className="bg-white border border-[#3A2E26]/10 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A8B6F] via-[#C97C5D] to-[#EAE3D2]" />
            
            <div className="flex flex-col items-center text-center mt-4">
              <div className="w-20 h-20 rounded-full bg-[#F5F1E8] border border-[#3A2E26]/15 flex items-center justify-center text-3xl font-bold text-[#7A8B6F] shadow-inner mb-4">
                {name ? name.charAt(0).toUpperCase() : <User className="w-8 h-8 text-[#7A8B6F]" />}
              </div>
              <h2 className="font-serif-brand text-lg font-bold text-[#3A2E26] truncate max-w-full">
                {name || 'Hausmade Client'}
              </h2>
              <p className="text-[11px] text-[#3A2E26]/60 truncate max-w-full flex items-center gap-1 mt-1">
                <Mail className="w-3.5 h-3.5 text-[#C97C5D]" />
                <span>{email || 'No email attached'}</span>
              </p>

              <div className="mt-5 w-full border-t border-[#3A2E26]/10 pt-4 flex items-center justify-center gap-1.5 text-[#7A8B6F] font-bold text-[10px] uppercase tracking-wider">
                <UserCheck className="w-4 h-4" />
                <span>Verified Client</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation Sidebar */}
          <div className="bg-[#FDFBF7]/60 border border-[#3A2E26]/10 rounded-3xl p-2.5 space-y-1">
            <button
              onClick={() => setActiveTab('personal')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'personal'
                  ? 'bg-white border border-[#3A2E26]/15 text-[#3A2E26] shadow-sm'
                  : 'text-[#3A2E26]/60 hover:text-[#3A2E26] hover:bg-white/45'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-[#C97C5D]" />
                <span>Personal Details</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('address')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'address'
                  ? 'bg-white border border-[#3A2E26]/15 text-[#3A2E26] shadow-sm'
                  : 'text-[#3A2E26]/60 hover:text-[#3A2E26] hover:bg-white/45'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#C97C5D]" />
                <span>Shipping Address</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'wishlist'
                  ? 'bg-white border border-[#3A2E26]/15 text-[#3A2E26] shadow-sm'
                  : 'text-[#3A2E26]/60 hover:text-[#3A2E26] hover:bg-white/45'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-[#C97C5D]" />
                <span>My Wishlist</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-white border border-[#3A2E26]/15 text-[#3A2E26] shadow-sm'
                  : 'text-[#3A2E26]/60 hover:text-[#3A2E26] hover:bg-white/45'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-[#C97C5D]" />
                <span>Order History</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'subscriptions'
                  ? 'bg-white border border-[#3A2E26]/15 text-[#3A2E26] shadow-sm'
                  : 'text-[#3A2E26]/60 hover:text-[#3A2E26] hover:bg-white/45'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-[#C97C5D]" />
                <span>My Subscriptions</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-white border border-[#3A2E26]/15 text-[#3A2E26] shadow-sm'
                  : 'text-[#3A2E26]/60 hover:text-[#3A2E26] hover:bg-white/45'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-[#C97C5D]" />
                <span>Security Settings</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="pt-4 border-t border-[#3A2E26]/10 mt-2">
              <button
                onClick={() => {
                  if (onLogout) onLogout();
                  handleClose();
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>Logout Account</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Settings Details Form */}
        <div className="flex-1">
          <div className="bg-[#FDFBF7] border border-[#3A2E26]/10 rounded-3xl p-6 sm:p-8 shadow-sm">
            
            {/* Tab: Personal Details Form */}
            {activeTab === 'personal' && (
              <form onSubmit={handleSubmitPersonal} className="space-y-6">
                <div className="border-b border-[#3A2E26]/10 pb-4">
                  <h3 className="font-serif-brand text-xl font-bold tracking-tight text-[#3A2E26]">Personal Information</h3>
                  <p className="text-xs text-[#3A2E26]/60 mt-0.5">Edit credentials and communication preferences</p>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-2">
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
                          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. john@example.com"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-2">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 rounded-2xl">
                    {error}
                  </div>
                )}

                {/* Form Controls */}
                <div className="border-t border-[#3A2E26]/10 pt-6 flex items-center justify-end gap-3.5 mt-8">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-3 rounded-2xl border border-[#3A2E26]/20 hover:bg-[#3A2E26]/5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-white"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3.5 bg-[#3A2E26] hover:bg-[#3A2E26]/90 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Save Personal Details</span>
                        <Sparkles className="w-4 h-4 text-[#C97C5D]" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Tab: Shipping Address List & Address Sub-Form */}
            {activeTab === 'address' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-[#3A2E26]/10 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif-brand text-xl font-bold tracking-tight text-[#3A2E26]">Shipping Address List</h3>
                    <p className="text-xs text-[#3A2E26]/60 mt-0.5">Manage delivery details for botanical orders</p>
                  </div>
                  {(isAddingNew || editingAddressId) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNew(false);
                        setEditingAddressId(null);
                      }}
                      className="text-xs font-bold text-[#C97C5D] hover:underline cursor-pointer"
                    >
                      Back to Address Book
                    </button>
                  )}
                </div>

                {/* List View */}
                {!isAddingNew && !editingAddressId && (
                  <div className="space-y-4">
                    {addresses.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-[#3A2E26]/10 rounded-3xl">
                        <MapPin className="w-8 h-8 text-[#3A2E26]/30 mx-auto mb-2" />
                        <p className="text-sm font-bold text-[#3A2E26]">No shipping addresses saved yet</p>
                        <p className="text-xs text-[#3A2E26]/60 mt-1">Please add a shipping address below to checkout quickly.</p>
                      </div>
                    ) : (
                      addresses.map((addr) => (
                        <div 
                          key={addr.id}
                          className={`p-5 rounded-2xl border-2 transition-all relative ${
                            addr.is_default 
                              ? 'border-[#7A8B6F] bg-white shadow-sm'
                              : 'border-[#3A2E26]/10 bg-white/50 hover:border-[#3A2E26]/20'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-[#3A2E26]/5 text-[#3A2E26] rounded-md">
                              {addr.label}
                            </span>
                            {addr.is_default && (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#7A8B6F]/10 text-[#7A8B6F] rounded-md">
                                Default
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm font-medium text-[#3A2E26] leading-relaxed pr-24">
                            {addr.address_line1}
                            {addr.address_line2 && `, ${addr.address_line2}`}
                            <br />
                            {addr.city}, {addr.state} - {addr.zip_code}
                            <br />
                            {addr.country}
                          </p>

                          {/* Actions corner */}
                          <div className="absolute top-4 right-4 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditClick(addr)}
                              className="px-2.5 py-1.5 rounded-lg border border-[#3A2E26]/10 hover:border-[#3A2E26]/30 text-xs font-bold text-[#3A2E26] transition-colors cursor-pointer bg-white"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-xs font-bold text-red-500 transition-colors cursor-pointer bg-white"
                            >
                              Delete
                            </button>
                          </div>

                          {!addr.is_default && (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(addr.id)}
                              className="mt-3.5 text-xs font-bold text-[#7A8B6F] hover:underline cursor-pointer flex items-center gap-1"
                            >
                              Set as Default Address
                            </button>
                          )}
                        </div>
                      ))
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNew(true);
                        setAddrLabel('Home');
                        setAddrLine1('');
                        setAddrLine2('');
                        setAddrCity('');
                        setAddrState('');
                        setAddrZip('');
                        setAddrCountry('India');
                        setAddrIsDefault(addresses.length === 0);
                      }}
                      className="w-full py-4 rounded-2xl border-2 border-dashed border-[#3A2E26]/20 hover:border-[#3A2E26]/40 text-center text-sm font-bold text-[#3A2E26]/80 hover:text-[#3A2E26] transition-all cursor-pointer bg-white/40 hover:bg-white/70"
                    >
                      + Add New Address
                    </button>
                  </div>
                )}

                {/* Form View (Adding or Editing) */}
                {(isAddingNew || editingAddressId) && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-2">
                          Address Label
                        </label>
                        <select
                          value={addrLabel}
                          onChange={(e) => setAddrLabel(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all font-medium"
                        >
                          <option value="Home">Home</option>
                          <option value="Office">Office</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="flex items-end pb-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={addrIsDefault}
                            onChange={(e) => setAddrIsDefault(e.target.checked)}
                            className="rounded text-[#7A8B6F] focus:ring-[#7A8B6F]/50"
                          />
                          <span className="text-xs font-bold uppercase tracking-wider text-[#3A2E26]/80">Set as default address</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-2">
                        Street Address *
                      </label>
                      <div className="relative">
                        <Compass className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={addrLine1}
                          onChange={(e) => setAddrLine1(e.target.value)}
                          placeholder="House No, Apartment, Suite, Street Name"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-2">
                        Apartment / Suite / Landmark (Optional)
                      </label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={addrLine2}
                          onChange={(e) => setAddrLine2(e.target.value)}
                          placeholder="e.g. Near Shiv Temple, VIP Road"
                          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-2">
                          City *
                        </label>
                        <div className="relative">
                          <Navigation className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={addrCity}
                            onChange={(e) => setAddrCity(e.target.value)}
                            placeholder="e.g. Surat"
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-2">
                          State *
                        </label>
                        <div className="relative">
                          <Navigation className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={addrState}
                            onChange={(e) => setAddrState(e.target.value)}
                            placeholder="e.g. Gujarat"
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-2">
                          ZIP / Postal Code *
                        </label>
                        <div className="relative">
                          <Compass className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={addrZip}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setAddrZip(val);
                              if (val.length === 6) {
                                fetch(`https://api.postalpincode.in/pincode/${val}`)
                                  .then(res => res.json())
                                  .then(data => {
                                    if (data && data[0] && data[0].Status === 'Success') {
                                      const postOffice = data[0].PostOffice[0];
                                      if (postOffice) {
                                        if (postOffice.District || postOffice.Block || postOffice.Name) {
                                          setAddrCity(postOffice.District || postOffice.Block || postOffice.Name);
                                        }
                                        if (postOffice.State) {
                                          setAddrState(postOffice.State);
                                        }
                                      }
                                    }
                                  })
                                  .catch(err => console.error("Error auto-fetching pincode details:", err));
                              }
                            }}
                            placeholder="e.g. 395007"
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-2">
                          Country *
                        </label>
                        <div className="relative">
                          <Globe className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={addrCountry}
                            onChange={(e) => setAddrCountry(e.target.value)}
                            placeholder="e.g. India"
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions controls for form */}
                    <div className="border-t border-[#3A2E26]/10 pt-5 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNew(false);
                          setEditingAddressId(null);
                        }}
                        className="px-6 py-2.5 rounded-2xl border border-[#3A2E26]/20 hover:bg-[#3A2E26]/5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAddressForm}
                        disabled={loading}
                        className="px-6 py-2.5 bg-[#3A2E26] hover:bg-[#3A2E26]/90 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Save Address</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Tab: My Wishlist */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-[#3A2E26]/10 pb-4">
                  <h3 className="font-serif-brand text-xl font-bold tracking-tight text-[#3A2E26]">My Wishlist</h3>
                  <p className="text-xs text-[#3A2E26]/60 mt-0.5">Your personal catalog of organic botanical soap packs</p>
                </div>

                {wishlistItems.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-[#3A2E26]/10 rounded-3xl">
                    <Heart className="w-10 h-10 text-[#3A2E26]/20 mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#3A2E26]">Your wishlist is currently empty</p>
                    <p className="text-xs text-[#3A2E26]/60 mt-1">Tap the heart icon next to product packs on the storefront to save them here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="bg-white p-4 rounded-2xl border border-[#3A2E26]/10 shadow-xs flex items-center gap-4 relative">
                        <img 
                          src={item.image} 
                          alt={item.title} 
                          className="w-16 h-16 object-cover rounded-xl border border-[#E6D5C3]/30 bg-[#F5F1E8]"
                          onError={(e) => { e.target.src = '/images/pack-single.png'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-[#3A2E26] truncate">{item.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{item.count} {item.count === 1 ? 'bar' : 'bars'}</p>
                          <p className="text-sm font-semibold text-[#7A8B6F] mt-1">{formatCurrency(item.basePrice)}</p>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              onAddToCart({
                                packId: item.id,
                                title: item.title,
                                count: item.count,
                                isSubscription: false,
                                frequency: null,
                                unitPrice: (item.basePrice / item.count).toFixed(2),
                                packPrice: item.basePrice.toFixed(2),
                                quantity: 1,
                                totalPrice: item.basePrice.toFixed(2),
                                image: item.image
                              });
                              showNotification(`${item.title} added to cart!`);
                            }}
                            className="px-3 py-1.5 bg-[#3A2E26] hover:bg-[#3A2E26]/90 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Add To Cart
                          </button>
                          <button
                            onClick={() => onRemoveFromWishlist(item)}
                            className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-500 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Order History */}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-[#3A2E26]/10 pb-4">
                  <h3 className="font-serif-brand text-xl font-bold tracking-tight text-[#3A2E26]">Order History</h3>
                  <p className="text-xs text-[#3A2E26]/60 mt-0.5">Your personal botanical purchase registry</p>
                </div>

                {loadingOrders ? (
                  <div className="flex flex-col items-center justify-center py-16 text-[#3A2E26]/60">
                    <Loader2 className="w-8 h-8 animate-spin text-[#7A8B6F] mb-3" />
                    <p className="text-xs font-semibold">Retrieving your order ledger...</p>
                  </div>
                ) : ordersError ? (
                  <div className="p-4 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 rounded-2xl text-center">
                    {ordersError}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-[#3A2E26]/10 rounded-3xl">
                    <Package className="w-10 h-10 text-[#3A2E26]/20 mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#3A2E26]">No orders recorded</p>
                    <p className="text-xs text-[#3A2E26]/60 mt-1">You haven't placed any botanical orders yet.</p>
                  </div>
                ) : (
                  <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2">
                    {orders.map((order) => (
                      <div key={order.orderId || order._id} className="bg-white rounded-2xl p-4 border border-[#3A2E26]/10 shadow-xs">
                        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#3A2E26]/5 pb-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold text-[#C97C5D] bg-[#C97C5D]/10 px-2 py-0.5 rounded-lg tracking-wider">
                              {order.orderId}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-[#3A2E26]/60 font-semibold">
                              <Calendar className="w-3 h-3" />
                              {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                timeZone: 'Asia/Kolkata'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-bold text-[#7A8B6F] bg-[#7A8B6F]/10 px-2 py-0.5 rounded-md">
                              {order.paymentMethod.toUpperCase()}
                            </span>
                            <span className="text-sm font-bold text-[#3A2E26]">
                              {formatCurrency(order.grandTotal)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {order.cartItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-[#FDFBF7] p-2 rounded-xl border border-[#3A2E26]/5">
                              <img 
                                src={item.image} 
                                alt={item.title} 
                                className="w-10 h-10 object-cover rounded-lg border border-[#3A2E26]/10"
                                onError={(e) => { e.target.src = '/images/pack-single.png'; }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-[#3A2E26] truncate">{item.title}</p>
                                <p className="text-[9px] text-[#3A2E26]/60 font-medium">
                                  Qty: {item.quantity} × {formatCurrency(parseFloat(item.unitPrice))}
                                  {item.isSubscription && <span className="ml-1 text-[#7A8B6F] font-bold">(Auto-Refill)</span>}
                                </p>
                              </div>
                              <span className="text-xs font-bold text-[#3A2E26]">
                                {formatCurrency(parseFloat(item.totalPrice))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Subscriptions */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-[#3A2E26]/10 pb-4">
                  <h3 className="font-serif-brand text-xl font-bold tracking-tight text-[#3A2E26]">My Subscriptions</h3>
                  <p className="text-xs text-[#3A2E26]/60 mt-0.5">Manage your active soap recurring subscriptions and request urgent soap bars.</p>
                </div>

                {loadingSubs ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[#3A2E26]/50">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <p className="text-xs font-semibold">Loading subscriptions...</p>
                  </div>
                ) : subsError ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-medium">
                    {subsError}
                  </div>
                ) : subscriptions.length === 0 ? (
                  <div className="text-center py-12 bg-[#FDFBF7]/50 rounded-2xl border border-[#3A2E26]/10">
                    <RefreshCw className="w-10 h-10 text-[#C97C5D]/30 mx-auto mb-3 animate-spin-slow" />
                    <h4 className="font-bold text-[#3A2E26] text-sm">No Active Subscriptions</h4>
                    <p className="text-xs text-[#3A2E26]/60 mt-1 max-w-sm mx-auto">
                      You haven't subscribed to any soap packs yet. Pick Subscribe & Save at checkout to auto-delivery fresh batches!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {subscriptions.map((sub, idx) => {
                      const isSubActive = sub.status === 'active';
                      return (
                        <div key={idx} className="bg-white border border-[#3A2E26]/10 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#3A2E26]/5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[#3A2E26]">{sub.subscriptionId}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                  sub.status === 'active'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : sub.status === 'paused'
                                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                    : sub.status === 'completed'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                  {sub.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-0.5">Created: {new Date(sub.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right sm:text-left">
                              <span className="text-xs font-bold text-[#C97C5D] block">
                                {sub.soapsPerMonth} Soaps / {sub.deliveryFrequency === 'every_3_months' ? '3 Months' : 'Month'}
                              </span>
                              <span className="text-[10px] text-gray-500">Duration: {sub.durationMonths} Months</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <p className="text-gray-400 font-medium">Delivery Schedule</p>
                              <p className="text-[#3A2E26] font-bold uppercase tracking-wide">
                                {sub.deliveryFrequency === 'every_3_months' ? 'Every 3 Months' : 'Every Month'}
                              </p>
                              <p className="text-gray-500 text-[11px]">
                                Next Date: {sub.next_delivery_date ? new Date(sub.next_delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-400 font-medium">Deliveries Left</p>
                              <p className="text-[#3A2E26] font-bold">
                                {sub.remaining_deliveries} of {sub.total_deliveries} remaining
                              </p>
                              <p className="text-gray-500 text-[11px]">Payment: {sub.paymentMethod}</p>
                            </div>
                          </div>

                          {/* Shipping address details */}
                          <div className="p-3 bg-[#FDFBF7] rounded-2xl border border-[#3A2E26]/5 text-xs">
                            <p className="font-bold text-[#3A2E26] mb-1">Shipping Details</p>
                            <p className="text-gray-600">{sub.shippingAddress?.fullName} &bull; {sub.shippingAddress?.phone}</p>
                            <p className="text-gray-500 mt-0.5">{sub.shippingAddress?.address}, {sub.shippingAddress?.city} - {sub.shippingAddress?.pincode}</p>
                          </div>

                          {/* Action button for urgent delivery */}
                          {isSubActive && (
                            <div className="pt-2 border-t border-[#3A2E26]/5 flex flex-wrap justify-between items-center gap-3">
                              <div className="text-[11px] text-[#C97C5D] font-medium max-w-sm">
                                💡 *વચ્ચે કટોકટીમાં સાબુ જોઈતા હોય તો?* "Request Urgent Soap" કરો. આનું પેમેન્ટ અલગથી કરાશે અને નિયમિત સબ્સ્ક્રિપ્શન ચાલુ રહેશે.
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRequestUrgentSoap(sub.subscriptionId)}
                                className="px-4 py-2 bg-gradient-to-r from-[#C97C5D] to-[#D88A6E] hover:from-[#d68564] hover:to-[#c47a5e] text-white font-bold rounded-xl text-xs shadow-md transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
                              >
                                Request Urgent Soap
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Security Settings */}
            {activeTab === 'security' && (
              <form onSubmit={handleSecuritySubmit} className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#3A2E26]/10 pb-4">
                  <h3 className="font-serif-brand text-xl font-bold tracking-tight text-[#3A2E26]">Security Settings</h3>
                  <p className="text-xs text-[#3A2E26]/60 mt-0.5">Update credentials and secure your account</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#3A2E26] uppercase tracking-widest mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#C97C5D] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-[#3A2E26]/20 text-sm text-[#3A2E26] focus:outline-none focus:border-[#C97C5D] focus:ring-2 focus:ring-[#C97C5D]/10 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#3A2E26]/10 pt-4 flex items-center justify-end gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={updatingSecurity}
                    className="px-6 py-2.5 bg-[#3A2E26] hover:bg-[#3A2E26]/90 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {updatingSecurity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Update Credentials</span>
                  </button>
                </div>
              </form>
            )}
            
          </div>
        </div>

      </div>

      {/* Footer Security Badges */}
      <div className="bg-white/50 border-t border-[#3A2E26]/10 py-6 text-center flex items-center justify-center gap-1.5 text-xs text-[#3A2E26]/60 z-10 relative">
        <ShieldCheck className="w-4.5 h-4.5 text-[#7A8B6F]" />
        <span>SSL Secured Checkout & Encrypted Personal Information Vault</span>
      </div>
    </div>
  );
}
