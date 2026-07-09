import React from 'react';
import { X, ShieldCheck, FileText, Truck, RotateCcw } from 'lucide-react';

const defaultTerms = `1. Overview & Agreement
Welcome to Hausmade. This website (www.hausmade.in) is operated by HAUSMADE. Throughout the site, the terms "we", "us" and "our" refer to HAUSMADE. By visiting our site and/ or purchasing something from us, you engage in our "Service" and agree to be bound by these terms and conditions.

2. Handcrafted & Artisanal Nature of Products
All our cleansing bars and bath elements are meticulously handmade in small batches. Because of this natural process, minor variations in color, pattern, weight, fragrance intensity, and texture are to be expected and celebrated. They are not considered manufacturing defects.

3. Use of Products & Liability
Our products are formulated for cosmetic and cleansing use. Please review the ingredients carefully if you have sensitive skin or allergies. Perform a patch test before full use. We are not liable for individual skin sensitivities or allergic reactions.

4. Online Store & Pricing Terms
We reserve the right to modify prices, descriptions, and availability of our packs at any time without notice. We reserve the right to limit the sales of our products or services to any person, geographic region, or jurisdiction.

5. Payments & Billing Information
You agree to provide current, complete, and accurate purchase and account information for all purchases. All online payments are handled securely through Cashfree Payments. You agree to be bound by their payment terms.`;

const defaultPrivacy = `1. Information Collection
When you purchase something from our store, we collect the personal information you give us such as your name, delivery address, phone number, and email address. When you browse our store, we also automatically receive your computer’s internet protocol (IP) address to provide us with information that helps us learn about your browser and operating system.

2. Consent & Use
When you provide us with personal information to complete a transaction, verify your credit/debit card, place an order, or arrange for a delivery, you consent to our collecting it and using it for that specific reason only. We use your details to fulfill orders, process payments via Cashfree, send tracking details, and provide support.

3. Third-Party Services & Secure Payments
In general, the third-party providers used by us will only collect, use and disclose your information to the extent necessary to allow them to perform the services they provide to us. All online payments are processed through Cashfree Payments, which complies with PCI-DSS standards. We do not store your credit card credentials on our servers.

4. Security Measures
To protect your personal information, we take reasonable precautions and follow industry best practices to make sure it is not inappropriately lost, misused, accessed, disclosed, altered or destroyed.`;

const defaultShipping = `1. Order Processing Time
All Hausmade products are handcrafted. Orders are processed and dispatched within 1 to 3 business days of receiving the order confirmation. Orders are not shipped or delivered on public holidays or Sundays.

2. Shipping Rates & Delivery Estimates
We offer standard shipping across India. Shipping charges and free shipping eligibility are displayed during checkout:
- Standard Delivery: 3 to 7 business days from dispatch depending on the delivery region.
- Shipping Fee: Calculated dynamically during checkout. Free shipping thresholds may apply as configured in promotions.

3. Shipment Tracking
Once your order is handed over to our shipping partner, you will receive a tracking link via email and/or SMS/WhatsApp. You can use the link to track your package in real-time.

4. Damages & Incorrect Address
Please ensure your delivery address, PIN code, and mobile number are accurate. We are not responsible for delivery failure due to incorrect address details. If your package arrives completely crushed or damaged, please refer to our Return & Refund Policy.`;

const defaultRefund = `1. Hygienic Exemption (Final Sale)
Due to the personal care and hygienic nature of bath products (handmade soaps), we do not accept returns or exchanges once the products have been delivered. All sales are final.

2. Damaged or Defective Items
We want you to love your luxury bath experience. If your order arrives damaged, defective, or if you received the wrong item, please contact us within 48 hours of delivery at info@hausmade.in or WhatsApp us at +91 76000 81431 with:
- Your Order ID
- Unboxing video or photos showing the damaged items/incorrect parcel

Once reviewed and verified, we will arrange for a free replacement or issue a full refund back to your original payment method.

3. Order Cancellations
You can cancel your order before it has been dispatched from our facility. Once dispatched, cancellations are not possible. Please contact our helpline immediately for cancellation requests.

4. Refund Timelines
Refunds are processed back to the original source of payment within 5 to 7 business days from the date of verification and approval of the refund request.`;

export default function PoliciesModal({ isOpen, onClose, defaultTab = 'terms', settings }) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'refund', label: 'Return & Refund', icon: RotateCcw },
  ];

  const getPolicyContent = () => {
    switch (activeTab) {
      case 'privacy':
        return {
          title: 'Privacy Policy',
          text: settings?.policies_privacy || defaultPrivacy
        };
      case 'shipping':
        return {
          title: 'Shipping & Delivery Policy',
          text: settings?.policies_shipping || defaultShipping
        };
      case 'refund':
        return {
          title: 'Return & Refund Policy',
          text: settings?.policies_refund || defaultRefund
        };
      case 'terms':
      default:
        return {
          title: 'Terms & Conditions',
          text: settings?.policies_terms || defaultTerms
        };
    }
  };

  const { title, text } = getPolicyContent();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1e1c18]/60 backdrop-blur-[4px] transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-[#FDFBF7] rounded-[24px] shadow-[0_25px_60px_-15px_rgba(58,46,38,0.25)] border border-[#E6D5C3] max-w-4xl w-full h-[90vh] sm:h-[80vh] overflow-hidden transform transition-all duration-300 scale-100 flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Top Decorative Brand Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#C97C5D] via-[#E6D5C3] to-[#C97C5D] absolute top-0 left-0" />
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E6D5C3]/40">
          <div className="flex items-center gap-2">
            <span className="font-serif-brand text-2xl font-bold tracking-tight text-[#3A2E26]">
              Store Policies
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-[#3A2E26]/40 hover:text-[#3A2E26] hover:bg-[#F5EFE6] transition-all p-1.5 rounded-full focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 bg-[#F5EFE6]/50 border-r border-[#E6D5C3]/30 p-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible shrink-0 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap md:w-full text-left ${
                    isActive 
                      ? 'bg-[#C97C5D] text-white shadow-lg shadow-[#C97C5D]/10' 
                      : 'text-[#3A2E26]/75 hover:text-[#3A2E26] hover:bg-[#F5EFE6]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#3A2E26]/60'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Policy Text Container */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto text-[#5C4F46] leading-relaxed font-sans text-sm scrollbar-thin">
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#3A2E26] font-serif border-b border-[#E6D5C3]/40 pb-2">{title}</h3>
              <p className="text-xs text-[#5C4F46]/60 -mt-2">Last Updated: July 2026</p>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#5C4F46]">
                {text}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
