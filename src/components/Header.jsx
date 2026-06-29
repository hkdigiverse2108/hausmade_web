import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, Sparkles, Heart } from 'lucide-react';

export default function Header({ cartCount, onOpenCart, wishlistCount, onOpenWishlist }) {

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <header 
      className={`w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-[#F5F1E8]/95 backdrop-blur-md shadow-sm border-b border-[#3A2E26]/10 py-3.5' 
          : 'bg-[#F5F1E8] py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-full bg-[#C97C5D] flex items-center justify-center text-white transition-transform group-hover:scale-105 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif-brand text-2xl font-bold tracking-tight text-[#3A2E26] block leading-none">
                Hausmade<span className="text-xs align-top font-sans text-[#C97C5D]">™</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#7A8B6F] font-semibold block mt-0.5">
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

          {/* Wishlist & Cart Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={onOpenWishlist}
              className="relative p-2 text-[#3A2E26] hover:text-[#C97C5D] transition-colors rounded-full hover:bg-[#3A2E26]/5 cursor-pointer"
              aria-label="View wishlist"
            >
              <Heart className={`w-6 h-6 ${wishlistCount > 0 ? 'fill-[#C97C5D] text-[#C97C5D]' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#7A8B6F] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center ring-2 ring-[#F5F1E8] shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenCart}
              className="relative p-2 text-[#3A2E26] hover:text-[#7A8B6F] transition-colors rounded-full hover:bg-[#3A2E26]/5 cursor-pointer"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-6 h-6" />
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
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-base font-medium text-[#3A2E26] hover:bg-[#7A8B6F]/10 rounded-md transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
