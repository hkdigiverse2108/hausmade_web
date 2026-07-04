import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Menu, X, Sparkles, Heart, User } from 'lucide-react';

export default function Header({ cartCount, onOpenCart, wishlistCount, onOpenWishlist, user, isAuthenticated, onLogout, onOpenLogin, onOpenOrderHistory, onOpenProfile, onOpenAdminLogin }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleUserClick = () => {
    if (!isAuthenticated) {
      onOpenLogin();
    } else {
      setDropdownOpen(!dropdownOpen);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Shop Packs', href: '#product-selector' },
    { name: 'Our Story', href: '#story' },
    { name: 'Ingredients', href: '#ingredients' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'FAQ', href: '#faq' },
  ];

  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = (e) => {
    e.preventDefault();
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (newCount >= 8) {
      setLogoClicks(0);
      if (onOpenAdminLogin) {
        onOpenAdminLogin();
      }
    }
  };

  return (
    <header 
      className={`w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-[#F5F1E8]/95 backdrop-blur-md shadow-sm border-b border-[#3A2E26]/10 py-3.5' 
          : 'bg-[#F5F1E8] py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo */}
          <a 
            href="#" 
            onClick={handleLogoClick}
            className="flex items-center gap-2 sm:gap-2.5 group shrink-0 cursor-default"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#C97C5D] flex items-center justify-center text-white transition-transform group-hover:scale-105 shadow-sm cursor-default">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 cursor-default" />
            </div>
            <div>
              <span className="font-serif-brand text-lg sm:text-2xl font-bold tracking-tight text-[#3A2E26] block leading-none cursor-default">
                Hausmade<span className="text-xs align-top font-sans text-[#C97C5D] cursor-default">™</span>
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#7A8B6F] font-semibold block mt-0.5 hidden xs:block cursor-default">
                Reveal Your Artisanal Beauty
              </span>
            </div>
          </a>


          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-[#3A2E26]/80 hover:text-[#7A8B6F] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Wishlist, Cart & User Login Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleUserClick}
                className="flex items-center gap-1 sm:gap-1.5 p-1.5 sm:p-2 text-[#3A2E26] hover:text-[#C97C5D] transition-colors rounded-full hover:bg-[#3A2E26]/5 cursor-pointer text-xs font-semibold"
                aria-label="User account"
              >
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden lg:inline">{user ? (user.name || user.email || 'Member') : 'Sign In'}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#FDFBF7] border border-[#3A2E26]/10 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn text-[#3A2E26]">
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onOpenProfile();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-[#7A8B6F]/10 hover:text-[#7A8B6F] transition-colors cursor-pointer"
                      >
                        Profile Settings
                      </button>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors border-t border-[#3A2E26]/5 cursor-pointer"
                      >
                        Log Out
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenLogin();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-[#7A8B6F]/10 hover:text-[#7A8B6F] transition-colors cursor-pointer"
                    >
                      Sign In / Sign Up
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={onOpenWishlist}
              className="relative p-1.5 sm:p-2 text-[#3A2E26] hover:text-[#C97C5D] transition-colors rounded-full hover:bg-[#3A2E26]/5 cursor-pointer"
              aria-label="View wishlist"
            >
              <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${wishlistCount > 0 ? 'fill-[#C97C5D] text-[#C97C5D]' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#7A8B6F] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center ring-2 ring-[#F5F1E8] shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenCart}
              className="relative p-1.5 sm:p-2 text-[#3A2E26] hover:text-[#7A8B6F] transition-colors rounded-full hover:bg-[#3A2E26]/5 cursor-pointer"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C97C5D] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center ring-2 ring-[#F5F1E8] shadow-xs animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>


            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#3A2E26] rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-6 border-t border-[#3A2E26]/10 mt-3 animate-fadeIn">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-base font-medium text-[#3A2E26] hover:bg-[#7A8B6F]/10 rounded-xl transition-colors active:bg-[#7A8B6F]/15"
                >
                  {link.name}
                </a>
              ))}
            </div>
            {/* Mobile user actions */}
            <div className="mt-4 pt-4 border-t border-[#3A2E26]/10 flex flex-col space-y-1">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onOpenProfile(); }}
                    className="px-4 py-3 text-left text-base font-medium text-[#3A2E26] hover:bg-[#7A8B6F]/10 rounded-xl transition-colors"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                    className="px-4 py-3 text-left text-base font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }}
                  className="px-4 py-3 text-left text-base font-medium text-[#7A8B6F] hover:bg-[#7A8B6F]/10 rounded-xl transition-colors"
                >
                  Sign In / Sign Up
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
