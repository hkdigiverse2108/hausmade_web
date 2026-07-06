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
  Star,
  Menu,
  Maximize2,
  Minimize2
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
  getAdminRecentUsers,
  getAdminSubscriptions,
  updateSubscriptionStatus,
  adminGetReviews,
  adminApproveReview,
  adminDeleteReview,
  adminUpdateReview,
  adminLogOfflineSale
} from '../utils/api';

function ImageUploader({ label, value, onChange, showNotification, isSaving, setIsSaving }) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    if (setIsSaving) setIsSaving(true);
    try {
      const res = await uploadImage(file);
      onChange(res.url);
      if (showNotification) {
        showNotification('Image uploaded successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      if (showNotification) {
        showNotification(err.message || 'Failed to upload image', 'error');
      }
    } finally {
      setUploading(false);
      if (setIsSaving) setIsSaving(false);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 font-sans">
          {label}
        </label>
      )}
      
      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-[#E6D5C3]/40 bg-[#FDFBF7] shadow-sm max-w-sm">
          {/* Image Preview */}
          <div className="w-full h-44 flex items-center justify-center p-4">
            <img 
              src={value} 
              alt="Uploaded Preview" 
              className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
              onError={(e) => { e.target.src = '/images/pack-single.png'; }}
            />
          </div>

          {/* Hover Overlay with controls */}
          <div className="absolute inset-0 bg-[#3A2E26]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
            <label className="bg-white hover:bg-gray-100 text-[#3A2E26] font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center cursor-pointer shadow-md transition-all">
              Replace Image
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading || isSaving}
              />
            </label>
            <button
              type="button"
              onClick={handleClear}
              className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs p-2 rounded-xl shadow-md transition-all cursor-pointer"
              title="Remove Image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty / Upload Placeholder Box */
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#E6D5C3] hover:border-[#3A2E26]/50 bg-[#FDFBF7]/50 hover:bg-[#FDFBF7] transition-all p-6 rounded-2xl cursor-pointer max-w-sm text-center">
          <div className="w-10 h-10 rounded-xl bg-[#3A2E26]/5 text-[#3A2E26]/70 flex items-center justify-center mb-2">
            {uploading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-[#C97C5D]" />
            )}
          </div>
          <span className="text-xs font-bold text-[#3A2E26] block">
            {uploading ? 'Uploading image...' : 'Click to Upload Image'}
          </span>
          <span className="text-[10px] text-[#3A2E26]/50 mt-1 block">
            Supports PNG, JPG, JPEG, WEBP up to 5MB
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading || isSaving}
          />
        </label>
      )}

      {/* Manual URL Edit Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[10px] font-bold text-[#7A8B6F] hover:underline uppercase tracking-wider block mt-1 cursor-pointer"
        >
          {showUrlInput ? 'Hide URL field' : 'Edit Image URL manually'}
        </button>
        
        {showUrlInput && (
          <input
            type="text"
            placeholder="Paste direct image URL here..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full mt-2 px-4 py-2 bg-[#FDFBF7] border border-[#E6D5C3]/40 rounded-xl text-xs focus:outline-none focus:border-[#3A2E26] font-sans"
          />
        )}
      </div>
    </div>
  );
}

function AdminPanel({ token, onLogout, showNotification, onViewStorefront, settings, onUpdateSettings }) {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('hausmade_admin_active_tab') || 'overview';
  });
  const [stats, setStats] = useState({ total_revenue: 0, order_count: 0, customer_count: 0, average_order_value: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [settingsForm, setSettingsForm] = useState({
    logo_url: '',
    announcement: { text: '', active: true },
    hero: { badge: '', title_normal_1: '', title_italic: '', title_normal_2: '', description: '', image_url: '' },
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
    subscription_discount_pct: 15.0,
    subscription_active: true,
    subscription_durations: [6, 12],
    subscription_quantities: [2, 4, 6],
    subscription_frequencies: ["monthly", "every_3_months"],
    faqs: [],
    ingredients: [],
    ingredients_active: true
  });
  const [settingsSubTab, setSettingsSubTab] = useState('identity'); // 'identity', 'hero', 'story', 'subscription', 'faqs', 'ingredients', 'contact'
  const [previewDevice, setPreviewDevice] = useState('pc'); // 'pc', 'tablet', 'mobile'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [customDuration, setCustomDuration] = useState('');
  const [customFreq, setCustomFreq] = useState('');
  const [previewFullscreen, setPreviewFullscreen] = useState(false);

  useEffect(() => {
    if (settings) {
      const currentAnn = settingsForm.announcement || { text: '', active: true };
      const newAnn = settings.announcement || { text: '', active: true };
      const currentHero = settingsForm.hero || {};
      const newHero = settings.hero || {};
      const currentStory = settingsForm.story || {};
      const newStory = settings.story || {};
      const currentContact = settingsForm.contact || {};
      const newContact = settings.contact || {};
      const currentSub = settingsForm.subscription || {};
      const newSub = settings.subscription || {};

      const hasChanged = 
        settingsForm.logo_url !== (settings.logo_url || '') ||
        currentAnn.text !== newAnn.text ||
        currentAnn.active !== newAnn.active ||
        JSON.stringify(currentHero) !== JSON.stringify(newHero) ||
        JSON.stringify(currentStory) !== JSON.stringify(newStory) ||
        JSON.stringify(currentContact) !== JSON.stringify(newContact) ||
        JSON.stringify(currentSub) !== JSON.stringify(newSub) ||
        settingsForm.subscription_discount_pct !== (settings.subscription_discount_pct !== undefined ? settings.subscription_discount_pct : 15.0) ||
        settingsForm.subscription_active !== (settings.subscription_active !== undefined ? settings.subscription_active : true) ||
        JSON.stringify(settingsForm.subscription_durations || []) !== JSON.stringify(settings.subscription_durations || []) ||
        JSON.stringify(settingsForm.subscription_quantities || []) !== JSON.stringify(settings.subscription_quantities || []) ||
        JSON.stringify(settingsForm.subscription_frequencies || []) !== JSON.stringify(settings.subscription_frequencies || []) ||
        JSON.stringify(settingsForm.faqs || []) !== JSON.stringify(settings.faqs || []) ||
        JSON.stringify(settingsForm.ingredients || []) !== JSON.stringify(settings.ingredients || []) ||
        settingsForm.ingredients_active !== (settings.ingredients_active !== undefined ? settings.ingredients_active : true);
        
      if (hasChanged) {
        setSettingsForm({
          ...settings,
          logo_url: settings.logo_url || '',
          subscription_discount_pct: settings.subscription_discount_pct !== undefined ? settings.subscription_discount_pct : 15.0,
          subscription_active: settings.subscription_active !== undefined ? settings.subscription_active : true,
          subscription_durations: settings.subscription_durations || [6, 12],
          subscription_quantities: settings.subscription_quantities || [2, 4, 6],
          subscription_frequencies: settings.subscription_frequencies || ["monthly", "every_3_months"],
          faqs: settings.faqs || [],
          ingredients: settings.ingredients || [],
          ingredients_active: settings.ingredients_active !== undefined ? settings.ingredients_active : true
        });
      }
    }
  }, [settings]);

  useEffect(() => {
    const isInsideIframe = window.self !== window.top;
    if (!isInsideIframe) {
      localStorage.setItem('hausmade_preview_settings', JSON.stringify(settingsForm));
      window.dispatchEvent(new Event('storage'));
    }
  }, [settingsForm]);

  useEffect(() => {
    const handlePreviewMessage = (event) => {
      if (event.data && event.data.type === 'focus-section') {
        setSettingsSubTab(event.data.section);
      }
    };
    window.addEventListener('message', handlePreviewMessage);
    return () => window.removeEventListener('message', handlePreviewMessage);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
  const [subSearch, setSubSearch] = useState('');

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

  const [isOfflineSaleModalOpen, setIsOfflineSaleModalOpen] = useState(false);
  const [offlineSaleForm, setOfflineSaleForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    packId: '',
    quantity: 1,
    totalPrice: 0,
    paymentMethod: 'Cash',
    created_at: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [orderSourceFilter, setOrderSourceFilter] = useState('all');
  const [statsFilter, setStatsFilter] = useState('all');

  const handleOpenOfflineSaleModal = () => {
    const singlePack = products.find(p => p.count === 1) || products[0];
    const firstProduct = singlePack?.id || 'pack-1';
    const firstPrice = singlePack?.basePrice || 299;
    setOfflineSaleForm({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      packId: firstProduct,
      pricePerSoap: firstPrice,
      quantity: 1,
      totalPrice: firstPrice,
      paymentMethod: 'Cash',
      created_at: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsOfflineSaleModalOpen(true);
  };

  const handleOfflineSaleProductChange = (packId) => {
    const prod = products.find(p => p.id === packId);
    const price = prod ? prod.basePrice : 0;
    setOfflineSaleForm(prev => ({
      ...prev,
      packId,
      totalPrice: price * prev.quantity
    }));
  };

  const handleOfflineSaleQuantityChange = (qty) => {
    const prod = products.find(p => p.id === offlineSaleForm.packId);
    const price = prod ? prod.basePrice : 0;
    setOfflineSaleForm(prev => ({
      ...prev,
      quantity: qty,
      totalPrice: price * qty
    }));
  };

  const handleSaveOfflineSale = async (e) => {
    e.preventDefault();
    if (!offlineSaleForm.customerName || !offlineSaleForm.customerPhone || !offlineSaleForm.packId) {
      showNotification('Please fill in customer name, phone, and select a product.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        customerName: offlineSaleForm.customerName,
        customerPhone: offlineSaleForm.customerPhone,
        customerEmail: offlineSaleForm.customerEmail || null,
        packId: offlineSaleForm.packId,
        quantity: parseInt(offlineSaleForm.quantity) || 1,
        totalPrice: parseFloat(offlineSaleForm.totalPrice) || 0,
        paymentMethod: offlineSaleForm.paymentMethod,
        created_at: offlineSaleForm.created_at ? new Date(offlineSaleForm.created_at).toISOString() : null,
        notes: offlineSaleForm.notes || null
      };
      await adminLogOfflineSale(payload, token);
      showNotification('Offline sale logged successfully!', 'success');
      setIsOfflineSaleModalOpen(false);
      fetchAdminData(true);
    } catch (err) {
      showNotification(err.message || 'Failed to log offline sale', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fetchAdminData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const [statsData, ordersData, usersData, productsData, couponsData, reviewsData, recentUsersData, subscriptionsData] = await Promise.all([
        getAdminStats(token),
        getAdminOrders(token),
        getAdminUsers(token),
        getProducts(),
        adminGetCoupons(token),
        adminGetReviews(token),
        getAdminRecentUsers(token),
        getAdminSubscriptions(token)
      ]);
      
      setStats(statsData);
      setOrders(ordersData);
      setCustomers(usersData);
      setProducts(productsData);
      setCoupons(couponsData);
      setReviews(reviewsData);
      setRecentUsers(recentUsersData);
      setSubscriptions(subscriptionsData);
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

  // Filter orders based on search and source
  const filteredOrders = orders.filter(order => {
    const matchesSource = 
      orderSourceFilter === 'all' || 
      (orderSourceFilter === 'online' && !order.isOffline) ||
      (orderSourceFilter === 'offline' && order.isOffline);
      
    if (!matchesSource) return false;

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
      end_date: '',
      type: 'percentage'
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
      end_date: c.end_date || '',
      type: c.type || (c.discount === 0 ? 'free_shipping' : 'percentage')
    });
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    const discountVal = couponForm.type === 'free_shipping' ? 0 : parseFloat(couponForm.discount);
    if (!couponForm.code || (couponForm.type !== 'free_shipping' && (isNaN(discountVal) || discountVal < 0 || discountVal > 100))) {
      showNotification('Please enter a valid code and discount percentage between 0 and 100 (e.g. 15 for 15%)', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...couponForm,
        discount: discountVal / 100,
        type: couponForm.type
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

  const handleUpdateSubscriptionStatus = async (orderId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change this subscription status to ${newStatus}?`)) return;
    setSaving(true);
    try {
      await updateSubscriptionStatus(orderId, newStatus, token);
      showNotification(`Subscription status updated to ${newStatus}!`);
      setSubscriptions(prev => prev.map(sub => sub.subscriptionId === orderId || sub.dbId === orderId || sub.orderId === orderId ? { ...sub, status: newStatus } : sub));
    } catch (err) {
      showNotification(err.message || 'Failed to update subscription status', 'error');
    } finally {
      setSaving(false);
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
  
  const getFilteredStats = () => {
    const filteredOrdersList = orders.filter(order => {
      if (statsFilter === 'online') return !order.isOffline;
      if (statsFilter === 'offline') return !!order.isOffline;
      return true;
    });

    const total_revenue = filteredOrdersList.reduce((sum, o) => sum + (parseFloat(o.grandTotal) || 0), 0);
    const order_count = filteredOrdersList.length;
    const uniqueCustomers = new Set(filteredOrdersList.map(o => o.shippingAddress?.phone || o.shippingAddress?.email));
    const customer_count = statsFilter === 'all' ? stats.customer_count : uniqueCustomers.size;
    const average_order_value = order_count > 0 ? total_revenue / order_count : 0;

    return {
      total_revenue,
      order_count,
      customer_count,
      average_order_value
    };
  };

  const getRevenueChartData = () => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      
      const dayTotal = orders.reduce((sum, order) => {
        if (!order.created_at) return sum;
        const orderDate = order.created_at.split(' ')[0].split('T')[0];
        
        const matchesFilter = 
          statsFilter === 'all' || 
          (statsFilter === 'online' && !order.isOffline) ||
          (statsFilter === 'offline' && order.isOffline);

        if (orderDate === dateStr && matchesFilter) {
          return sum + (parseFloat(order.grandTotal) || 0);
        }
        return sum;
      }, 0);
      data.push({ label, value: dayTotal });
    }
    return data;
  };

  const getProductDistributionData = () => {
    const counts = {};
    orders.forEach(o => {
      const matchesFilter = 
        statsFilter === 'all' || 
        (statsFilter === 'online' && !o.isOffline) ||
        (statsFilter === 'offline' && o.isOffline);
      if (!matchesFilter) return;

      o.cartItems?.forEach(item => {
        const title = item.title || 'Other';
        counts[title] = (counts[title] || 0) + (parseInt(item.quantity) || 0);
      });
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3A2E26] flex flex-col font-sans">
      {/* Top Banner Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#3A2E26]/10 px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 text-[#3A2E26] hover:bg-[#3A2E26]/5 rounded-xl transition-colors cursor-pointer mr-1 shrink-0"
            title={sidebarCollapsed ? "Expand Navigation Menu" : "Collapse Navigation Menu"}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3A2E26] to-[#5A4E46] flex items-center justify-center text-white shadow-md shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight uppercase font-sans text-[#3A2E26]">Hausmade™ Control Panel</h1>
            <p className="text-[10px] uppercase tracking-widest text-[#7A8B6F] font-bold">Secure Operations Gateway</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="p-2.5 text-[#3A2E26]/60 hover:text-[#3A2E26] rounded-xl hover:bg-[#3A2E26]/5 transition-all duration-200 disabled:opacity-50"
            title="Refresh statistics and data lists"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="h-6 w-[1px] bg-[#3A2E26]/10"></div>
          {onViewStorefront && (
            <button 
              onClick={onViewStorefront}
              className="flex items-center gap-2 px-4 py-2 bg-[#7A8B6F] hover:bg-[#68785c] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Storefront</span>
            </button>
          )}
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-[#C97C5D] hover:bg-[#b86c4d] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Admin</span>
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Mobile Sidebar Backdrop */}
        {!sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-[#3A2E26]/40 backdrop-blur-xs z-40 md:hidden transition-all duration-300"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Sidebar Tabs */}
        <aside className={`bg-[#FDFBF7] border-r border-[#3A2E26]/10 p-6 flex flex-col gap-2 shrink-0 transition-all duration-300 z-40
          fixed inset-y-0 left-0 w-64 shadow-2xl md:shadow-none md:relative md:translate-x-0 ${
            sidebarCollapsed ? '-translate-x-full md:w-20 md:translate-x-0 md:items-center md:px-3' : 'translate-x-0 w-64'
          }
        `}>
          {(!sidebarCollapsed || window.innerWidth >= 768) && (
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#3A2E26]/40 mb-3 px-3">
              Navigation Menu
            </div>
          )}
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-0' : ''
            } ${
              activeTab === 'overview' 
                ? 'bg-[#3A2E26] text-white shadow-lg shadow-[#3A2E26]/10 translate-x-1' 
                : 'hover:bg-[#3A2E26]/5 text-[#3A2E26]/75 hover:text-[#3A2E26]'
            }`}
            title="Overview"
          >
            <Activity className="w-4 h-4" />
            {!sidebarCollapsed && <span>Overview</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-0' : ''
            } ${
              activeTab === 'orders' 
                ? 'bg-[#3A2E26] text-white shadow-lg shadow-[#3A2E26]/10 translate-x-1' 
                : 'hover:bg-[#3A2E26]/5 text-[#3A2E26]/75 hover:text-[#3A2E26]'
            }`}
            title="Orders"
          >
            <ShoppingBag className="w-4 h-4" />
            {!sidebarCollapsed && <span>Orders</span>}
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-0' : ''
            } ${
              activeTab === 'customers' 
                ? 'bg-[#3A2E26] text-white shadow-lg shadow-[#3A2E26]/10 translate-x-1' 
                : 'hover:bg-[#3A2E26]/5 text-[#3A2E26]/75 hover:text-[#3A2E26]'
            }`}
            title="Customers"
          >
            <Users className="w-4 h-4" />
            {!sidebarCollapsed && <span>Customers</span>}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-0' : ''
            } ${
              activeTab === 'products' 
                ? 'bg-[#3A2E26] text-white shadow-lg shadow-[#3A2E26]/10 translate-x-1' 
                : 'hover:bg-[#3A2E26]/5 text-[#3A2E26]/75 hover:text-[#3A2E26]'
            }`}
            title="Products"
          >
            <Package className="w-4 h-4" />
            {!sidebarCollapsed && <span>Products</span>}
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-0' : ''
            } ${
              activeTab === 'coupons' 
                ? 'bg-[#3A2E26] text-white shadow-lg shadow-[#3A2E26]/10 translate-x-1' 
                : 'hover:bg-[#3A2E26]/5 text-[#3A2E26]/75 hover:text-[#3A2E26]'
            }`}
            title="Coupons"
          >
            <Tag className="w-4 h-4" />
            {!sidebarCollapsed && <span>Coupons</span>}
          </button>

          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-0' : ''
            } ${
              activeTab === 'subscriptions' 
                ? 'bg-[#3A2E26] text-white shadow-lg shadow-[#3A2E26]/10 translate-x-1' 
                : 'hover:bg-[#3A2E26]/5 text-[#3A2E26]/75 hover:text-[#3A2E26]'
            }`}
            title="Subscriptions"
          >
            <Clock className="w-4 h-4" />
            {!sidebarCollapsed && <span>Subscriptions</span>}
          </button>

          <div className="flex flex-col w-full">
            <button
              onClick={() => {
                setActiveTab('settings');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                sidebarCollapsed ? 'justify-center px-0' : ''
              } ${
                activeTab === 'settings' 
                  ? 'bg-[#3A2E26] text-white shadow-lg shadow-[#3A2E26]/10 translate-x-1' 
                  : 'hover:bg-[#3A2E26]/5 text-[#3A2E26]/75 hover:text-[#3A2E26]'
              }`}
              title="Site Settings"
            >
              <Sliders className="w-4 h-4" />
              {!sidebarCollapsed && <span>Site Settings</span>}
            </button>
            
            {activeTab === 'settings' && !sidebarCollapsed && (
              <div className="ml-6 mt-1 flex flex-col gap-0.5 border-l border-[#3A2E26]/15 pl-3 animate-fadeIn">
                {[
                  { id: 'identity', label: 'Identity & Banner' },
                  { id: 'hero', label: 'Hero Section' },
                  { id: 'story', label: 'Heritage Story' },
                  { id: 'subscription', label: 'Subscription' },
                  { id: 'faqs', label: 'FAQs' },
                  { id: 'ingredients', label: 'Ingredients' },
                  { id: 'contact', label: 'Contact Details' }
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSettingsSubTab(sub.id)}
                    className={`w-full text-left py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      settingsSubTab === sub.id
                        ? 'bg-[#3A2E26]/5 text-[#3A2E26] font-bold'
                        : 'text-[#3A2E26]/40 hover:text-[#3A2E26] hover:bg-white/40'
                    }`}
                  >
                    • {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-0' : ''
            } ${
              activeTab === 'reviews' 
                ? 'bg-[#3A2E26] text-white shadow-lg shadow-[#3A2E26]/10 translate-x-1' 
                : 'hover:bg-[#3A2E26]/5 text-[#3A2E26]/75 hover:text-[#3A2E26]'
            }`}
            title="Reviews"
          >
            <MessageSquare className="w-4 h-4" />
            {!sidebarCollapsed && <span>Reviews</span>}
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#3A2E26]/10 pb-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight uppercase text-[#3A2E26] font-sans">Dashboard Overview</h2>
                      <p className="text-xs text-[#3A2E26]/60">Real-time performance indicators and operational metrics</p>
                    </div>
                    {/* Log Offline Sale button and Filter Toggles */}
                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                      <div className="flex bg-[#3A2E26]/5 p-1 rounded-xl border border-[#3A2E26]/10">
                        {['all', 'online', 'offline'].map((source) => (
                          <button
                            key={source}
                            onClick={() => setStatsFilter(source)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              statsFilter === source
                                ? 'bg-[#3A2E26] text-white shadow-sm'
                                : 'text-[#3A2E26]/60 hover:text-[#3A2E26]'
                            }`}
                          >
                            {source}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleOpenOfflineSaleModal}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#7A8B6F] hover:bg-[#68785c] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Log Offline Sale</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Cards Grid */}
                  {(() => {
                    const filteredStats = getFilteredStats();
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-[#3A2E26]/10 shadow-sm flex items-center gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                          <div className="w-12 h-12 rounded-2xl bg-[#7A8B6F]/10 text-[#7A8B6F] flex items-center justify-center shrink-0">
                            <TrendingUp className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#3A2E26]/50 uppercase tracking-widest">Total Revenue</p>
                            <h3 className="text-xl font-bold tracking-tight text-[#3A2E26] mt-1">{formatCurrency(filteredStats.total_revenue)}</h3>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-[#3A2E26]/10 shadow-sm flex items-center gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                          <div className="w-12 h-12 rounded-2xl bg-[#C97C5D]/10 text-[#C97C5D] flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#3A2E26]/50 uppercase tracking-widest">Orders Received</p>
                            <h3 className="text-xl font-bold tracking-tight text-[#3A2E26] mt-1">{filteredStats.order_count}</h3>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-[#3A2E26]/10 shadow-sm flex items-center gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                          <div className="w-12 h-12 rounded-2xl bg-[#3A2E26]/5 text-[#3A2E26] flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#3A2E26]/50 uppercase tracking-widest">Total Customers</p>
                            <h3 className="text-xl font-bold tracking-tight text-[#3A2E26] mt-1">{filteredStats.customer_count}</h3>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-[#3A2E26]/10 shadow-sm flex items-center gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                            <DollarSign className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-[#3A2E26]/50 uppercase tracking-widest">Average Order Value</p>
                            <h3 className="text-xl font-bold tracking-tight text-[#3A2E26] mt-1">
                              {formatCurrency(filteredStats.average_order_value)}
                            </h3>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* SVG Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Growth Line Chart */}
                    <div className="bg-white p-6 rounded-3xl border border-[#3A2E26]/10 shadow-sm">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#3A2E26]/70 border-b border-[#3A2E26]/10 pb-3 mb-4">
                        7-Day Revenue Trend
                      </h3>
                      <div className="flex justify-center items-center py-4 bg-[#FDFBF7] rounded-2xl border border-[#3A2E26]/5">
                        {(() => {
                          const revData = getRevenueChartData();
                          const maxVal = Math.max(...revData.map(d => d.value), 500);
                          const width = 480;
                          const height = 180;
                          const padding = 30;
                          const points = revData.map((d, i) => {
                            const x = padding + (i * (width - padding * 2) / 6);
                            const y = height - padding - (d.value / maxVal) * (height - padding * 2);
                            return `${x},${y}`;
                          }).join(' ');

                          return (
                            <svg className="w-full max-w-[480px]" viewBox={`0 0 ${width} ${height}`}>
                              <defs>
                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#7A8B6F" stopOpacity="0.4" />
                                  <stop offset="100%" stopColor="#7A8B6F" stopOpacity="0.0" />
                                </linearGradient>
                              </defs>
                              {/* Grid lines */}
                              <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#3A2E26" strokeOpacity="0.05" strokeDasharray="3,3" />
                              <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#3A2E26" strokeOpacity="0.05" strokeDasharray="3,3" />
                              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#3A2E26" strokeOpacity="0.1" />

                              {/* Fill area */}
                              {points && (
                                <polygon
                                  points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
                                  fill="url(#chartGrad)"
                                />
                              )}
                              {/* Spline path line */}
                              {points && (
                                <polyline
                                  fill="none"
                                  stroke="#7A8B6F"
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  points={points}
                                />
                              )}
                              {/* Data Nodes */}
                              {revData.map((d, i) => {
                                const x = padding + (i * (width - padding * 2) / 6);
                                const y = height - padding - (d.value / maxVal) * (height - padding * 2);
                                return (
                                  <g key={i} className="group/node">
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r="4.5"
                                      fill="#FDFBF7"
                                      stroke="#7A8B6F"
                                      strokeWidth="2.5"
                                    />
                                    {/* Tooltip on Hover */}
                                    <text
                                      x={x}
                                      y={y - 10}
                                      textAnchor="middle"
                                      className="text-[9px] font-bold fill-[#3A2E26] opacity-0 group-hover/node:opacity-100 transition-opacity bg-white"
                                    >
                                      ₹{Math.round(d.value)}
                                    </text>
                                    {/* Axis Labels */}
                                    <text
                                      x={x}
                                      y={height - 10}
                                      textAnchor="middle"
                                      className="text-[8px] font-bold fill-[#3A2E26]/50 uppercase tracking-wider"
                                    >
                                      {d.label}
                                    </text>
                                  </g>
                                );
                              })}
                            </svg>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Sales Channels Analysis (Online vs Offline) */}
                    <div className="bg-white p-6 rounded-3xl border border-[#3A2E26]/10 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#3A2E26]/70 border-b border-[#3A2E26]/10 pb-3 mb-4">
                          Sales Channels (Online vs Offline)
                        </h3>
                        <div className="flex flex-col gap-4 py-2">
                          {(() => {
                            const onlineOrders = orders.filter(o => !o.isOffline);
                            const offlineOrders = orders.filter(o => !!o.isOffline);

                            const onlineRev = onlineOrders.reduce((sum, o) => sum + (parseFloat(o.grandTotal) || 0), 0);
                            const offlineRev = offlineOrders.reduce((sum, o) => sum + (parseFloat(o.grandTotal) || 0), 0);
                            const totalRev = onlineRev + offlineRev || 1;

                            const onlinePct = Math.round((onlineRev / totalRev) * 100);
                            const offlinePct = Math.round((offlineRev / totalRev) * 100);

                            return (
                              <>
                                <div className="space-y-1 px-1">
                                  <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-[#3A2E26]/80 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-[#7A8B6F] inline-block"></span>
                                      Online Store
                                    </span>
                                    <span className="text-[#3A2E26]">{formatCurrency(onlineRev)} ({onlinePct}%)</span>
                                  </div>
                                  <div className="w-full bg-[#3A2E26]/5 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#7A8B6F] rounded-full transition-all duration-500" style={{ width: `${onlinePct}%` }}></div>
                                  </div>
                                </div>

                                <div className="space-y-1 px-1">
                                  <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-[#3A2E26]/80 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-[#C97C5D] inline-block"></span>
                                      Offline Orders
                                    </span>
                                    <span className="text-[#3A2E26]">{formatCurrency(offlineRev)} ({offlinePct}%)</span>
                                  </div>
                                  <div className="w-full bg-[#3A2E26]/5 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#C97C5D] rounded-full transition-all duration-500" style={{ width: `${offlinePct}%` }}></div>
                                  </div>
                                </div>

                                <div className="pt-2 mt-2 border-t border-[#3A2E26]/10 flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-[#3A2E26]/50">
                                  <div>
                                    <span>Online: </span>
                                    <span className="text-[#3A2E26]">{onlineOrders.length} orders</span>
                                  </div>
                                  <div>
                                    <span>Offline: </span>
                                    <span className="text-[#3A2E26]">{offlineOrders.length} orders</span>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Product Distribution Chart */}
                    <div className="bg-white p-6 rounded-3xl border border-[#3A2E26]/10 shadow-sm">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#3A2E26]/70 border-b border-[#3A2E26]/10 pb-3 mb-4">
                        Sales Distribution By Product Pack
                      </h3>
                      <div className="flex flex-col gap-4 py-3 justify-center h-full max-h-[180px] overflow-y-auto">
                        {(() => {
                          const distData = getProductDistributionData();
                          const totalItems = distData.reduce((sum, d) => sum + d.value, 0) || 1;
                          if (distData.length === 0) {
                            return <p className="text-xs text-[#3A2E26]/50 italic text-center">No items ordered yet.</p>;
                          }
                          return distData.map((d, i) => {
                            const pct = Math.round((d.value / totalItems) * 100);
                            const barColors = ["bg-[#7A8B6F]", "bg-[#C97C5D]", "bg-amber-500", "bg-[#3A2E26]"];
                            const color = barColors[i % barColors.length];
                            return (
                              <div key={i} className="space-y-1 px-1">
                                <div className="flex justify-between items-center text-xs font-bold">
                                  <span className="text-[#3A2E26]/80">{d.label}</span>
                                  <span className="text-[#3A2E26]">{d.value} Qty ({pct}%)</span>
                                </div>
                                <div className="w-full bg-[#3A2E26]/5 h-2.5 rounded-full overflow-hidden">
                                  <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Dual Column: Recent Orders & Recent Users */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Orders List */}
                    <div className="bg-white rounded-3xl border border-[#3A2E26]/10 shadow-sm p-6">
                      <div className="border-b border-[#3A2E26]/10 pb-3 mb-4 flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#3A2E26]/70">Recent Orders</h3>
                        <button onClick={() => setActiveTab('orders')} className="text-[10px] font-bold uppercase text-[#7A8B6F] hover:underline">View All</button>
                      </div>
                      {orders.length === 0 ? (
                        <p className="text-xs text-[#3A2E26]/60">No transaction data logged yet.</p>
                      ) : (
                        <div className="divide-y divide-[#3A2E26]/10">
                          {orders.slice(0, 5).map((order) => (
                            <div key={order._id} className="py-3 flex justify-between items-center flex-wrap gap-2 text-xs">
                              <div className="flex items-center gap-3">
                                <div className="bg-[#3A2E26]/5 p-2 rounded-xl text-[#3A2E26]/80">
                                  <Package className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-[#3A2E26]">{order.orderId}</p>
                                  <p className="text-[10px] text-[#3A2E26]/60 font-semibold">{order.shippingAddress?.fullName} &bull; {formatDate(order.created_at)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-[#3A2E26]">{formatCurrency(order.grandTotal)}</p>
                                <p className="text-[9px] uppercase tracking-widest text-[#7A8B6F] font-bold bg-[#7A8B6F]/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                  {order.paymentMethod}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Users List */}
                    <div className="bg-white rounded-3xl border border-[#3A2E26]/10 shadow-sm p-6">
                      <div className="border-b border-[#3A2E26]/10 pb-3 mb-4 flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[#3A2E26]/70">Recently Joined Customers</h3>
                        <button onClick={() => setActiveTab('customers')} className="text-[10px] font-bold uppercase text-[#7A8B6F] hover:underline">View All</button>
                      </div>
                      {recentUsers.length === 0 ? (
                        <p className="text-xs text-[#3A2E26]/60">No customer records logged yet.</p>
                      ) : (
                        <div className="divide-y divide-[#3A2E26]/10">
                          {recentUsers.map((user) => (
                            <div key={user.id} className="py-3 flex justify-between items-center flex-wrap gap-2 text-xs">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#C97C5D]/10 text-[#C97C5D] flex items-center justify-center font-bold">
                                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <p className="font-bold text-[#3A2E26]">{user.name}</p>
                                  <p className="text-[10px] text-[#3A2E26]/60 font-semibold">{user.email || user.mobile}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-[#3A2E26]/50 font-bold">{formatDate(user.created_at).split(',')[0]}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Orders */}
              {activeTab === 'orders' && (
                <div className="flex flex-col gap-6">
                  {/* Title & Filter Bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#3A2E26]/10 pb-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight uppercase text-[#3A2E26] font-sans">Order Management</h2>
                      <p className="text-xs text-[#3A2E26]/60">Track customer purchases and verify fulfillment details</p>
                    </div>
                    {/* Source Filters and Search Bar */}
                    <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                      <div className="flex bg-[#3A2E26]/5 p-1 rounded-xl border border-[#3A2E26]/10">
                        {['all', 'online', 'offline'].map((source) => (
                          <button
                            key={source}
                            onClick={() => setOrderSourceFilter(source)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              orderSourceFilter === source
                                ? 'bg-[#3A2E26] text-white shadow-sm'
                                : 'text-[#3A2E26]/60 hover:text-[#3A2E26]'
                            }`}
                          >
                            {source}
                          </button>
                        ))}
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-[#3A2E26]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text"
                          placeholder="Search ID, name or email..."
                          value={orderSearch}
                          onChange={(e) => setOrderSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-[#3A2E26]/10 rounded-2xl text-xs focus:outline-none focus:border-[#3A2E26] transition-all font-medium"
                        />
                      </div>
                      <button
                        onClick={handleOpenOfflineSaleModal}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#7A8B6F] hover:bg-[#68785c] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Log Offline Sale</span>
                      </button>
                    </div>
                  </div>

                  {/* Orders Data Table */}
                  <div className="bg-white rounded-3xl border border-[#3A2E26]/10 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#3A2E26]/5 border-b border-[#3A2E26]/10 text-[10px] font-bold uppercase tracking-widest text-[#3A2E26]/60">
                            <th className="p-4 pl-6">Order ID</th>
                            <th className="p-4">Customer Details</th>
                            <th className="p-4">Items Summary</th>
                            <th className="p-4">Payment Method</th>
                            <th className="p-4">Order Date</th>
                            <th className="p-4 pr-6 text-right">Total Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3A2E26]/10 text-xs">
                          {filteredOrders.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-[#3A2E26]/50">
                                No matching order records located.
                              </td>
                            </tr>
                          ) : (
                            filteredOrders.map((order) => (
                              <tr key={order._id} className="hover:bg-[#3A2E26]/5 transition-colors">
                                <td className="p-4 pl-6 align-top">
                                  <div className="flex flex-col gap-1">
                                    <span className="font-bold text-[#3A2E26]">{order.orderId}</span>
                                    {order.isOffline ? (
                                      <span className="text-[8px] font-bold uppercase tracking-wider text-amber-850 bg-amber-50 border border-amber-200/50 px-1.5 py-0.5 rounded-md inline-block w-fit">Offline</span>
                                    ) : (
                                      <span className="text-[8px] font-bold uppercase tracking-wider text-green-800 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md inline-block w-fit">Online</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 align-top">
                                  <div className="font-bold text-[#3A2E26]">{order.shippingAddress?.fullName}</div>
                                  <div className="text-[10px] text-[#3A2E26]/60 flex flex-col gap-1 mt-1 font-semibold">
                                    <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-[#C97C5D]" /> {order.shippingAddress?.email || 'No email'}</span>
                                    <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-[#C97C5D]" /> {order.shippingAddress?.phone}</span>
                                    <span className="flex items-start gap-1.5 mt-0.5"><MapPin className="w-3.5 h-3.5 text-[#C97C5D] shrink-0" /> {order.shippingAddress?.address}, {order.shippingAddress?.city} - {order.shippingAddress?.pincode}</span>
                                  </div>
                                  {order.notes && (
                                    <div className="text-[10px] text-amber-850 bg-amber-50/50 border border-amber-250/20 rounded-xl p-2.5 mt-2 font-medium">
                                      Note: {order.notes}
                                    </div>
                                  )}
                                </td>
                                <td className="p-4 align-top">
                                  <div className="flex flex-col gap-1.5">
                                    {order.cartItems?.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-2 bg-[#3A2E26]/5 p-1.5 rounded-xl border border-[#3A2E26]/10 text-[11px] font-bold text-[#3A2E26]">
                                        {item.image && (
                                          <img src={item.image} alt={item.title} className="w-7 h-7 object-cover rounded-lg border border-[#3A2E26]/10" />
                                        )}
                                        <div>
                                          <span>{item.title}</span>
                                          <span className="text-[#3A2E26]/50 ml-1">x{item.quantity}</span>
                                          {item.isSubscription && (
                                            <span className="ml-1 text-[9px] text-[#7A8B6F] font-bold bg-[#7A8B6F]/10 px-1 rounded-md">Sub</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4 align-top">
                                  <span className="inline-block px-2.5 py-1 bg-[#3A2E26]/5 text-[#3A2E26]/80 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#3A2E26]/10">
                                    {order.paymentMethod}
                                  </span>
                                </td>
                                <td className="p-4 align-top text-[10px] font-semibold text-[#3A2E26]/75">{formatDate(order.created_at)}</td>
                                <td className="p-4 pr-6 align-top text-right font-bold text-sm text-[#3A2E26]">
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#3A2E26]/10 pb-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight uppercase text-[#3A2E26] font-sans">Customer Accounts</h2>
                      <p className="text-xs text-[#3A2E26]/60">Explore registered user accounts and admin details</p>
                    </div>
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-[#3A2E26]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="Search name, email, or mobile..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#3A2E26]/10 rounded-2xl text-xs focus:outline-none focus:border-[#3A2E26] focus:ring-1 focus:ring-[#3A2E26]/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Customers Data Table */}
                  <div className="bg-white rounded-3xl border border-[#3A2E26]/10 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#3A2E26]/5 border-b border-[#3A2E26]/10 text-[10px] font-bold uppercase tracking-widest text-[#3A2E26]/60">
                            <th className="p-4 pl-6">Customer Name</th>
                            <th className="p-4">Email Address</th>
                            <th className="p-4">Mobile Number</th>
                            <th className="p-4">Role status</th>
                            <th className="p-4 pr-6">Account Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3A2E26]/10 text-xs">
                          {filteredCustomers.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="p-8 text-center text-[#3A2E26]/50">
                                No matching customer accounts located.
                              </td>
                            </tr>
                          ) : (
                            filteredCustomers.map((customer) => (
                              <tr key={customer.id} className="hover:bg-[#3A2E26]/5 transition-colors">
                                <td className="p-4 pl-6 font-bold text-[#3A2E26] flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-[#3A2E26] to-[#5A4E46] text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-sm">
                                    {customer.name?.slice(0, 2) || 'M'}
                                  </div>
                                  <span>{customer.name || 'Anonymous Member'}</span>
                                </td>
                                <td className="p-4 font-semibold text-[#3A2E26]/80">{customer.email || 'N/A'}</td>
                                <td className="p-4 font-semibold text-[#3A2E26]/80">{customer.mobile || 'N/A'}</td>
                                <td className="p-4">
                                  {customer.is_admin ? (
                                    <span className="inline-block px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-bold">
                                      Administrator
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2.5 py-0.5 bg-[#3A2E26]/5 text-[#3A2E26]/75 border border-[#3A2E26]/10 rounded-full text-[10px] font-bold">
                                      Customer
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 pr-6 text-[10px] font-semibold text-[#3A2E26]/75">{formatDate(customer.created_at)}</td>
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#3A2E26]/10 pb-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight uppercase text-[#3A2E26] font-sans">Product Inventory</h2>
                      <p className="text-xs text-[#3A2E26]/60">Add, edit, or remove soap pack options and manage stock levels</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-[#3A2E26]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text"
                          placeholder="Search products..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-[#3A2E26]/10 rounded-2xl text-xs focus:outline-none focus:border-[#3A2E26] transition-all font-medium"
                        />
                      </div>
                      <button
                        onClick={handleOpenAddProduct}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#7A8B6F] hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm shrink-0 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Product</span>
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const lowStockList = products.filter(p => p.stock !== undefined && p.stock <= 10);
                    if (lowStockList.length > 0) {
                      return (
                        <div className="bg-red-50 border border-red-200 rounded-3xl p-4 flex items-center gap-3 text-xs text-red-800 font-semibold animate-pulse">
                          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                          <div>
                            Inventory Warning: There are {lowStockList.length} product(s) with low or out of stock levels (10 or fewer bars left). Please restock soon.
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="bg-white rounded-3xl border border-[#3A2E26]/10 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#3A2E26]/5 border-b border-[#3A2E26]/10 text-[10px] font-bold uppercase tracking-widest text-[#3A2E26]/60">
                            <th className="p-4 pl-6">Product Details</th>
                            <th className="p-4">Size Count</th>
                            <th className="p-4">Base Price</th>
                            <th className="p-4">Promo Badges</th>
                            <th className="p-4">Stock Status</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3A2E26]/10 text-xs">
                          {filteredProducts.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="p-8 text-center text-[#3A2E26]/50">
                                No product pack records located. Click "Add Product" to create one.
                              </td>
                            </tr>
                          ) : (
                            filteredProducts.map((p) => {
                              const isLowStock = p.stock !== undefined && p.stock > 0 && p.stock <= 10;
                              const isOut = p.stock !== undefined && p.stock <= 0;
                              return (
                                <tr key={p.id} className="hover:bg-[#3A2E26]/5 transition-colors">
                                  <td className="p-4 pl-6 align-middle font-bold text-[#3A2E26]">
                                    <div className="flex items-center gap-3">
                                      <img 
                                        src={p.image || '/images/pack-single.png'} 
                                        alt={p.title} 
                                        className="w-12 h-12 object-cover rounded-xl border border-[#3A2E26]/10"
                                        onError={(e) => { e.target.src = '/images/pack-single.png'; }}
                                      />
                                      <div className="flex flex-col">
                                        <span>{p.title}</span>
                                        <span className="text-[10px] text-gray-400 font-mono tracking-wider">ID: {p.id}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 align-middle font-semibold text-[#3A2E26]/80">{p.count} {p.count === 1 ? 'bar' : 'bars'}</td>
                                  <td className="p-4 align-middle font-bold text-[#3A2E26]">{formatCurrency(p.basePrice)}</td>
                                  <td className="p-4 align-middle">
                                    <div className="flex flex-wrap gap-1">
                                      {p.savingsBadge && (
                                        <span className="px-2.5 py-0.5 bg-[#C97C5D]/10 text-[#C97C5D] border border-[#C97C5D]/20 rounded-md text-[9px] font-bold uppercase tracking-wider">{p.savingsBadge}</span>
                                      )}
                                      {p.popular && (
                                        <span className="px-2.5 py-0.5 bg-[#7A8B6F]/10 text-[#7A8B6F] border border-[#7A8B6F]/20 rounded-md text-[9px] font-bold uppercase tracking-wider">Popular</span>
                                      )}
                                      {p.bestValue && (
                                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[9px] font-bold uppercase tracking-wider">Best Value</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4 align-middle">
                                    {isOut ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold animate-pulse">
                                        <AlertCircle className="w-3 h-3" /> Out of Stock
                                      </span>
                                    ) : isLowStock ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#C97C5D]/10 text-[#C97C5D] border border-[#C97C5D]/20 rounded-full text-[10px] font-bold">
                                        <AlertCircle className="w-3 h-3" /> Low Stock ({p.stock})
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold">
                                        In Stock ({p.stock})
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 align-middle">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleProductActive(p)}
                                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        p.active !== false ? 'bg-[#7A8B6F]' : 'bg-gray-200'
                                      }`}
                                      title={p.active !== false ? "Click to Deactivate" : "Click to Activate"}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
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
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#3A2E26]/10 pb-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight uppercase text-[#3A2E26] font-sans">Coupons & Offer Discounts</h2>
                      <p className="text-xs text-[#3A2E26]/60">Maintain promo codes and update customer discount percentages</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 text-[#3A2E26]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text"
                          placeholder="Search coupons..."
                          value={couponSearch}
                          onChange={(e) => setCouponSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-[#3A2E26]/10 rounded-2xl text-xs focus:outline-none focus:border-[#3A2E26] transition-colors font-medium"
                        />
                      </div>
                      <button
                        onClick={handleOpenAddCoupon}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#7A8B6F] hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm shrink-0 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Coupon</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#3A2E26]/10 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#3A2E26]/5 border-b border-[#3A2E26]/10 text-[10px] font-bold uppercase tracking-widest text-[#3A2E26]/60">
                            <th className="p-4 pl-6">Coupon Code</th>
                            <th className="p-4">Discount Rate</th>
                            <th className="p-4">Offer Description</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3A2E26]/10 text-xs">
                          {filteredCoupons.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="p-8 text-center text-[#3A2E26]/50">
                                No active coupons located. Click "Add Coupon" to create one.
                              </td>
                            </tr>
                          ) : (
                            filteredCoupons.map((c) => (
                              <tr key={c.code} className="hover:bg-[#3A2E26]/5 transition-colors">
                                <td className="p-4 pl-6 align-middle font-bold text-[#3A2E26] font-mono tracking-wider">{c.code}</td>
                                <td className="p-4 align-middle font-bold text-green-700 font-mono">{(c.discount * 100).toFixed(0)}% Off</td>
                                <td className="p-4 align-middle font-medium text-gray-600">{c.description || 'No description provided'}</td>
                                <td className="p-4 align-middle">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCouponActive(c)}
                                    className="relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                                    style={{ backgroundColor: c.active ? '#7A8B6F' : '#E5E7EB' }}
                                    title={c.active ? "Click to Deactivate" : "Click to Activate"}
                                  >
                                    <span
                                      className="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out"
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
                 <div className="flex flex-col lg:flex-row gap-8 items-start w-full animate-fadeIn">
                   {/* Left Column: Form */}
                   <form onSubmit={handleSaveSettings} className={`space-y-6 text-[#3A2E26] shrink-0 transition-all duration-300 ${previewDevice === 'pc' ? 'w-full lg:w-[35%]' : 'w-full lg:w-[50%]'}`}>
                     <div className="flex flex-col gap-1 border-b border-[#3A2E26]/10 pb-4">
                       <h2 className="text-xl font-bold tracking-tight uppercase text-[#3A2E26] font-sans">Site Settings</h2>
                       <p className="text-xs text-[#3A2E26]/60">Customize storefront content.</p>
                     </div>

                     {settingsSubTab === 'identity' && (
                       <>

                  {/* Brand Logo Settings */}
                  <div className="bg-white rounded-3xl p-6 border border-[#3A2E26]/10 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#3A2E26]/70 border-b border-[#3A2E26]/10 pb-2">Brand Identity & Logo</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <ImageUploader
                          label="Brand Logo Image"
                          value={settingsForm.logo_url}
                          onChange={(url) => setSettingsForm({ ...settingsForm, logo_url: url })}
                          showNotification={showNotification}
                          isSaving={saving}
                          setIsSaving={setSaving}
                        />
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
                </>
              )}

              {settingsSubTab === 'hero' && (
                <>
                  {/* Hero Section Settings */}
                  <div className="bg-white rounded-3xl p-6 border border-[#3A2E26]/10 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#3A2E26]/70 border-b border-[#3A2E26]/10 pb-2">Hero Section</h3>
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
                      <div className="md:col-span-2">
                        <ImageUploader
                          label="Hero Image"
                          value={settingsForm.hero.image_url || ''}
                          onChange={(url) => setSettingsForm({
                            ...settingsForm,
                            hero: { ...settingsForm.hero, image_url: url }
                          })}
                          showNotification={showNotification}
                          isSaving={saving}
                          setIsSaving={setSaving}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {settingsSubTab === 'story' && (
                <>
                  {/* Story Section Settings */}
                  <div className="bg-white rounded-3xl p-6 border border-[#3A2E26]/10 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#3A2E26]/70 border-b border-[#3A2E26]/10 pb-2">Heritage Story</h3>
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
                        <ImageUploader
                          label="Story Image"
                          value={settingsForm.story.image_url || ''}
                          onChange={(url) => setSettingsForm({
                            ...settingsForm,
                            story: { ...settingsForm.story, image_url: url }
                          })}
                          showNotification={showNotification}
                          isSaving={saving}
                          setIsSaving={setSaving}
                        />
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
                </>
              )}

              {settingsSubTab === 'contact' && (
                <>
                  {/* Contact / Footer Details */}
                  <div className="bg-white rounded-3xl p-6 border border-[#3A2E26]/10 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#3A2E26]/70 border-b border-[#3A2E26]/10 pb-2">Customer Care & Footer Contact</h3>
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
                </>
              )}

              {settingsSubTab === 'subscription' && (
                <>
                  {/* Subscribe & Save Section Settings */}
                  <div className="bg-white rounded-3xl p-6 border border-[#3A2E26]/10 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#3A2E26]/70 border-b border-[#3A2E26]/10 pb-2">Subscribe & Save Banner</h3>
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
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Global Subscription Discount Percentage (%)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          step="0.5"
                          value={settingsForm.subscription_discount_pct !== undefined ? settingsForm.subscription_discount_pct : 15}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            subscription_discount_pct: parseFloat(e.target.value) || 0
                          })}
                          className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Subscription Settings Configurations */}
                  <div className="bg-white rounded-3xl p-6 border border-[#3A2E26]/10 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#3A2E26]/70 border-b border-[#3A2E26]/10 pb-2">Subscription System Configuration</h3>
                    
                    <div className="space-y-4">
                      {/* Subscription Active Toggle */}
                      <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsForm.subscription_active !== false}
                          onChange={(e) => setSettingsForm({
                            ...settingsForm,
                            subscription_active: e.target.checked
                          })}
                          className="w-4 h-4 text-[#7A8B6F] border-gray-300 rounded focus:ring-[#7A8B6F]"
                        />
                        <span>Enable Subscription System storefront-wide</span>
                      </label>

                      {/* Durations (Months) */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70">
                          Subscription Plan Durations (Select Months)
                        </label>
                        <div className="flex flex-wrap gap-2 items-center">
                          {(() => {
                            const allD = Array.from(new Set([3, 6, 12, ...(settingsForm.subscription_durations || [])])).sort((a, b) => a - b);
                            return allD.map(m => {
                              const active = (settingsForm.subscription_durations || []).includes(m);
                              return (
                                <button
                                  type="button"
                                  key={m}
                                  onClick={() => {
                                    const current = settingsForm.subscription_durations || [];
                                    const next = active ? current.filter(x => x !== m) : [...current, m];
                                    setSettingsForm({ ...settingsForm, subscription_durations: next.sort((a, b) => a - b) });
                                  }}
                                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                                    active 
                                      ? 'bg-[#3A2E26] text-white border-[#3A2E26] shadow-sm' 
                                      : 'bg-[#FDFBF7] text-[#3A2E26] border-[#E6D5C3]/50 hover:bg-[#3A2E26]/5'
                                  }`}
                                >
                                  {m} Months
                                </button>
                              );
                            });
                          })()}

                          {/* Inline manual addition input */}
                          <div className="flex items-center gap-1.5 ml-1 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl px-3 py-1.5">
                            <input
                              type="number"
                              min="1"
                              placeholder="Add custom months..."
                              value={customDuration}
                              onChange={(e) => setCustomDuration(e.target.value)}
                              className="w-20 text-xs font-bold bg-transparent border-none focus:outline-none text-[#3A2E26]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = parseInt(customDuration);
                                if (!val || val <= 0) return;
                                const current = settingsForm.subscription_durations || [];
                                if (!current.includes(val)) {
                                  setSettingsForm({
                                    ...settingsForm,
                                    subscription_durations: [...current, val].sort((a, b) => a - b)
                                  });
                                }
                                setCustomDuration('');
                              }}
                              className="text-[10px] font-bold text-[#7A8B6F] hover:underline uppercase tracking-wider cursor-pointer border-none bg-transparent"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>


                      {/* Frequencies (delivery cycle) */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70">
                          Active Delivery Frequencies Options (Select Cycles)
                        </label>
                        <div className="flex flex-wrap gap-2 items-center">
                          {(() => {
                            const allF = Array.from(new Set(['monthly', 'every_3_months', ...(settingsForm.subscription_frequencies || [])]));
                            return allF.map(f => {
                              const active = (settingsForm.subscription_frequencies || []).includes(f);
                              
                              let label = f === 'monthly' ? 'Every Month' : 'Every 3 Months';
                              if (f !== 'monthly' && f !== 'every_3_months') {
                                label = f.split('_')
                                  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                                  .join(' ');
                              }

                              return (
                                <button
                                  type="button"
                                  key={f}
                                  onClick={() => {
                                    const current = settingsForm.subscription_frequencies || [];
                                    const next = active ? current.filter(x => x !== f) : [...current, f];
                                    setSettingsForm({ ...settingsForm, subscription_frequencies: next });
                                  }}
                                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                                    active 
                                      ? 'bg-[#3A2E26] text-white border-[#3A2E26] shadow-sm' 
                                      : 'bg-[#FDFBF7] text-[#3A2E26] border-[#E6D5C3]/50 hover:bg-[#3A2E26]/5'
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            });
                          })()}

                          {/* Inline manual frequency addition */}
                          <div className="flex items-center gap-1.5 ml-1 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl px-3 py-1.5">
                            <span className="text-xs text-[#3A2E26]/60">Every</span>
                            <input
                              type="number"
                              min="1"
                              max="12"
                              placeholder="Months"
                              value={customFreq}
                              onChange={(e) => setCustomFreq(e.target.value)}
                              className="w-12 text-xs font-bold bg-transparent border-none focus:outline-none text-[#3A2E26] text-center"
                            />
                            <span className="text-xs text-[#3A2E26]/60">Months</span>
                            <button
                              type="button"
                              onClick={() => {
                                const val = parseInt(customFreq);
                                if (!val || val <= 0) return;
                                const freqKey = val === 1 ? 'monthly' : `every_${val}_months`;
                                const current = settingsForm.subscription_frequencies || [];
                                if (!current.includes(freqKey)) {
                                  setSettingsForm({
                                    ...settingsForm,
                                    subscription_frequencies: [...current, freqKey]
                                  });
                                }
                                setCustomFreq('');
                              }}
                              className="text-[10px] font-bold text-[#7A8B6F] hover:underline uppercase tracking-wider cursor-pointer border-none bg-transparent"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </>
              )}

              {settingsSubTab === 'faqs' && (
                <>
                  {/* Frequently Asked Questions (FAQ) Settings */}
                  <div className="bg-white rounded-3xl p-6 border border-[#3A2E26]/10 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-[#3A2E26]/10 pb-2 flex-wrap gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#3A2E26]/70">Frequently Asked Questions (FAQ)</h3>
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
                </>
              )}

              {settingsSubTab === 'ingredients' && (
                <>
                  {/* Ingredients Editor */}
                  <div className="bg-white rounded-3xl p-6 border border-[#3A2E26]/10 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-[#3A2E26]/10 pb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold">Ingredients List</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={settingsForm.ingredients_active}
                            onChange={(e) => setSettingsForm({ ...settingsForm, ingredients_active: e.target.checked })}
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7A8B6F]"></div>
                          <span className="ml-2 text-xs font-bold text-[#3A2E26]/70 uppercase tracking-wide">
                            {settingsForm.ingredients_active ? 'Active' : 'Deactive'}
                          </span>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const current = settingsForm.ingredients || [];
                          setSettingsForm({
                            ...settingsForm,
                            ingredients: [...current, { name: '', benefit: '', icon: 'Sparkles' }]
                          });
                        }}
                        className="px-3.5 py-1.5 bg-[#7A8B6F] hover:bg-[#68785c] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Ingredient
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(!settingsForm.ingredients || settingsForm.ingredients.length === 0) ? (
                        <p className="text-xs text-[#3A2E26]/60 italic py-2">No ingredients defined. Default storefront ingredients will be shown.</p>
                      ) : (
                        settingsForm.ingredients.map((ing, idx) => (
                          <div key={idx} className="p-4 bg-[#FDFBF7] border border-[#E6D5C3]/30 rounded-2xl space-y-3 relative group">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-[#8C7A5B] uppercase tracking-wider">Ingredient #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...settingsForm.ingredients];
                                  updated.splice(idx, 1);
                                  setSettingsForm({ ...settingsForm, ingredients: updated });
                                }}
                                className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#3A2E26]/50 mb-1">Name</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Pure Kashmiri Kesar"
                                  required
                                  value={ing.name}
                                  onChange={(e) => {
                                    const updated = [...settingsForm.ingredients];
                                    updated[idx] = { ...updated[idx], name: e.target.value };
                                    setSettingsForm({ ...settingsForm, ingredients: updated });
                                  }}
                                  className="w-full px-4 py-2 bg-white border border-[#E6D5C3]/40 rounded-xl text-sm focus:outline-none focus:border-[#3A2E26] font-bold text-[#3A2E26]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#3A2E26]/50 mb-1">Icon</label>
                                <select
                                  value={ing.icon || 'Sparkles'}
                                  onChange={(e) => {
                                    const updated = [...settingsForm.ingredients];
                                    updated[idx] = { ...updated[idx], icon: e.target.value };
                                    setSettingsForm({ ...settingsForm, ingredients: updated });
                                  }}
                                  className="w-full px-4 py-2 bg-white border border-[#E6D5C3]/40 rounded-xl text-sm focus:outline-none focus:border-[#3A2E26]"
                                >
                                  <option value="Sparkles">✨ Sparkles</option>
                                  <option value="HeartHandshake">🤝 Heart</option>
                                  <option value="Flower2">🌸 Flower</option>
                                  <option value="Droplets">💧 Droplets</option>
                                  <option value="Leaf">🍃 Leaf</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#3A2E26]/50 mb-1">Benefit Description</label>
                              <textarea
                                placeholder="Describe the ingredient benefit..."
                                required
                                rows="2"
                                value={ing.benefit}
                                onChange={(e) => {
                                  const updated = [...settingsForm.ingredients];
                                  updated[idx] = { ...updated[idx], benefit: e.target.value };
                                  setSettingsForm({ ...settingsForm, ingredients: updated });
                                }}
                                className="w-full px-4 py-2.5 bg-white border border-[#E6D5C3]/40 rounded-xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
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

                {/* Right Column: Live Storefront Mock Preview (only rendered if NOT fullscreen) */}
                {!previewFullscreen && (
                  <div className={`hidden lg:block sticky top-24 self-start bg-white p-6 rounded-3xl border border-[#3A2E26]/10 shadow-sm shrink-0 transition-all duration-300 ${previewDevice === 'pc' ? 'lg:w-[62%]' : 'lg:w-[48%]'}`}>
                    <div className="flex justify-between items-center border-b border-[#3A2E26]/10 pb-3 mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#3A2E26]/50">Live Storefront Preview</span>
                      
                      <div className="flex items-center gap-3">
                        {/* Device Viewport Toggle Buttons */}
                        <div className="flex bg-[#3A2E26]/5 p-0.5 rounded-lg border border-[#3A2E26]/5">
                          {[
                            { id: 'pc', label: 'PC / Desktop' },
                            { id: 'tablet', label: 'Tablet' },
                            { id: 'mobile', label: 'Mobile' }
                          ].map((device) => (
                            <button
                              key={device.id}
                              type="button"
                              onClick={() => setPreviewDevice(device.id)}
                              className={`px-2.5 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                previewDevice === device.id
                                  ? 'bg-[#3A2E26] text-white shadow-sm'
                                  : 'text-[#3A2E26]/60 hover:text-[#3A2E26]'
                              }`}
                            >
                              {device.label}
                            </button>
                          ))}
                        </div>

                        {/* Fullscreen Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setPreviewFullscreen(true)}
                          className="p-1.5 text-[#3A2E26]/60 hover:text-[#3A2E26] hover:bg-[#3A2E26]/5 rounded-lg transition-all cursor-pointer border border-[#3A2E26]/10"
                          title="Fullscreen Preview"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Mockup Sizing Wrapper */}
                    <div 
                      className="border border-[#3A2E26]/10 rounded-2xl bg-white shadow-lg overflow-hidden flex flex-col h-[560px] transition-all duration-300"
                      style={{
                        width: previewDevice === 'pc' ? '100%' : previewDevice === 'tablet' ? '420px' : '320px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                      }}
                    >
                      {/* Mock Browser Titlebar */}
                      <div className="bg-[#3A2E26]/5 border-b border-[#3A2E26]/10 px-4 py-2 flex items-center justify-between">
                        <div className="flex gap-1.5 shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                        </div>
                        <div className="bg-white px-6 py-0.5 rounded-lg border border-[#3A2E26]/5 text-[9px] text-gray-400 font-medium select-none font-mono tracking-wide truncate max-w-[160px]">
                          localhost:5173
                        </div>
                        <div className="w-10"></div>
                      </div>
                      
                      {/* Real Storefront Live preview in iframe */}
                      <div className="flex-1 bg-[#FDFBF7] relative">
                        <iframe 
                          key={settingsSubTab}
                          src={`/?preview=true#${settingsSubTab}`} 
                          className="w-full h-full border-none"
                          title="Live Storefront Preview Frame"
                          id="preview-storefront-frame"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

              {activeTab === 'reviews' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#3A2E26]/10 pb-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight uppercase text-[#3A2E26] font-sans">Reviews Moderation</h2>
                      <p className="text-xs text-[#3A2E26]/60">Approve or reject customer-submitted reviews for the storefront</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-[#3A2E26]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="Search reviews..."
                        value={reviewSearch}
                        onChange={(e) => setReviewSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-[#3A2E26]/10 rounded-2xl text-xs focus:outline-none focus:border-[#3A2E26] transition-colors font-medium"
                      />
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#3A2E26]/10 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#3A2E26]/5 border-b border-[#3A2E26]/10 text-[10px] font-bold uppercase tracking-widest text-[#3A2E26]/60">
                            <th className="p-4 pl-6">Customer</th>
                            <th className="p-4">Product</th>
                            <th className="p-4">Rating</th>
                            <th className="p-4">Comment</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3A2E26]/10 text-xs">
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
                                <tr key={r.id || r._id} className="hover:bg-[#3A2E26]/5 transition-colors">
                                  <td className="p-4 pl-6 align-middle font-bold text-[#3A2E26]">
                                    <div>{r.userName}</div>
                                    <div className="text-[10px] font-semibold text-gray-400 font-mono mt-0.5">{r.userEmail}</div>
                                  </td>
                                  <td className="p-4 align-middle font-bold text-gray-700">{r.productTitle}</td>
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
                                      <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        Approved
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 pr-6 align-middle text-right">
                                    <div className="flex justify-end items-center gap-2">
                                      {!r.approved && (
                                        <button
                                          onClick={() => handleApproveReview(r.id || r._id)}
                                          className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
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

              {/* Tab: Subscriptions */}
              {activeTab === 'subscriptions' && (
                <div className="flex flex-col gap-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#3A2E26]/10 pb-4">
                    <div>
                      <h2 className="text-xl font-bold tracking-tight uppercase text-[#3A2E26] font-sans">Subscriptions Manager</h2>
                      <p className="text-xs text-[#3A2E26]/60">Manage customer soap recurring orders and check schedules</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-[#3A2E26]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="Search subscriptions..."
                        value={subSearch}
                        onChange={(e) => setSubSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-[#3A2E26]/10 rounded-2xl text-xs focus:outline-none focus:border-[#3A2E26] transition-colors font-medium"
                      />
                    </div>
                  </div>

                  {/* Stats Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-[#3A2E26]/10 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-300">
                      <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#3A2E26]/50 uppercase tracking-widest">Active Subscriptions</p>
                        <h3 className="text-xl font-bold tracking-tight text-[#3A2E26] mt-1">
                          {subscriptions.filter(s => s.status === 'active').length}
                        </h3>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-[#3A2E26]/10 shadow-sm flex items-center gap-5 hover:shadow-md transition-all duration-300">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#3A2E26]/50 uppercase tracking-widest">Paused Subscriptions</p>
                        <h3 className="text-xl font-bold tracking-tight text-[#3A2E26] mt-1">
                          {subscriptions.filter(s => s.status === 'paused').length}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Subscriptions Data Table */}
                  <div className="bg-white rounded-3xl border border-[#3A2E26]/10 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#3A2E26]/5 border-b border-[#3A2E26]/10 text-[10px] font-bold uppercase tracking-widest text-[#3A2E26]/60">
                            <th className="p-4 pl-6">Order / Sub ID</th>
                            <th className="p-4">Customer Details</th>
                            <th className="p-4">Soap Pack Size</th>
                            <th className="p-4">Cycle Frequency</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Next Delivery</th>
                            <th className="p-4 pr-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3A2E26]/10 text-xs">
                          {(() => {
                            const filtered = subscriptions.filter(sub => {
                              const sLower = subSearch.toLowerCase();
                              return (
                                sub.subscriptionId?.toLowerCase().includes(sLower) ||
                                sub.customerName?.toLowerCase().includes(sLower) ||
                                sub.customerEmail?.toLowerCase().includes(sLower) ||
                                sub.user_email?.toLowerCase().includes(sLower) ||
                                sub.customerPhone?.toLowerCase().includes(sLower)
                              );
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan="7" className="p-8 text-center text-[#3A2E26]/50 font-medium">
                                    No matching subscription records found.
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((sub, idx) => {
                              let nextDelivery = 'N/A';
                              if (sub.next_delivery_date && sub.status === 'active') {
                                try {
                                  const date = new Date(sub.next_delivery_date);
                                  nextDelivery = date.toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  });
                                } catch {
                                  nextDelivery = 'Next Cycle';
                                }
                              } else if (sub.status === 'paused') {
                                nextDelivery = 'Paused';
                              } else if (sub.status === 'completed') {
                                nextDelivery = 'Completed';
                              }

                              return (
                                <tr key={idx} className="hover:bg-[#3A2E26]/5 transition-colors">
                                  <td className="p-4 pl-6 align-middle font-bold text-[#3A2E26]">{sub.subscriptionId}</td>
                                  <td className="p-4 align-middle">
                                    <div className="font-bold text-[#3A2E26]">{sub.customerName}</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">{sub.customerEmail || sub.user_email} &bull; {sub.customerPhone}</div>
                                  </td>
                                  <td className="p-4 align-middle font-bold text-gray-700">{sub.soapsPerMonth} Soaps/Month ({sub.durationMonths} Mo.)</td>
                                  <td className="p-4 align-middle uppercase font-bold text-[10px] text-amber-700 tracking-wider">
                                    {sub.deliveryFrequency === 'every_3_months' ? 'Every 3 Months' : 'Every Month'}
                                  </td>
                                  <td className="p-4 align-middle">
                                    {sub.status === 'active' ? (
                                      <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        Active
                                      </span>
                                    ) : sub.status === 'paused' ? (
                                      <span className="px-2.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        Paused
                                      </span>
                                    ) : sub.status === 'completed' ? (
                                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        Completed
                                      </span>
                                    ) : (
                                      <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        Cancelled
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 align-middle font-semibold text-gray-500">
                                    {nextDelivery}
                                    <div className="text-[10px] text-gray-400 mt-0.5">Remaining: {sub.remaining_deliveries}/{sub.total_deliveries}</div>
                                  </td>
                                  <td className="p-4 pr-6 align-middle text-right">
                                    <div className="flex justify-end items-center gap-2">
                                      {sub.status === 'active' && (
                                        <button
                                          onClick={() => handleUpdateSubscriptionStatus(sub.subscriptionId, 'paused')}
                                          className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                        >
                                          Pause
                                        </button>
                                      )}
                                      {sub.status === 'paused' && (
                                        <button
                                          onClick={() => handleUpdateSubscriptionStatus(sub.subscriptionId, 'active')}
                                          className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                        >
                                          Resume
                                        </button>
                                      )}
                                      {sub.status !== 'cancelled' && sub.status !== 'completed' && (
                                        <button
                                          onClick={() => handleUpdateSubscriptionStatus(sub.subscriptionId, 'cancelled')}
                                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
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
                <ImageUploader
                  label="Product Image"
                  value={productForm.image}
                  onChange={(url) => setProductForm({ ...productForm, image: url })}
                  showNotification={showNotification}
                  isSaving={saving}
                  setIsSaving={setSaving}
                />
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
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Coupon Type</label>
                <select
                  value={couponForm.type || 'percentage'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCouponForm({
                      ...couponForm,
                      type: val,
                      discount: val === 'free_shipping' ? 0 : 15
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                >
                  <option value="percentage">Percentage Discount</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>

              {couponForm.type !== 'free_shipping' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5">Discount Rate (1% to 100%)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    step="1"
                    placeholder="e.g. 15 for 15% off"
                    value={couponForm.discount}
                    onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26]"
                  />
                  <span className="text-[10px] text-green-700 font-bold block mt-1">Calculated value: {parseFloat(couponForm.discount || 0)}% off total price</span>
                </div>
              )}

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

      {/* Log Offline Sale Modal */}
      {isOfflineSaleModalOpen && (
        <div className="fixed inset-0 bg-[#3A2E26]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#E6D5C3]/40 shadow-2xl relative animate-scaleUp max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-2 text-[#3A2E26]">Log Offline Sale</h3>
            <p className="text-xs text-[#3A2E26]/60 mb-6">Enter details of the offline transaction. This will update the revenue and sales metrics but will NOT deduct from online inventory stock.</p>

            <form onSubmit={handleSaveOfflineSale} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5 font-sans">Customer Name *</label>
                  <input
                    required
                    type="text"
                    value={offlineSaleForm.customerName}
                    onChange={(e) => setOfflineSaleForm({ ...offlineSaleForm, customerName: e.target.value })}
                    placeholder="Customer Name"
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5 font-sans">Customer Phone *</label>
                  <input
                    required
                    type="text"
                    value={offlineSaleForm.customerPhone}
                    onChange={(e) => setOfflineSaleForm({ ...offlineSaleForm, customerPhone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5 font-sans">Customer Email (Optional)</label>
                <input
                  type="email"
                  value={offlineSaleForm.customerEmail}
                  onChange={(e) => setOfflineSaleForm({ ...offlineSaleForm, customerEmail: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5 font-sans">Number of Soaps *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={offlineSaleForm.quantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 1;
                      const price = offlineSaleForm.pricePerSoap || 299;
                      setOfflineSaleForm({
                        ...offlineSaleForm,
                        quantity: qty,
                        totalPrice: price * qty
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5 font-sans">Price Per Soap (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={offlineSaleForm.pricePerSoap || ''}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      setOfflineSaleForm({
                        ...offlineSaleForm,
                        pricePerSoap: price,
                        totalPrice: price * offlineSaleForm.quantity
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5 font-sans">Total Price (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={offlineSaleForm.totalPrice}
                    onChange={(e) => setOfflineSaleForm({ ...offlineSaleForm, totalPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5 font-sans">Payment Method *</label>
                  <select
                    value={offlineSaleForm.paymentMethod}
                    onChange={(e) => setOfflineSaleForm({ ...offlineSaleForm, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5 font-sans">Sale Date (Optional)</label>
                  <input
                    type="date"
                    value={offlineSaleForm.created_at}
                    onChange={(e) => setOfflineSaleForm({ ...offlineSaleForm, created_at: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#3A2E26]/70 mb-1.5 font-sans">Notes / Details</label>
                <textarea
                  rows="2"
                  value={offlineSaleForm.notes}
                  onChange={(e) => setOfflineSaleForm({ ...offlineSaleForm, notes: e.target.value })}
                  placeholder="E.g. Sold at local market event"
                  className="w-full px-4 py-2.5 bg-[#FDFBF7] border border-[#E6D5C3]/50 rounded-2xl text-sm focus:outline-none focus:border-[#3A2E26] font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOfflineSaleModalOpen(false)}
                  className="px-5 py-2.5 border border-[#E6D5C3] hover:bg-gray-50 text-[#3A2E26] font-bold text-sm rounded-2xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#7A8B6F] hover:bg-[#68785c] text-white font-bold text-sm rounded-2xl shadow-sm transition-colors cursor-pointer flex items-center justify-center min-w-[5rem]"
                >
                  {saving ? 'Logging...' : 'Log Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Preview Overlay */}
      {previewFullscreen && (
        <>
          <div className="fixed inset-0 bg-[#3A2E26]/50 backdrop-blur-xs z-[9999] transition-all duration-300 animate-fadeIn" onClick={() => setPreviewFullscreen(false)} />
          <div className="fixed inset-4 md:inset-8 z-[10000] bg-[#FDFBF7] p-6 rounded-3xl border border-[#3A2E26]/10 shadow-2xl flex flex-col animate-scaleUp">
            <div className="flex justify-between items-center border-b border-[#3A2E26]/10 pb-3 mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#3A2E26]/50">Live Storefront Preview</span>
              
              <div className="flex items-center gap-3">
                {/* Device Viewport Toggle Buttons */}
                <div className="flex bg-[#3A2E26]/5 p-0.5 rounded-lg border border-[#3A2E26]/5">
                  {[
                    { id: 'pc', label: 'PC / Desktop' },
                    { id: 'tablet', label: 'Tablet' },
                    { id: 'mobile', label: 'Mobile' }
                  ].map((device) => (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => setPreviewDevice(device.id)}
                      className={`px-2.5 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        previewDevice === device.id
                          ? 'bg-[#3A2E26] text-white shadow-sm'
                          : 'text-[#3A2E26]/60 hover:text-[#3A2E26]'
                      }`}
                    >
                      {device.label}
                    </button>
                  ))}
                </div>

                {/* Exit Fullscreen Toggle Button */}
                <button
                  type="button"
                  onClick={() => setPreviewFullscreen(false)}
                  className="p-1.5 text-[#3A2E26]/60 hover:text-[#3A2E26] hover:bg-[#3A2E26]/5 rounded-lg transition-all cursor-pointer border border-[#3A2E26]/10"
                  title="Exit Fullscreen"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Dynamic Mockup Sizing Wrapper */}
            <div 
              className="border border-[#3A2E26]/10 rounded-2xl bg-white shadow-lg overflow-hidden flex flex-col flex-1 transition-all duration-300"
              style={{
                width: previewDevice === 'pc' ? '100%' : previewDevice === 'tablet' ? '420px' : '320px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            >
              {/* Mock Browser Titlebar */}
              <div className="bg-[#3A2E26]/5 border-b border-[#3A2E26]/10 px-4 py-2 flex items-center justify-between">
                <div className="flex gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                </div>
                <div className="bg-white px-6 py-0.5 rounded-lg border border-[#3A2E26]/5 text-[9px] text-gray-400 font-medium select-none font-mono tracking-wide truncate max-w-[160px]">
                  localhost:5173
                </div>
                <div className="w-10"></div>
              </div>
              
              {/* Real Storefront Live preview in iframe */}
              <div className="flex-1 bg-[#FDFBF7] relative">
                <iframe 
                  key={settingsSubTab}
                  src={`/?preview=true#${settingsSubTab}`} 
                  className="w-full h-full border-none"
                  title="Live Storefront Preview Frame"
                  id="preview-storefront-frame-fullscreen"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default React.memo(AdminPanel);
