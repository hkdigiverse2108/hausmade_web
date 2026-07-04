import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Search, 
  DollarSign, 
  LogOut, 
  Calendar, 
  CreditCard, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Activity, 
  Package,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle,
  Truck,
  Plus,
  Edit,
  Trash2,
  Tag,
  Percent,
  Image,
  AlertCircle,
  Eye,
  Sliders,
  MessageSquare,
  Star
} from 'lucide-react';
import { 
  getAdminStats, 
  getAdminOrders, 
  getAdminUsers,
  getProducts,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminGetCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
  uploadImage,
  updateSiteSettings,
  adminGetReviews,
  adminApproveReview,
  adminDeleteReview,
  adminUpdateReview
} from '../utils/api';

function AdminPanel({ token, onLogout, showNotification, onViewStorefront, settings, onUpdateSettings }) {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('hausmade_admin_active_tab') || 'overview';
  });
  const [stats, setStats] = useState({ total_revenue: 0, order_count: 0, customer_count: 0 });
  const [settingsForm, setSettingsForm] = useState({
    logo_url: '',
    announcement: { text: '', active: true },
    hero: { badge: '', title_normal_1: '', title_italic: '', title_normal_2: '', description: '' },
    story: { title: '', subtitle: '', paragraph1: '', paragraph2: '' },
    contact: { email: '', phone: '', address: '' },
    subscription: {
      badge: '',
      title_normal: '',
      title_highlight: '',
      description: '',
      perk1: '',
      perk2: '',
      perk3: '',
      card_badge: '',
      card_title: '',
      card_description: '',
      button_text: ''
    },
    faqs: []
  });

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        ...settings,
        logo_url: settings.logo_url || '',
        faqs: settings.faqs || []
      });
    }
  }, [settings]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    localStorage.setItem('hausmade_admin_active_tab', activeTab);
  }, [activeTab]);
  
  // Search states
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [couponSearch, setCouponSearch] = useState('');

  // Modal / Form state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = add new, otherwise product object
  const [productForm, setProductForm] = useState({
    id: '',
    title: '',
    count: 1,
    basePrice: 0,
    savingsBadge: '',
    popular: false,
    bestValue: false,
    image: '',
    stock: 0,
    active: true
  });

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null); // null = add new, otherwise coupon object
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount: 0,
    description: '',
    active: true,
    lifetime: true,
    start_date: '',
    end_date: ''
  });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });

  const fetchAdminData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const [statsData, ordersData, usersData, productsData, couponsData, reviewsData] = await Promise.all([
        getAdminStats(token),
        getAdminOrders(token),
        getAdminUsers(token),
        getProducts(),
        adminGetCoupons(token),
        adminGetReviews(token)
      ]);
      
      setStats(statsData);
      setOrders(ordersData);
      setCustomers(usersData);
      setProducts(productsData);
      setCoupons(couponsData);
      setReviews(reviewsData);
    } catch (err) {
      console.error("Admin data fetch error:", err);
      if (showNotification) {
        showNotification(err.message || 'Failed to retrieve admin dashboard records', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApproveReview = async (reviewId) => {
    try {
      await adminApproveReview(reviewId, token);
      showNotification('Review approved and published to storefront!', 'success');
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, approved: true } : r));
    } catch (err) {
      showNotification(err.message || 'Failed to approve review', 'error');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await adminDeleteReview(reviewId, token);
      showNotification('Review deleted successfully.', 'success');
      setReviews(prev => prev.filter(r => r.id !== reviewId && r._id !== reviewId));
    } catch (err) {
      showNotification(err.message || 'Failed to delete review', 'error');
    }
  };

  const handleOpenEditReview = (review) => {
    setEditingReview(review);
    setReviewForm({
      rating: review.rating,
      comment: review.comment
    });
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const id = editingReview.id || editingReview._id;
      await adminUpdateReview(id, reviewForm.rating, reviewForm.comment, token);
      showNotification('Review updated successfully!', 'success');
      setReviews(prev => prev.map(r => (r.id === id || r._id === id) ? { ...r, rating: parseInt(reviewForm.rating), comment: reviewForm.comment } : r));
      setIsReviewModalOpen(false);
    } catch (err) {
      showNotification(err.message || 'Failed to update review', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminData();
    }
  }, [token]);

  const handleRefresh = () => {
    fetchAdminData(true);
  };

  // Filter orders based on search
  const filteredOrders = orders.filter(order => {
    const searchLower = orderSearch.toLowerCase();
    const orderIdMatch = order.orderId?.toLowerCase().includes(searchLower);
    const nameMatch = order.shippingAddress?.fullName?.toLowerCase().includes(searchLower);
    const emailMatch = order.shippingAddress?.email?.toLowerCase().includes(searchLower);
    const phoneMatch = order.shippingAddress?.phone?.includes(searchLower);
    return orderIdMatch || nameMatch || emailMatch || phoneMatch;
  });

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerSearch.toLowerCase();
    const nameMatch = customer.name?.toLowerCase().includes(searchLower);
    const emailMatch = customer.email?.toLowerCase().includes(searchLower);
    const mobileMatch = customer.mobile?.includes(searchLower);
    return nameMatch || emailMatch || mobileMatch;
  });

  // Filter products based on search
  const filteredProducts = products.filter(prod => {
    const searchLower = productSearch.toLowerCase();
    return prod.title?.toLowerCase().includes(searchLower) || prod.id?.toLowerCase().includes(searchLower);
  });

  // Filter coupons based on search
  const filteredCoupons = coupons.filter(c => {
    const searchLower = couponSearch.toLowerCase();
    return c.code?.toLowerCase().includes(searchLower) || c.description?.toLowerCase().includes(searchLower);
  });

  // Product Event Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      id: '',
      title: '',
      count: 1,
      basePrice: 0,
      savingsBadge: '',
      popular: false,
      bestValue: false,
      image: '',
      stock: 100,
      active: true
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      id: prod.id,
      title: prod.title,
      count: prod.count,
      basePrice: prod.basePrice,
      savingsBadge: prod.savingsBadge || '',
      popular: prod.popular || false,
      bestValue: prod.bestValue || false,
      image: prod.image,
      stock: prod.stock !== undefined ? prod.stock : 0,
      active: prod.active !== false
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.id) {
      showNotification('Product ID is required', 'error');
      return;
    }
    if (!productForm.title) {
      showNotification('Product title is required', 'error');
      return;
    }
    if (parseFloat(productForm.basePrice) <= 0 || isNaN(parseFloat(productForm.basePrice))) {
      showNotification('Base Price must be a positive number greater than 0', 'error');
      return;
    }
    if (!productForm.image) {
      showNotification('Product image is required. Please upload or paste a URL.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...productForm,
        count: parseInt(productForm.count) || 1,
        basePrice: parseFloat(productForm.basePrice) || 0,
        stock: parseInt(productForm.stock) || 0,
        savingsBadge: productForm.savingsBadge || null,
        active: productForm.active !== false
      };
      
      if (editingProduct) {
        await adminUpdateProduct(editingProduct.id, payload, token);
        showNotification('Product updated successfully!');
      } else {
        await adminCreateProduct(payload, token);
        showNotification('Product created successfully!');
      }
      setIsProductModalOpen(false);
      fetchAdminData(true);
    } catch (err) {
      showNotification(err.message || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setSaving(true);
    try {
      await adminDeleteProduct(prodId, token);
      showNotification('Product deleted successfully!');
      fetchAdminData(true);
    } catch (err) {
      showNotification(err.message || 'Failed to delete product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProductActive = async (prod) => {
    setSaving(true);
    try {
      const updatedProduct = {
        ...prod,
        active: prod.active === false ? true : false
      };
      delete updatedProduct._id;
      await adminUpdateProduct(prod.id, updatedProduct, token);
      showNotification(`Product "${prod.title}" ${updatedProduct.active ? 'activated' : 'deactivated'} successfully!`);
      fetchAdminData(true);
    } catch (err) {
      showNotification(err.message || 'Failed to toggle product status', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleProductImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
      const res = await uploadImage(file);
      setProductForm(prev => ({ ...prev, image: res.url }));
      showNotification('Image uploaded successfully!');
    } catch (err) {
      showNotification(err.message || 'Failed to upload image', 'error');
    } finally {
      setSaving(false);
    }
  };
  const handleLogoImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
      const res = await uploadImage(file);
      setSettingsForm(prev => ({ ...prev, logo_url: res.url }));
      showNotification('Logo image uploaded successfully!');
    } catch (err) {
      showNotification(err.message || 'Failed to upload logo image', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Coupon Event Handlers
  const handleOpenAddCoupon = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      discount: 0,
      description: '',
      active: true,
      lifetime: true,
      start_date: '',
      end_date: ''
    });
    setIsCouponModalOpen(true);
  };

  const handleOpenEditCoupon = (c) => {
    setEditingCoupon(c);
    setCouponForm({
      code: c.code,
      discount: c.discount * 100,
      description: c.description || '',
      active: c.active !== undefined ? c.active : true,
      lifetime: c.lifetime !== undefined ? c.lifetime : true,
      start_date: c.start_date || '',
      end_date: c.end_date || ''
    });
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    const discountVal = parseFloat(couponForm.discount);
    if (!couponForm.code || isNaN(discountVal) || discountVal < 0 || discountVal > 100) {
      showNotification('Please enter a valid code and discount percentage between 0 and 100 (e.g. 0 for Free Shipping, 15 for 15%)', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...couponForm,
        discount: discountVal / 100
      };
      
      if (editingCoupon) {
        await adminUpdateCoupon(editingCoupon.code, payload, token);
        showNotification('Coupon updated successfully!');
      } else {
        await adminCreateCoupon(payload, token);
        showNotification('Coupon created successfully!');
      }
      setIsCouponModalOpen(false);
      fetchAdminData(true);
    } catch (err) {
      showNotification(err.message || 'Failed to save coupon', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (code) => {
    if (!window.confirm(`Are you sure you want to delete coupon ${code}?`)) return;
    setSaving(true);
    try {
      await adminDeleteCoupon(code, token);
      showNotification('Coupon deleted successfully!');
      fetchAdminData(true);
    } catch (err) {
      showNotification(err.message || 'Failed to delete coupon', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCouponActive = async (couponObj) => {
    try {
      const updated = {
        ...couponObj,
        active: !couponObj.active
      };
      await adminUpdateCoupon(couponObj.code, updated, token);
      showNotification(`Coupon ${couponObj.code} ${!couponObj.active ? 'activated' : 'deactivated'} successfully!`, 'success');
      fetchAdminData(true);
    } catch (err) {
      showNotification(err.message || 'Failed to toggle status', 'error');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSiteSettings(settingsForm, token);
      showNotification('Site settings updated successfully!');
      if (onUpdateSettings) {
        onUpdateSettings();
      }
    } catch (err) {
      showNotification(err.message || 'Failed to save site settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3A2E26] flex flex-col font-sans">
      {/* Top Banner Navigation */}
      <header className="bg-[#3A2E26] text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-[#E6D5C3]/20 p-2 rounded-xl border border-[#E6D5C3]/30">
            <ShieldCheck className="w-6 h-6 text-[#E6D5C3]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Hausmade™ Admin Portal</h1>
            <p className="text-xs text-[#E6D5C3]/80">Manage your business operations securely</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="p-2 text-[#E6D5C3] hover:text-white rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Refresh statistics and data lists"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="h-6 w-[1px] bg-white/20"></div>
          {onViewStorefront && (
            <button 
              onClick={onViewStorefront}
              className="flex items-center gap-2 px-4 py-2 bg-[#7A8B6F] hover:bg-[#68785c] text-white rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>View Storefront</span>
            </button>
          )}
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/90 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Admin Panel</span>
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 bg-white border-r border-[#E6D5C3]/30 p-6 flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#3A2E26]/50 mb-3 px-3">
            Menu Navigation
          </div>
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'overview' 
                ? 'bg-[#3A2E26] text-white shadow-md' 
                : 'hover:bg-[#E6D5C3]/20 text-[#3A2E26]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'orders' 
                ? 'bg-[#3A2E26] text-white shadow-md' 
                : 'hover:bg-[#E6D5C3]/20 text-[#3A2E26]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order Management</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'customers' 
                ? 'bg-[#3A2E26] text-white shadow-md' 
                : 'hover:bg-[#E6D5C3]/20 text-[#3A2E26]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Registered Customers</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'products' 
                ? 'bg-[#3A2E26] text-white shadow-md' 
                : 'hover:bg-[#E6D5C3]/20 text-[#3A2E26]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Inventory</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'coupons' 
                ? 'bg-[#3A2E26] text-white shadow-md' 
                : 'hover:bg-[#E6D5C3]/20 text-[#3A2E26]'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Coupons & Offers</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'settings' 
                ? 'bg-[#3A2E26] text-white shadow-md' 
                : 'hover:bg-[#E6D5C3]/20 text-[#3A2E26]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Site Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
              activeTab === 'reviews' 
                ? 'bg-[#3A2E26] text-white shadow-md' 
                : 'hover:bg-[#E6D5C3]/20 text-[#3A2E26]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Reviews Moderation</span>
          </button>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="w-8 h-8 text-[#3A2E26] animate-spin" />
              <p className="text-sm font-medium text-[#3A2E26]/70">Loading administration records...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-8">
                  {/* Title Bar */}
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
                    <p className="text-sm text-[#3A2E26]/70">Real-time performance indicators and operational metrics</p>
                  </div>

                  {/* Summary Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-[#E6D5C3]/30 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                      <div className="bg-green-100 text-green-700 p-4 rounded-2xl">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#3A2E26]/60 uppercase tracking-wider">Total Revenue</p>
                        <h3 className="text-2xl font-bold tracking-tight mt-1">{formatCurrency(stats.total_revenue)}</h3>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-[#E6D5C3]/30 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                      <div className="bg-blue-100 text-blue-700 p-4 rounded-2xl">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#3A2E26]/60 uppercase tracking-wider">Orders Received</p>
                        <h3 className="text-2xl font-bold tracking-tight mt-1">{stats.order_count}</h3>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-[#E6D5C3]/30 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
                      <div className="bg-purple-100 text-purple-700 p-4 rounded-2xl">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#3A2E26]/60 uppercase tracking-wider">Total Customers</p>
                        <h3 className="text-2xl font-bold tracking-tight mt-1">{stats.customer_count}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Recent Operations */}
                  <div className="bg-white rounded-3xl border border-[#E6D5C3]/30 shadow-sm p-6">
                    <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                    {orders.length === 0 ? (
                      <p className="text-sm text-[#3A2E26]/60">No transaction data logged yet.</p>
                    ) : (
                      <div className="divide-y divide-[#E6D5C3]/20">
                        {orders.slice(0, 5).map((order) => (
                          <div key={order._id} className="py-4 flex justify-between items-center flex-wrap gap-2 text-sm">
                            <div className="flex items-center gap-3">
                              <div className="bg-[#E6D5C3]/20 p-2.5 rounded-xl">
                                <Package className="w-4 h-4 text-[#3A2E26]" />
                              </div>
                              <div>
                                <p className="font-semibold">{order.orderId}</p>
                                <p className="text-xs text-[#3A2E26]/60">{order.shippingAddress?.fullName} &bull; {formatDate(order.created_at)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-[#3A2E26]">{formatCurrency(order.grandTotal)}</p>
                              <p className="text-xs uppercase tracking-widest text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                {order.paymentMethod}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Orders */}
              {activeTab === 'orders' && (
                <div className="flex flex-col gap-6">
                  {/* Title & Filter Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Order Management</h2>
                      <p className="text-sm text-[#3A2E26]/70">Track customer purchases and verify fulfillment details</p>
                    </div>
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-[#3A2E26]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="Search ID, name or email..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Orders Data Table */}
                  <div className="bg-white rounded-3xl border border-[#E6D5C3]/30 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#FDFBF7] border-b border-[#E6D5C3]/30 text-xs font-bold uppercase tracking-wider text-[#3A2E26]/60">
                            <th className="p-4 pl-6">Order ID</th>
                            <th className="p-4">Customer Details</th>
                            <th className="p-4">Items Summary</th>
                            <th className="p-4">Payment Method</th>
                            <th className="p-4">Order Date</th>
                            <th className="p-4 pr-6 text-right">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6D5C3]/20 text-sm">
                          {filteredOrders.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-[#3A2E26]/50">
                                No matching order records located.
                              </td>
                            </tr>
                          ) : (
                            filteredOrders.map((order) => (
                              <tr key={order._id} className="hover:bg-[#FDFBF7]/50 transition-colors">
                                <td className="p-4 pl-6 font-semibold align-top">{order.orderId}</td>
                                <td className="p-4 align-top">
                                  <div className="font-semibold">{order.shippingAddress?.fullName}</div>
                                  <div className="text-xs text-[#3A2E26]/60 flex flex-col gap-0.5 mt-1">
                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {order.shippingAddress?.email || 'No email'}</span>
                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {order.shippingAddress?.phone}</span>
                                    <span className="flex items-start gap-1 mt-0.5"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {order.shippingAddress?.address}, {order.shippingAddress?.city} - {order.shippingAddress?.pincode}</span>
                                  </div>
                                </td>
                                <td className="p-4 align-top">
                                  <div className="flex flex-col gap-1.5">
                                    {order.cartItems?.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-2 bg-[#FDFBF7] p-1.5 rounded-xl border border-[#E6D5C3]/20 text-xs">
                                        {item.image && (
                                          <img src={item.image} alt={item.title} className="w-6 h-6 object-cover rounded-md" />
                                        )}
                                        <div>
                                          <span className="font-bold">{item.title}</span>
                                          <span className="text-[#3A2E26]/60 ml-1">x{item.quantity}</span>
                                          {item.isSubscription && (
                                            <span className="ml-1 text-[10px] text-green-700 font-bold bg-green-50 px-1 rounded">Sub</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4 align-top">
                                  <span className="inline-block px-2.5 py-1 bg-[#E6D5C3]/30 text-[#3A2E26] rounded-xl text-xs font-bold uppercase tracking-wider">
                                    {order.paymentMethod}
                                  </span>
                                </td>
                                <td className="p-4 align-top text-xs text-[#3A2E26]/80">{formatDate(order.created_at)}</td>
                                <td className="p-4 pr-6 align-top text-right font-bold text-base text-[#3A2E26]">
                                  {formatCurrency(order.grandTotal)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Customers */}
              {activeTab === 'customers' && (
                <div className="flex flex-col gap-6">
                  {/* Title & Filter Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Customer Accounts</h2>
                      <p className="text-sm text-[#3A2E26]/70">Explore registered user accounts and admin details</p>
                    </div>
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-[#3A2E26]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="Search name, email, or mobile..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Customers Data Table */}
                  <div className="bg-white rounded-3xl border border-[#E6D5C3]/30 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#FDFBF7] border-b border-[#E6D5C3]/30 text-xs font-bold uppercase tracking-wider text-[#3A2E26]/60">
                            <th className="p-4 pl-6">Customer Name</th>
                            <th className="p-4">Email Address</th>
                            <th className="p-4">Mobile Number</th>
                            <th className="p-4">Role status</th>
                            <th className="p-4 pr-6">Account Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6D5C3]/20 text-sm">
                          {filteredCustomers.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="p-8 text-center text-[#3A2E26]/50">
                                No matching customer accounts located.
                              </td>
                            </tr>
                          ) : (
                            filteredCustomers.map((customer) => (
                              <tr key={customer.id} className="hover:bg-[#FDFBF7]/50 transition-colors">
                                <td className="p-4 pl-6 font-semibold flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-[#3A2E26]/10 text-[#3A2E26] flex items-center justify-center font-bold text-xs uppercase">
                                    {customer.name?.slice(0, 2) || 'M'}
                                  </div>
                                  <span>{customer.name || 'Anonymous Member'}</span>
                                </td>
                                <td className="p-4">{customer.email || 'N/A'}</td>
                                <td className="p-4">{customer.mobile || 'N/A'}</td>
                                <td className="p-4">
                                  {customer.is_admin ? (
                                    <span className="inline-block px-2.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-bold">
                                      Administrator
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded-full text-xs font-medium">
                                      Customer
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 pr-6 text-xs text-[#3A2E26]/80">{formatDate(customer.created_at)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Products */}
              {activeTab === 'products' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Product Inventory</h2>
                      <p className="text-sm text-[#3A2E26]/70">Add, edit, or remove soap pack options and manage stock levels</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-[#3A2E26]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text"
                          placeholder="Search products..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] transition-colors"
                        />
                      </div>
                      <button
                        onClick={handleOpenAddProduct}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#7A8B6F] hover:bg-[#68785c] text-white rounded-2xl font-bold text-sm transition-colors shadow-sm shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Product</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#E6D5C3]/30 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#FDFBF7] border-b border-[#E6D5C3]/30 text-xs font-bold uppercase tracking-wider text-[#3A2E26]/60">
                            <th className="p-4 pl-6">Product Details</th>
                            <th className="p-4">Size Count</th>
                            <th className="p-4">Base Price</th>
                            <th className="p-4">Promo Badges</th>
                            <th className="p-4">Stock Status</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6D5C3]/20 text-sm">
                          {filteredProducts.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-[#3A2E26]/50">
                                No product pack records located. Click "Add Product" to create one.
                              </td>
                            </tr>
                          ) : (
                            filteredProducts.map((p) => {
                              const isLowStock = p.stock !== undefined && p.stock > 0 && p.stock <= 5;
                              const isOut = p.stock !== undefined && p.stock <= 0;
                              return (
                                <tr key={p.id} className="hover:bg-[#FDFBF7]/50 transition-colors">
                                  <td className="p-4 pl-6 align-middle font-semibold">
                                    <div className="flex items-center gap-3">
                                      <img 
                                        src={p.image || '/images/pack-single.png'} 
                                        alt={p.title} 
                                        className="w-12 h-12 object-cover rounded-xl border border-[#E6D5C3]/30"
                                        onError={(e) => { e.target.src = '/images/pack-single.png'; }}
                                      />
                                      <div className="flex flex-col">
                                        <span className="text-[#3A2E26] font-bold text-sm">{p.title}</span>
                                        <span className="text-[10px] text-gray-400 font-mono tracking-wider">ID: {p.id}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 align-middle">{p.count} {p.count === 1 ? 'bar' : 'bars'}</td>
                                  <td className="p-4 align-middle font-semibold">{formatCurrency(p.basePrice)}</td>
                                  <td className="p-4 align-middle">
                                    <div className="flex flex-wrap gap-1">
                                      {p.savingsBadge && (
                                        <span className="px-2 py-0.5 bg-[#C97C5D]/10 text-[#C97C5D] border border-[#C97C5D]/20 rounded-md text-[10px] font-bold uppercase">{p.savingsBadge}</span>
                                      )}
                                      {p.popular && (
                                        <span className="px-2 py-0.5 bg-[#7A8B6F]/10 text-[#7A8B6F] border border-[#7A8B6F]/20 rounded-md text-[10px] font-bold uppercase">Popular</span>
                                      )}
                                      {p.bestValue && (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold uppercase">Best Value</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4 align-middle">
                                    {isOut ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold animate-pulse">
                                        <AlertCircle className="w-3 h-3" /> Out of Stock
                                      </span>
                                    ) : isLowStock ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#C97C5D]/10 text-[#C97C5D] border border-[#C97C5D]/20 rounded-full text-xs font-bold">
                                        <AlertCircle className="w-3 h-3" /> Low Stock ({p.stock})
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold">
                                        In Stock ({p.stock})
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 align-middle">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleProductActive(p)}
                                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        p.active !== false ? 'bg-[#7A8B6F]' : 'bg-gray-200'
                                      }`}
                                      title={p.active !== false ? "Click to Deactivate" : "Click to Activate"}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                          p.active !== false ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                  </td>
                                  <td className="p-4 pr-6 align-middle text-right">
                                    <div className="flex justify-end items-center gap-2">
                                      <button
                                        onClick={() => handleOpenEditProduct(p)}
                                        className="p-1.5 text-gray-500 hover:text-[#3A2E26] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                        title="Edit Product"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProduct(p.id)}
                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Delete Product"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Coupons */}
              {activeTab === 'coupons' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Coupons & Offer Discounts</h2>
                      <p className="text-sm text-[#3A2E26]/70">Maintain promo codes and update customer discount percentages</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-[#3A2E26]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text"
                          placeholder="Search coupons..."
                          value={couponSearch}
                          onChange={(e) => setCouponSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] transition-colors"
                        />
                      </div>
                      <button
                        onClick={handleOpenAddCoupon}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#7A8B6F] hover:bg-[#68785c] text-white rounded-2xl font-bold text-sm transition-colors shadow-sm shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Coupon</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#E6D5C3]/30 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#FDFBF7] border-b border-[#E6D5C3]/30 text-xs font-bold uppercase tracking-wider text-[#3A2E26]/60">
                            <th className="p-4 pl-6">Coupon Code</th>
                            <th className="p-4">Discount Rate</th>
                            <th className="p-4">Offer Description</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6D5C3]/20 text-sm">
                          {filteredCoupons.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="p-8 text-center text-[#3A2E26]/50">
                                No active coupons located. Click "Add Coupon" to create one.
                              </td>
                            </tr>
                          ) : (
                            filteredCoupons.map((c) => (
                              <tr key={c.code} className="hover:bg-[#FDFBF7]/50 transition-colors">
                                <td className="p-4 pl-6 align-middle font-bold text-[#3A2E26] font-mono tracking-wider">{c.code}</td>
                                <td className="p-4 align-middle font-semibold text-green-700 font-mono">{(c.discount * 100).toFixed(0)}% Off</td>
                                <td className="p-4 align-middle text-gray-600">{c.description || 'No description provided'}</td>
                                <td className="p-4 align-middle">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCouponActive(c)}
                                    className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                                    style={{ backgroundColor: c.active ? '#7A8B6F' : '#E6D5C3' }}
                                    title={c.active ? "Click to Deactivate" : "Click to Activate"}
                                  >
                                    <span
                                      className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out"
                                      style={{ transform: c.active ? 'translateX(20px)' : 'translateX(0px)' }}
                                    />
                                  </button>
                                </td>
                                <td className="p-4 pr-6 align-middle text-right">
                                  <div className="flex justify-end items-center gap-2">
                                    <button
                                      onClick={() => handleOpenEditCoupon(c)}
                                      className="p-1.5 text-gray-500 hover:text-[#3A2E26] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                      title="Edit Coupon"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCoupon(c.code)}
                                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title="Delete Coupon"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

               {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-8 animate-fadeIn text-[#3A2E26]">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Site Content & Settings</h2>
                    <p className="text-sm text-[#3A2E26]/70">Modify brand logo, announcements, hero headlines, brand story details, and customer care contact fields.</p>
                  </div>

                  {/* Brand Logo Settings */}
                  <div className="bg-white rounded-3xl p-6 border border-[#E6D5C3]/30 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold border-b border-[#E6D5C3]/20 pb-2">Brand Identity & Logo</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Brand Logo Image</label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Enter image URL or upload custom logo"
                            value={settingsForm.logo_url}
                            onChange={(e) => setSettingsForm({
                              ...settingsForm,
                              logo_url: e.target.value
                            })}
                            className="flex-1 px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                          />
                          <label className="bg-[#E6D5C3]/30 hover:bg-[#E6D5C3]/50 text-[#3A2E26] font-bold text-xs px-4 rounded-2xl flex items-center justify-center cursor-pointer border border-[#E6D5C3]/50 transition-colors shrink-0">
                            <Plus className="w-4 h-4 mr-1" /> Upload Logo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {settingsForm.logo_url && (
                          <div className="mt-3 flex items-center gap-4 p-3 bg-[#FDFBF7] border border-[#E6D5C3]/20 rounded-2xl w-fit">
                            <div className="w-12 h-12 rounded-full bg-[#C97C5D] flex items-center justify-center overflow-hidden">
                              <img src={settingsForm.logo_url} alt="Logo Preview" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">Header preview format</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Announcement Banner Settings */}
                  <div className="bg-white rounded-3xl p-6 border border-[#E6D5C3]/30 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold border-b border-[#E6D5C3]/20 pb-2">Announcement Banner</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Banner Text</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.announcement.text}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            announcement: { ...settingsForm.announcement, text: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={settingsForm.announcement.active}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            announcement: { ...settingsForm.announcement, active: e.target.checked }
                          })}
                          className="w-4 h-4 text-[#7A8B6F] border-gray-300 rounded focus:ring-[#7A8B6F]"
                        />
                        <span>Announcement Banner is Visible</span>
                      </label>
                    </div>
                  </div>

                  {/* Hero Section Settings */}
                  <div className="bg-white rounded-3xl p-6 border border-[#E6D5C3]/30 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold border-b border-[#E6D5C3]/20 pb-2">Hero Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Top Badge Text</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.hero.badge}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            hero: { ...settingsForm.hero, badge: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Headline Part 1 (Normal)</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.hero.title_normal_1}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            hero: { ...settingsForm.hero, title_normal_1: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Headline Part 2 (Italicized)</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.hero.title_italic}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            hero: { ...settingsForm.hero, title_italic: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Headline Part 3 (Normal)</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.hero.title_normal_2}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            hero: { ...settingsForm.hero, title_normal_2: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Hero Description</label>
                        <textarea
                          required
                          rows="3"
                          value={settingsForm.hero.description}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            hero: { ...settingsForm.hero, description: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Story Section Settings */}
                  <div className="bg-white rounded-3xl p-6 border border-[#E6D5C3]/30 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold border-b border-[#E6D5C3]/20 pb-2">Heritage Story</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Story Badge / Subtitle</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.story.subtitle}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            story: { ...settingsForm.story, subtitle: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Story Title</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.story.title}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            story: { ...settingsForm.story, title: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">First Paragraph</label>
                        <textarea
                          required
                          rows="3"
                          value={settingsForm.story.paragraph1}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            story: { ...settingsForm.story, paragraph1: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Second Paragraph</label>
                        <textarea
                          required
                          rows="3"
                          value={settingsForm.story.paragraph2}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            story: { ...settingsForm.story, paragraph2: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Story Image</label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Image URL or upload below"
                            value={settingsForm.story.image_url || ''}
                            onChange={(e) => setSettingsForm({
                              ...settingsForm,
                              story: { ...settingsForm.story, image_url: e.target.value }
                            })}
                            className="flex-1 px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                          />
                          <label className="bg-[#E6D5C3]/30 hover:bg-[#E6D5C3]/50 text-[#3A2E26] font-bold text-xs px-4 rounded-2xl flex items-center justify-center cursor-pointer border border-[#E6D5C3]/50 transition-colors shrink-0">
                            <Plus className="w-4 h-4 mr-1" /> Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                setSaving(true);
                                try {
                                  const res = await uploadImage(file);
                                  setSettingsForm(prev => ({
                                    ...prev,
                                    story: { ...prev.story, image_url: res.url }
                                  }));
                                  showNotification('Story image uploaded successfully!');
                                } catch (err) {
                                  showNotification('Failed to upload story image', 'error');
                                } finally {
                                  setSaving(false);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Artisan / Author Name</label>
                          <input
                            type="text"
                            value={settingsForm.story.author_name || ''}
                            onChange={(e) => setSettingsForm({
                              ...settingsForm,
                              story: { ...settingsForm.story, author_name: e.target.value }
                            })}
                            className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Artisan / Author Title</label>
                          <input
                            type="text"
                            value={settingsForm.story.author_title || ''}
                            onChange={(e) => setSettingsForm({
                              ...settingsForm,
                              story: { ...settingsForm.story, author_title: e.target.value }
                            })}
                            className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact / Footer Details */}
                  <div className="bg-white rounded-3xl p-6 border border-[#E6D5C3]/30 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold border-b border-[#E6D5C3]/20 pb-2">Customer Care & Footer Contact</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Support Email</label>
                        <input
                          type="email"
                          required
                          value={settingsForm.contact.email}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            contact: { ...settingsForm.contact, email: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Support Helpline Phone</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.contact.phone}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            contact: { ...settingsForm.contact, phone: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Marketing Address</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.contact.address}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            contact: { ...settingsForm.contact, address: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subscribe & Save Section Settings */}
                  <div className="bg-white rounded-3xl p-6 border border-[#E6D5C3]/30 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold border-b border-[#E6D5C3]/20 pb-2">Subscribe & Save Banner</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Section Badge</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.subscription?.badge || ''}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            subscription: { ...settingsForm.subscription, badge: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Main Title (Normal)</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.subscription?.title_normal || ''}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            subscription: { ...settingsForm.subscription, title_normal: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Title Highlight (Accent color)</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.subscription?.title_highlight || ''}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            subscription: { ...settingsForm.subscription, title_highlight: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Description Text</label>
                        <textarea
                          required
                          rows="2"
                          value={settingsForm.subscription?.description || ''}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            subscription: { ...settingsForm.subscription, description: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Perk 1 (Left Box)</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.subscription?.perk1 || ''}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            subscription: { ...settingsForm.subscription, perk1: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Perk 2 (Middle Box)</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.subscription?.perk2 || ''}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            subscription: { ...settingsForm.subscription, perk2: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Perk 3 (Right Box)</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.subscription?.perk3 || ''}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            subscription: { ...settingsForm.subscription, perk3: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Right Widget Card Badge</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.subscription?.card_badge || ''}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            subscription: { ...settingsForm.subscription, card_badge: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Right Widget Card Title</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.subscription?.card_title || ''}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            subscription: { ...settingsForm.subscription, card_title: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Right Widget Card Description</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.subscription?.card_description || ''}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            subscription: { ...settingsForm.subscription, card_description: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Configure Button Text</label>
                        <input
                          type="text"
                          required
                          value={settingsForm.subscription?.button_text || ''}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            subscription: { ...settingsForm.subscription, button_text: e.target.value }
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Frequently Asked Questions (FAQ) Settings */}
                  <div className="bg-white rounded-3xl p-6 border border-[#E6D5C3]/30 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E6D5C3]/20 pb-2 flex-wrap gap-2">
                      <h3 className="text-lg font-bold">Frequently Asked Questions (FAQ)</h3>
                      <button
                        type="button"
                        onClick={() => {
                          const currentFaqs = settingsForm.faqs || [];
                          setSettingsForm({
                            ...settingsForm,
                            faqs: [...currentFaqs, { q: '', a: '' }]
                          });
                        }}
                        className="px-3.5 py-1.5 bg-[#7A8B6F] hover:bg-[#68785c] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add FAQ Item
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(!settingsForm.faqs || settingsForm.faqs.length === 0) ? (
                        <p className="text-xs text-[#3A2E26]/60 italic py-2">No FAQ items defined. Default storefront FAQs will be shown.</p>
                      ) : (
                        settingsForm.faqs.map((faq, idx) => (
                          <div key={idx} className="p-4 bg-[#FDFBF7] border border-[#E6D5C3]/30 rounded-2xl space-y-3 relative group">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-[#8C7A5B] uppercase tracking-wider">Question #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedFaqs = [...settingsForm.faqs];
                                  updatedFaqs.splice(idx, 1);
                                  setSettingsForm({
                                    ...settingsForm,
                                    faqs: updatedFaqs
                                  });
                                }}
                                className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                              </button>
                            </div>

                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Question (e.g. What is your shipping policy?)"
                                required
                                value={faq.q}
                                onChange={(e) => {
                                  const updatedFaqs = [...settingsForm.faqs];
                                  updatedFaqs[idx].q = e.target.value;
                                  setSettingsForm({
                                    ...settingsForm,
                                    faqs: updatedFaqs
                                  });
                                }}
                                className="w-full px-4 py-2 bg-white border border-[#E6D5C3]/40 rounded-xl text-sm focus:outline-none focus:border-[#3A2E26] font-bold text-[#3A2E26]"
                              />
                              <textarea
                                placeholder="Answer details..."
                                required
                                rows="3"
                                value={faq.a}
                                onChange={(e) => {
                                  const updatedFaqs = [...settingsForm.faqs];
                                  updatedFaqs[idx].a = e.target.value;
                                  setSettingsForm({
                                    ...settingsForm,
                                    faqs: updatedFaqs
                                  });
                                }}
                                className="w-full px-4 py-2.5 bg-white border border-[#E6D5C3]/40 rounded-xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-8 py-3 bg-[#3A2E26] hover:bg-[#2A201A] text-white font-bold text-sm rounded-2xl shadow-md transition-colors cursor-pointer flex items-center justify-center min-w-[8rem]"
                    >
                      {saving ? 'Saving...' : 'Save Site Settings'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'reviews' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Reviews Moderation</h2>
                      <p className="text-sm text-[#3A2E26]/70">Approve or reject customer-submitted reviews for the storefront</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-[#3A2E26]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="Search reviews..."
                        value={reviewSearch}
                        onChange={(e) => setReviewSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#E6D5C3]/30 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#FDFBF7] border-b border-[#E6D5C3]/30 text-xs font-bold uppercase tracking-wider text-[#3A2E26]/60">
                            <th className="p-4 pl-6">Customer</th>
                            <th className="p-4">Product</th>
                            <th className="p-4">Rating</th>
                            <th className="p-4">Comment</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6D5C3]/20 text-sm">
                          {reviews.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-[#3A2E26]/50">
                                No reviews submitted by customers yet.
                              </td>
                            </tr>
                          ) : (
                            reviews
                              .filter(r => {
                                const searchLower = reviewSearch.toLowerCase();
                                return (
                                  r.userName?.toLowerCase().includes(searchLower) ||
                                  r.productTitle?.toLowerCase().includes(searchLower) ||
                                  r.comment?.toLowerCase().includes(searchLower)
                                );
                              })
                              .map((r) => (
                                <tr key={r.id || r._id} className="hover:bg-[#FDFBF7]/50 transition-colors">
                                  <td className="p-4 pl-6 align-middle font-bold text-[#3A2E26]">
                                    <div>{r.userName}</div>
                                    <div className="text-[10px] font-medium text-gray-400 font-mono mt-0.5">{r.userEmail}</div>
                                  </td>
                                  <td className="p-4 align-middle font-semibold text-gray-700">{r.productTitle}</td>
                                  <td className="p-4 align-middle text-amber-500">
                                    <div className="flex items-center gap-0.5">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-3.5 h-3.5 ${
                                            i < r.rating
                                              ? 'fill-amber-500 text-amber-500'
                                              : 'text-gray-200'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </td>
                                  <td className="p-4 align-middle text-gray-600 max-w-xs truncate" title={r.comment}>
                                    {r.comment}
                                  </td>
                                  <td className="p-4 align-middle">
                                    {r.approved ? (
                                      <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold uppercase tracking-wider">
                                        Approved
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs font-bold uppercase tracking-wider">
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 pr-6 align-middle text-right">
                                    <div className="flex justify-end items-center gap-2">
                                      {!r.approved && (
                                        <button
                                          onClick={() => handleApproveReview(r.id || r._id)}
                                          className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                        >
                                          Approve
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleOpenEditReview(r)}
                                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                        title="Edit Review"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteReview(r.id || r._id)}
                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Delete Review"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Product Edit / Add Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-[#3A2E26]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#E6D5C3]/40 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-2 text-[#3A2E26]">
              {editingProduct ? 'Edit Product Pack Size' : 'Add New Product Pack'}
            </h3>
            <p className="text-xs text-[#3A2E26]/60 mb-6">Define pricing, counts, default stock, and images for user selection.</p>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Product ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. single, pack-4"
                  disabled={!!editingProduct}
                  value={productForm.id}
                  onChange={(e) => setProductForm({ ...productForm, id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Single Soap Bar (75g), Pack of 4"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Soap Bars Count</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.count}
                    onChange={(e) => setProductForm({ ...productForm, count: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Base Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={productForm.basePrice}
                    onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Promo Savings Badge</label>
                  <input
                    type="text"
                    placeholder="e.g. Save 15% (Optional)"
                    value={productForm.savingsBadge}
                    onChange={(e) => setProductForm({ ...productForm, savingsBadge: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                  />
                </div>
              </div>

              {/* Product Image Input & File Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Product Image Source</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Image URL or upload below"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    className="flex-1 px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                  />
                  <label className="bg-[#E6D5C3]/30 hover:bg-[#E6D5C3]/50 text-[#3A2E26] font-bold text-xs px-4 rounded-2xl flex items-center justify-center cursor-pointer border border-[#E6D5C3]/50 transition-colors">
                    <Plus className="w-4 h-4 mr-1" /> Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {productForm.image && (
                  <div className="mt-3 flex justify-center p-2 bg-[#FDFBF7] border border-[#E6D5C3]/20 rounded-2xl">
                    <img 
                      src={productForm.image} 
                      alt="Preview" 
                      className="h-28 object-contain rounded-lg"
                      onError={(e) => { e.target.src = '/images/pack-single.png'; }}
                    />
                  </div>
                )}
              </div>

              {/* Badge Checkboxes */}
              <div className="flex flex-col gap-3 py-3 border-t border-b border-[#E6D5C3]/20">
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#3A2E26] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.popular}
                      onChange={(e) => setProductForm({ ...productForm, popular: e.target.checked })}
                      className="w-4 h-4 text-[#7A8B6F] border-gray-300 rounded focus:ring-[#7A8B6F]"
                    />
                    <span>Mark as Most Popular</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[#3A2E26] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.bestValue}
                      onChange={(e) => setProductForm({ ...productForm, bestValue: e.target.checked })}
                      className="w-4 h-4 text-[#C97C5D] border-gray-300 rounded focus:ring-[#C97C5D]"
                    />
                    <span>Mark as Best Value</span>
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#3A2E26] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.active}
                    onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })}
                    className="w-4 h-4 text-[#7A8B6F] border-gray-300 rounded focus:ring-[#7A8B6F]"
                  />
                  <span>Product status is Active (Visible on live website)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 border border-[#E6D5C3] hover:bg-gray-50 text-[#3A2E26] font-bold text-sm rounded-2xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#3A2E26] hover:bg-[#2A201A] text-white font-bold text-sm rounded-2xl shadow-sm transition-colors cursor-pointer flex items-center justify-center min-w-[5rem]"
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Edit / Add Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 bg-[#3A2E26]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E6D5C3]/40 shadow-2xl relative">
            <h3 className="text-xl font-bold mb-2 text-[#3A2E26]">
              {editingCoupon ? 'Edit Discount Coupon' : 'Create Promo Offer Coupon'}
            </h3>
            <p className="text-xs text-[#3A2E26]/60 mb-6">Configure custom checkout discount codes and active states.</p>

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EXTRA25"
                  disabled={!!editingCoupon}
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Discount Rate (0% to 100%)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="1"
                  placeholder="e.g. 15 for 15% off (or 0 for Free Shipping)"
                  value={couponForm.discount}
                  onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                />
                <span className="text-[10px] text-green-700 font-bold block mt-1">Calculated value: {parseFloat(couponForm.discount || 0)}% off total price</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Offer Description</label>
                <input
                  type="text"
                  placeholder="e.g. 15% discount for spring shopping spree"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#3A2E26] cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={couponForm.lifetime}
                    onChange={(e) => setCouponForm({ ...couponForm, lifetime: e.target.checked })}
                    className="w-4 h-4 text-[#7A8B6F] border-gray-300 rounded focus:ring-[#7A8B6F]"
                  />
                  <span>Lifetime Coupon (Runs indefinitely without date limits)</span>
                </label>
              </div>

              {!couponForm.lifetime && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5 font-sans">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      required={!couponForm.lifetime}
                      value={couponForm.start_date}
                      onChange={(e) => setCouponForm({ ...couponForm, start_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5 font-sans">End Date & Time</label>
                    <input
                      type="datetime-local"
                      required={!couponForm.lifetime}
                      value={couponForm.end_date}
                      onChange={(e) => setCouponForm({ ...couponForm, end_date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#3A2E26] cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={couponForm.active}
                    onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })}
                    className="w-4 h-4 text-[#7A8B6F] border-gray-300 rounded focus:ring-[#7A8B6F]"
                  />
                  <span>Coupon status is Active (Usable at Checkout)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-5 py-2.5 border border-[#E6D5C3] hover:bg-gray-50 text-[#3A2E26] font-bold text-sm rounded-2xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#3A2E26] hover:bg-[#2A201A] text-white font-bold text-sm rounded-2xl shadow-sm transition-colors cursor-pointer flex items-center justify-center min-w-[5rem]"
                >
                  {saving ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Review Edit Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-[#3A2E26]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-[#E6D5C3]/40 shadow-2xl relative animate-scaleUp">
            <h3 className="text-xl font-bold mb-2 text-[#3A2E26]">Edit Customer Review</h3>
            <p className="text-xs text-[#3A2E26]/60 mb-6">Modify customer rating and comment text directly.</p>

            <form onSubmit={handleSaveReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5 font-sans">Rating Stars</label>
                <div className="flex items-center gap-1.5 py-1 font-sans">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewForm.rating
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5 font-sans">Comment / Content</label>
                <textarea
                  required
                  rows="4"
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Review content details..."
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-5 py-2.5 border border-[#E6D5C3] hover:bg-gray-50 text-[#3A2E26] font-bold text-sm rounded-2xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#3A2E26] hover:bg-[#2A201A] text-white font-bold text-sm rounded-2xl shadow-sm transition-colors cursor-pointer flex items-center justify-center min-w-[5rem]"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(AdminPanel);
