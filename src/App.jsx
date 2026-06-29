import React, { useState } from 'react';
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
import SocialProofToast from './components/SocialProofToast';
import StickyMobileBar from './components/StickyMobileBar';

export default function App() {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [wishlistCount, setWishlistCount] = useState(1); // Default saved item
  
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

  const currentPack = PACK_OPTIONS.find(p => p.id === selectedPack) || PACK_OPTIONS[2];
  const discountMultiplier = isSubscription ? 0.85 : 1.0;
  const currentPrice = (currentPack.basePrice * discountMultiplier).toFixed(2);

  const scrollToSelector = () => {
    const el = document.getElementById('product-selector');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#7A8B6F] selection:text-white">
      <div className="sticky top-0 z-50 shadow-xs">
        <AnnouncementBanner />
        <Header
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          onOpenCart={() => setIsCartOpen(true)}
          wishlistCount={wishlistCount}
          onOpenWishlist={() => alert(`You have ${wishlistCount} saved Hausmade™ items in your wishlist!`)}
          onOpenLogin={() => setIsLoginOpen(true)}
          user={user}
        />
      </div>

      <main className="flex-1">
        <Hero />
        <SubscribeSave />
        <ProductSelector
          onAddToCart={handleAddToCart}
          selectedPack={selectedPack}
          setSelectedPack={setSelectedPack}
          isSubscription={isSubscription}
          setIsSubscription={setIsSubscription}
          quantity={quantity}
          setQuantity={setQuantity}
          activeImageIndex={activeImageIndex}
          setActiveImageIndex={setActiveImageIndex}
        />
        <Ingredients />
        <Story />
        <Reviews />
        <FAQ />
      </main>

      <Footer />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onOrderComplete={() => setCartItems([])}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(userData) => setUser(userData)}
      />

      <SocialProofToast />

      <StickyMobileBar
        packTitle={currentPack.title}
        price={currentPrice}
        onAddToCart={() => {
          handleAddToCart({
            packId: currentPack.id,
            title: currentPack.title,
            count: currentPack.count,
            isSubscription,
            frequency: isSubscription ? 'Every 2 Months' : null,
            unitPrice: ((currentPack.basePrice * discountMultiplier) / currentPack.count).toFixed(2),
            packPrice: currentPrice,
            quantity: 1,
            totalPrice: currentPrice,
            image: currentPack.image
          });
        }}
        onScrollToSelector={scrollToSelector}
      />
    </div>
  );
}
