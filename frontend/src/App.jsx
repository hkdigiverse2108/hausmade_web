import React, { useState, useEffect, useCallback, useRef } from 'react';
import AnnouncementBanner from './components/AnnouncementBanner';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductSelector, { PACK_OPTIONS } from './components/ProductSelector';
import Ingredients from './components/Ingredients';
import Story from './components/Story';
import Reviews from './components/Reviews';
import SubscribeSave from './components/SubscribeSave';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import LoginModal from './components/LoginModal';
import OrderHistoryModal from './components/OrderHistoryModal';
import ProfileModal from './components/ProfileModal';
import WishlistModal from './components/WishlistModal';
import AdminPanel from './components/AdminPanel';
import ReviewModal from './components/ReviewModal';
import { getUserProfile, getProducts, getSiteSettings, socialLogin } from './utils/api';


import SocialProofToast from './components/SocialProofToast';
import StickyMobileBar from './components/StickyMobileBar';
import { useAuth0 } from '@auth0/auth0-react';
import { Sparkles, X } from 'lucide-react';



export default function App() {
  const { user: auth0User, isAuthenticated: isAuth0Authenticated, logout: auth0Logout, getIdTokenClaims } = useAuth0();
  const [localUser, setLocalUser] = useState(() => {
    const saved = localStorage.getItem('hausmade_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [localToken, setLocalToken] = useState(() => localStorage.getItem('hausmade_token'));
  const [auth0Token, setAuth0Token] = useState(null);
  
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeHash, setActiveHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'profile';
  });
  const hasProfileParam = useRef(false);
  const [wishlistItems, setWishlistItems] = useState(() => {
    const saved = localStorage.getItem('hausmade_wishlist');
    return saved ? JSON.parse(saved) : [
      {
        id: 'pack-3',
        title: 'Pack of 3',
        count: 3,
        basePrice: 717.00,
        savingsBadge: 'Save 20%',
        popular: true,
        bestValue: false,
        image: '/images/pack-3.png'
      }
    ];
  });
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [openCheckoutAfterLogin, setOpenCheckoutAfterLogin] = useState(false);
  const [notification, setNotification] = useState(null);
  const [products, setProducts] = useState(PACK_OPTIONS);
  const [showAdminView, setShowAdminView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'admin';
  });
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);

  const handleOpenWriteReview = useCallback((product) => {
    setIsOrderHistoryOpen(false);
    setReviewProduct(product);
    setIsReviewOpen(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('hausmade_wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);
  const [siteSettings, setSiteSettings] = useState({
    announcement: {
      text: "",
      active: true,
      coupon_code: "",
      badge_text: ""
    },
    hero: {
      badge: "Hausmade™ Luxury Bath Element",
      title_normal_1: "Reveal your",
      title_italic: "artisanal beauty",
      title_normal_2: "with Kesar.",
      description: "Purely handmade cleansing bar infused with real saffron extract, camphor, and 100% coconut oil. Naturally removes sun tan, fades dark spots, and brightens your daily complexing glow."
    },
    story: {
      title: "From our kitchen counter to your daily sanctuary.",
      subtitle: "Our Heritage",
      paragraph1: "PureBotanica began in the autumn of 2018 when our founder Elena could not find a commercial soap that didn’t leave her skin dry, itchy, and irritated by synthetic dyes and fake fragrances.",
      paragraph2: "We went back to ancient cold-process saponification roots: slowly combining raw organic butter, wildflower honey, and steam-distilled essential oils. Every single bar is poured by hand, cut with guitar wire, and cured for 6 full weeks to ensure a long-lasting, ultra-creamy bar."
    },
    contact: {
      email: "info@hausmade.in",
      phone: "+91 76000 81431",
      address: "305 Muktidham Society, Near Sitanagar Chowk, Surat - 395 010 (Guj.)"
    }
  });

  const fetchProductsList = () => {
    getProducts()
      .then(data => {
        if (data && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(err => console.error("Error loading products:", err));
  };

  const fetchSiteSettings = () => {
    getSiteSettings()
      .then(data => {
        if (data && data.announcement) {
          setSiteSettings(data);
        }
      })
      .catch(err => console.error("Error loading site settings:", err));
  };

  useEffect(() => {
    fetchProductsList();
    fetchSiteSettings();

    const handleStorageChange = () => {
      const isInsideIframe = window.self !== window.top;
      const isPreview = isInsideIframe && new URLSearchParams(window.location.search).get('preview') === 'true';
      if (isPreview) {
        const previewSettings = localStorage.getItem('hausmade_preview_settings');
        if (previewSettings) {
          try {
            setSiteSettings(JSON.parse(previewSettings));
          } catch (e) {
            console.error("Error parsing preview settings", e);
          }
        }
        const previewProducts = localStorage.getItem('hausmade_preview_products');
        if (previewProducts) {
          try {
            setProducts(JSON.parse(previewProducts));
          } catch (e) {
            console.error("Error parsing preview products", e);
          }
        }
      }
    };

    const handlePreviewMessage = (event) => {
      if (event.data) {
        if (event.data.type === 'update-preview-settings') {
          setSiteSettings(event.data.settings);
        }
        if (event.data.type === 'update-preview-products') {
          setProducts(event.data.products);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('message', handlePreviewMessage);
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handlePreviewMessage);
    };
  }, []);

  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    window.addEventListener('hashchange', handleHashScroll);
    setTimeout(handleHashScroll, 500);

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setIsProfileOpen(params.get('view') === 'profile');
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('hashchange', handleHashScroll);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentView = params.get('view');
    if (isProfileOpen) {
      if (currentView !== 'profile') {
        params.set('view', 'profile');
        const newSearch = params.toString();
        window.history.replaceState(null, '', `${window.location.pathname}?${newSearch}${window.location.hash}`);
      }
    } else {
      if (currentView === 'profile' && !hasProfileParam.current) {
        params.delete('view');
        const newSearch = params.toString();
        window.history.replaceState(null, '', `${window.location.pathname}${newSearch ? '?' + newSearch : ''}${window.location.hash}`);
      }
    }
    // Set to false after first render run
    hasProfileParam.current = false;
  }, [isProfileOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (showAdminView) {
      if (params.get('mode') !== 'admin') {
        params.set('mode', 'admin');
        const newSearch = params.toString();
        window.history.replaceState(null, '', `${window.location.pathname}?${newSearch}${window.location.hash}`);
      }
    } else {
      if (params.get('mode') === 'admin') {
        params.delete('mode');
        const newSearch = params.toString();
        window.history.replaceState(null, '', `${window.location.pathname}${newSearch ? '?' + newSearch : ''}${window.location.hash}`);
      }
    }
  }, [showAdminView]);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);



  useEffect(() => {
    if (isAuth0Authenticated && auth0User) {
      // When Auth0 authenticates, call socialLogin to merge accounts by email
      const syncAuth0User = async () => {
        try {
          const claims = await getIdTokenClaims();
          if (claims) {
            setAuth0Token(claims.__raw);
          }
          // Call social-login endpoint to merge account by email
          const userEmail = auth0User.email;
          const userName = auth0User.name || auth0User.nickname;
          if (userEmail) {
            const data = await socialLogin(userEmail, userName, 'google');
            // Store the unified JWT (not the Auth0 token)
            localStorage.setItem('hausmade_token', data.token);
            localStorage.setItem('hausmade_user', JSON.stringify(data.user));
            setLocalUser(data.user);
            setLocalToken(data.token);
          }
        } catch (err) {
          console.error('Error syncing Auth0 user:', err);
        }
      };
      syncAuth0User();
    } else if (!isAuth0Authenticated) {
      setAuth0Token(null);
    }
  }, [isAuth0Authenticated, auth0User]);

  const user = localUser || auth0User;
  const isAuthenticated = !!localUser || isAuth0Authenticated;
  const activeToken = localToken || auth0Token;

  useEffect(() => {
    if (isAuthenticated) {
      const pending = localStorage.getItem('hausmade_pending_checkout');
      if (pending === 'true') {
        setIsProfileOpen(true);
        localStorage.removeItem('hausmade_pending_checkout');
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeToken && !isAuth0Authenticated) {
      // Only sync profile for local tokens, not during Auth0 flow
      // (Auth0 flow already syncs via socialLogin above)
      getUserProfile(activeToken).then(data => {
        setLocalUser(data.user);
        localStorage.setItem('hausmade_user', JSON.stringify(data.user));
      }).catch(err => console.error('Error syncing profile:', err));
    }
  }, [activeToken, isAuth0Authenticated]);


  const handleLogout = useCallback(() => {
    // Always clear local storage since we store unified tokens there
    localStorage.removeItem('hausmade_user');
    localStorage.removeItem('hausmade_token');
    setLocalUser(null);
    setLocalToken(null);
    setAuth0Token(null);

    if (isAuth0Authenticated) {
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    }
  }, [isAuth0Authenticated, auth0Logout]);

  const handleOpenCheckout = () => {
    setIsCheckoutOpen(true);
  };


  
  // Product state shared between selector and mobile bar
  const [selectedPack, setSelectedPack] = useState('pack-3');
  const [isSubscription, setIsSubscription] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleAddToCart = (itemToAdd) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(i => i.packId === itemToAdd.packId && i.isSubscription === itemToAdd.isSubscription);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + itemToAdd.quantity;
        const newTotal = (parseFloat(itemToAdd.packPrice) * newQty).toFixed(2);
        updated[existingIdx] = { ...updated[existingIdx], quantity: newQty, totalPrice: newTotal };
        return updated;
      }
      return [...prev, itemToAdd];
    });
    setIsCartOpen(true);
  };

  const handleBuyNow = (itemToAdd) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(i => i.packId === itemToAdd.packId && i.isSubscription === itemToAdd.isSubscription);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + itemToAdd.quantity;
        const newTotal = (parseFloat(itemToAdd.packPrice) * newQty).toFixed(2);
        updated[existingIdx] = { ...updated[existingIdx], quantity: newQty, totalPrice: newTotal };
        return updated;
      }
      return [...prev, itemToAdd];
    });
    handleOpenCheckout();
  };

  const handleAddToWishlist = (packItem) => {
    setWishlistItems(prev => {
      const exists = prev.some(item => item.id === packItem.id);
      if (exists) {
        showNotification(`${packItem.title} removed from wishlist`, 'info');
        return prev.filter(item => item.id !== packItem.id);
      } else {
        showNotification(`${packItem.title} added to wishlist!`, 'success');
        return [...prev, packItem];
      }
    });
  };

  const handleRemoveFromWishlist = (packItem) => {
    setWishlistItems(prev => prev.filter(item => item.id !== packItem.id));
    showNotification(`${packItem.title} removed from wishlist`, 'info');
  };

  const handleUpdateQuantity = (index, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    setCartItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      const newTotal = (parseFloat(item.packPrice) * newQty).toFixed(2);
      updated[index] = { ...item, quantity: newQty, totalPrice: newTotal };
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const activeProducts = products.filter(p => p.active !== false);
  const currentPack = activeProducts.find(p => p.id === selectedPack) || activeProducts[2] || activeProducts[0] || PACK_OPTIONS[0];
  const discountPct = siteSettings?.subscription_discount_pct !== undefined ? siteSettings.subscription_discount_pct : 15.0;
  const discountMultiplier = isSubscription ? (1.0 - (discountPct / 100.0)) : 1.0;
  const currentPrice = (currentPack.basePrice * discountMultiplier).toFixed(2);

  const scrollToSelector = () => {
    const el = document.getElementById('product-selector');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleViewStorefront = useCallback(() => {
    setShowAdminView(false);
    fetchProductsList();
  }, []);

  const isAdminView = user?.is_admin && showAdminView;

  return (
    <>
      {/* Notification Toast — shared between admin and storefront */}
      {notification && (
        <div className="fixed top-6 right-4 z-[9999] bg-[#FDFBF7]/95 backdrop-blur-md p-4 rounded-2xl border border-[#3A2E26]/10 shadow-2xl max-w-xs flex items-center gap-3 animate-slideLeft text-[#3A2E26]">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            notification.type === 'success' ? 'bg-[#7A8B6F]/10 text-[#7A8B6F]' : 'bg-[#C97C5D]/10 text-[#C97C5D]'
          }`}>
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-1 text-xs font-bold leading-tight text-left">
            {notification.message}
          </div>
          <button onClick={() => setNotification(null)} className="text-[#3A2E26]/40 hover:text-[#3A2E26] cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admin Panel — kept mounted when admin, visibility toggled */}
      {user?.is_admin && (
        <div style={{ display: isAdminView ? 'block' : 'none' }}>
          <AdminPanel 
            token={activeToken} 
            onLogout={handleLogout} 
            showNotification={showNotification} 
            onViewStorefront={handleViewStorefront}
            settings={siteSettings}
            onUpdateSettings={fetchSiteSettings}
          />
        </div>
      )}

      {!isAdminView && !isProfileOpen && (() => {
        const isPreviewMode = window.location.search.includes('preview=true');
        const getSectionClass = (sectionId) => isPreviewMode 
          ? `cursor-pointer transition-all duration-300 hover:outline hover:outline-2 hover:outline-dashed hover:outline-amber-500/50 hover:bg-amber-500/[0.01] relative after:absolute after:top-2 after:right-2 after:bg-amber-500 after:text-white after:text-[8px] after:font-bold after:px-1.5 after:py-0.5 after:rounded-md after:content-['Click_to_Edit'] after:opacity-0 hover:after:opacity-100 after:transition-opacity after:z-[99] after:pointer-events-none` 
          : "";
          
        const handleSectionClick = (section) => {
          if (isPreviewMode) {
            window.parent.postMessage({ type: 'focus-section', section }, '*');
          }
        };

        const shouldShowSection = (sectionId) => {
          if (!isPreviewMode || !activeHash || activeHash === '#' || activeHash === '') return true;
          if (sectionId === 'identity') return activeHash === '#identity';
          if (sectionId === 'hero') return activeHash === '#hero' || activeHash === '#trust_badges';
          if (sectionId === 'subscription') return activeHash === '#subscription';
          if (sectionId === 'ingredients') return activeHash === '#ingredients';
          if (sectionId === 'story') return activeHash === '#story';
          if (sectionId === 'faqs') return activeHash === '#faqs';
          if (sectionId === 'contact') return activeHash === '#contact' || activeHash === '#social_links';
          if (sectionId === 'products') return activeHash === '#products';
          if (sectionId === 'reviews') return activeHash === '#reviews';
          return false;
        };

        return (
          <div className="min-h-screen flex flex-col selection:bg-[#7A8B6F] selection:text-white">
            {user?.is_admin && (
              <div className="bg-purple-950 text-[#E6D5C3] px-4 py-2 flex items-center justify-between text-xs font-semibold z-[100] border-b border-[#E6D5C3]/20">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                  <span>Logged in as <strong>Administrator</strong> (Storefront Preview Mode)</span>
                </div>
                <button 
                  onClick={() => setShowAdminView(true)}
                  className="bg-[#E6D5C3]/15 hover:bg-[#E6D5C3]/30 text-white px-3 py-1 rounded-lg font-bold transition-all text-[10px] uppercase tracking-wider cursor-pointer border border-[#E6D5C3]/30"
                >
                  Go to Admin Dashboard
                </button>
              </div>
            )}
            {shouldShowSection('identity') && (
              <>
                <div id="identity" className={getSectionClass('identity')} onClick={() => handleSectionClick('identity')}>
                  <AnnouncementBanner settings={siteSettings.announcement} />
                </div>
                <Header
                  cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                  onOpenCart={() => setIsCartOpen(true)}
                  wishlistCount={wishlistItems.length}
                  onOpenWishlist={() => setIsWishlistOpen(true)}
                  user={user}
                  isAuthenticated={isAuthenticated}
                  onLogout={handleLogout}
                  onOpenLogin={() => setIsLoginOpen(true)}
                  onOpenOrderHistory={() => setIsOrderHistoryOpen(true)}
                  onOpenProfile={() => setIsProfileOpen(true)}
                  onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
                  settings={siteSettings}
                />
              </>
            )}

            <main className="flex-1">
              {shouldShowSection('hero') && (
                <div id="hero" className={getSectionClass('hero')} onClick={() => handleSectionClick('hero')}>
                  <Hero settings={siteSettings.hero} />
                </div>
              )}
              {shouldShowSection('subscription') && (
                <div id="subscription" className={getSectionClass('subscription')} onClick={() => handleSectionClick('subscription')}>
                  <SubscribeSave settings={siteSettings.subscription} />
                </div>
              )}
              {shouldShowSection('products') && (
                <div id="products" className={getSectionClass('products')} onClick={() => handleSectionClick('products')}>
                  <ProductSelector
                    products={products}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    onAddToWishlist={handleAddToWishlist}
                    wishlistItems={wishlistItems}
                    selectedPack={selectedPack}
                    setSelectedPack={setSelectedPack}
                    isSubscription={isSubscription}
                    setIsSubscription={setIsSubscription}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    activeImageIndex={activeImageIndex}
                    setActiveImageIndex={setActiveImageIndex}
                    settings={siteSettings}
                  />
                </div>
              )}
              {shouldShowSection('ingredients') && siteSettings.ingredients_active !== false && (
                <div id="ingredients" className={getSectionClass('ingredients')} onClick={() => handleSectionClick('ingredients')}>
                  <Ingredients settings={siteSettings} />
                </div>
              )}
              {shouldShowSection('story') && (
                <div id="story" className={getSectionClass('story')} onClick={() => handleSectionClick('story')}>
                  <Story settings={siteSettings.story} />
                </div>
              )}
              {shouldShowSection('reviews') && (
                <div id="reviews" className={getSectionClass('reviews')} onClick={() => handleSectionClick('reviews')}>
                  <Reviews />
                </div>
              )}
              {shouldShowSection('faqs') && (
                <div id="faqs" className={getSectionClass('faqs')} onClick={() => handleSectionClick('faqs')}>
                  <FAQ settings={siteSettings} />
                </div>
              )}
            </main>

            {shouldShowSection('contact') && (
              <div id="contact" className={getSectionClass('contact')} onClick={() => handleSectionClick('contact')}>
                <Footer settings={siteSettings} />
              </div>
            )}
          </div>
        );
      })()}

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onOpenCheckout={handleOpenCheckout}
        onStartShopping={() => {
          setIsCartOpen(false);
          setIsProfileOpen(false);
          setIsOrderHistoryOpen(false);
          setIsWishlistOpen(false);
          // Remove query params like ?view=profile
          window.history.pushState({}, '', window.location.pathname + (window.location.hash || '#products'));
          setTimeout(() => {
            const el = document.getElementById('products');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }, 250);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onOrderComplete={() => setCartItems([])}
        token={activeToken}
        user={user}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        showNotification={showNotification}
        onLoginSuccess={(userData) => {
          setLocalUser(userData);
          setLocalToken(localStorage.getItem('hausmade_token'));
          setIsProfileOpen(true);
          setOpenCheckoutAfterLogin(false);
          localStorage.removeItem('hausmade_pending_checkout');
        }}
      />

      <LoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        showNotification={showNotification}
        isAdminOnly={true}
        onLoginSuccess={(userData) => {
          setLocalUser(userData);
          setLocalToken(localStorage.getItem('hausmade_token'));
          setShowAdminView(true);
        }}
      />

      <OrderHistoryModal
        isOpen={isOrderHistoryOpen}
        onClose={() => setIsOrderHistoryOpen(false)}
        token={activeToken}
        onWriteReview={handleOpenWriteReview}
      />

      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        product={reviewProduct}
        token={activeToken}
        showNotification={showNotification}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          window.history.pushState({}, '', window.location.pathname + window.location.hash);
        }}
        user={user}
        token={activeToken}
        onProfileUpdate={(updatedUser) => {
          setLocalUser(updatedUser);
        }}
        showNotification={showNotification}
        wishlistItems={wishlistItems}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onLogout={handleLogout}
      />

      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlistItems}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />



      <SocialProofToast />


      <StickyMobileBar
        packTitle={currentPack.title}
        price={currentPrice}
        onAddToCart={() => {
          if (isSubscription) {
            scrollToSelector();
          } else {
            handleAddToCart({
              packId: currentPack.id,
              title: currentPack.title,
              count: currentPack.count,
              isSubscription,
              frequency: null,
              unitPrice: ((currentPack.basePrice * discountMultiplier) / currentPack.count).toFixed(2),
              packPrice: currentPrice,
              quantity: 1,
              totalPrice: currentPrice,
              image: currentPack.image
            });
          }
        }}
        onScrollToSelector={scrollToSelector}
      />
    </>
  );
}
