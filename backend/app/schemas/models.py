from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

class ProductModel(BaseModel):
    id: str
    title: str
    count: int
    basePrice: float
    savingsBadge: Optional[str] = None
    popular: bool = False
    bestValue: bool = False
    image: str
    stock: int
    active: bool = True

class CouponModel(BaseModel):
    code: str
    discount: float
    description: Optional[str] = None
    active: bool = True
    lifetime: bool = True
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    type: Optional[str] = "percentage"

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    mobile: Optional[str] = None
    password: str

class UserLogin(BaseModel):
    identifier: str
    password: str

class SendOtpRequest(BaseModel):
    mobile: Optional[str] = None
    email: Optional[str] = None

class VerifyOtpRequest(BaseModel):
    mobile: Optional[str] = None
    email: Optional[str] = None
    otp: str

class CartItem(BaseModel):
    packId: str
    title: str
    count: int
    isSubscription: bool
    frequency: Optional[str] = None
    unitPrice: str
    packPrice: str
    quantity: int
    totalPrice: str
    image: str

class ShippingAddress(BaseModel):
    fullName: str
    email: Optional[str] = None
    phone: str
    address: str
    city: str
    pincode: str
    state: str = "Gujarat"

class OrderCreate(BaseModel):
    orderId: str
    shippingAddress: ShippingAddress
    cartItems: List[CartItem]
    subtotal: float
    discountAmount: float
    shippingFee: float
    grandTotal: float
    paymentMethod: str

class OfflineSaleCreate(BaseModel):
    customerName: str
    customerPhone: str
    customerEmail: Optional[str] = None
    packId: str
    quantity: int
    totalPrice: float
    paymentMethod: str
    created_at: Optional[str] = None
    notes: Optional[str] = None


class AnnouncementSettings(BaseModel):
    text: str = ""
    active: bool = True
    coupon_code: Optional[str] = ""
    badge_text: Optional[str] = ""

class HeroSettings(BaseModel):
    badge: str
    title_normal_1: str
    title_italic: str
    title_normal_2: str
    description: str
    primary_button_text: Optional[str] = "Select Your Pack"
    primary_button_link: Optional[str] = "#product-selector"
    secondary_button_text: Optional[str] = "Discover Our Craft"
    secondary_button_link: Optional[str] = "#story"
    rating_score: Optional[str] = "4.8 / 5.0 rating"
    rating_subtext: Optional[str] = "Over 2,400+ happy bathers"
    rating_stars: Optional[int] = 5
    card_subtitle: Optional[str] = "Royal Saffron Formula"
    card_title: Optional[str] = "Pure Kesar Artisanal Shaving Puck"
    card_badge: Optional[str] = "100% Pure"
    image_url: Optional[str] = "/images/soap-hero.png"


class StoryPillarItem(BaseModel):
    title: str = ""
    subtitle: str = ""
    icon: str = "Sprout"


class StorySettings(BaseModel):
    title: str = "From our kitchen counter to your daily sanctuary."
    subtitle: str = "Our Heritage"
    paragraph1: str = "Hausmade began in the autumn of 2018 when our founder Elena could not find a commercial soap that didn’t leave her skin dry, itchy, and irritated by synthetic dyes and fake fragrances."
    paragraph2: str = "We went back to ancient cold-process saponification roots: slowly combining raw organic butter, wildflower honey, and steam-distilled essential oils. Every single bar is poured by hand, cut with guitar wire, and cured for 6 full weeks to ensure a long-lasting, ultra-creamy bar."
    image_url: str = "/images/founder-workshop.png"
    author_name: str = "Elena Vance — Master Artisan"
    author_title: str = "Hand-pouring batches in Vermont"
    pillars: List[StoryPillarItem] = Field(default_factory=list)

class SocialLinksSettings(BaseModel):
    instagram: str = ""
    facebook: str = ""
    whatsapp: str = ""
    twitter: str = ""
    youtube: str = ""

class ContactSettings(BaseModel):
    email: str
    phone: str
    address: str

class SubscriptionSettings(BaseModel):
    badge: str
    title_normal: str
    title_highlight: str
    description: str
    perk1: str
    perk2: str
    perk3: str
    card_badge: str
    card_title: str
    card_description: str
    button_text: str

class ProductSelectorHeaderSettings(BaseModel):
    badge: str = "Choose Your Ritual"
    title: str = "Select Your Handmade Batch"
    description: str = "Handcrafted with organic botanical butter and essential oils. Stock up and save more per bar."
    product_badge: str = "LUXURY BATH ELEMENT"
    product_title: str = "Hausmade™ Kesar Soap"
    weight_badge: str = "75g Bar"
    rating_text: str = "4.9 ★ · 480+ Happy Glow Reviews"
    product_description: str = "A purely handmade cleansing bar infused with real saffron extract, camphor, and 100% coconut oil. Helps remove sun tanning, fade dark spots, and deeply nourish skin for natural daily glow care. Suitable for all skins."

class ProductSelectorImageItem(BaseModel):
    src: str
    alt: Optional[str] = "Hausmade Soap Gallery Image"

class FAQItem(BaseModel):
    q: str
    a: str

class TrustBadgeItem(BaseModel):
    title: str
    description: str
    icon: str = "Leaf"

class IngredientItem(BaseModel):
    name: str
    benefit: str
    icon: str = "Sparkles"

class IngredientsHeaderSettings(BaseModel):
    badge: str = "Pure & Honest"
    badge_icon: str = "Leaf"
    title_normal: str = "Ingredients You Can"
    title_highlight: str = "Pronounce"
    description: str = "Every bar is crafted with intention. No fillers, no mysterious chemicals, just whole plant remedies sourced from nature's finest botanicals."

class DifferenceItem(BaseModel):
    feature: str
    detail: Optional[str] = ""
    commercial: bool = False
    pure: bool = True

class DifferenceSettings(BaseModel):
    badge: str = "The Difference"
    badge_icon: str = "Sparkles"
    title_normal: str = "Why Hausmade is"
    title_italic: str = "Different"
    description: str = "Mass-market soaps are technically synthetic detergent bars. Here is how we compare:"
    col1_title: str = "Botanical Quality"
    col2_title: str = "Mass-Market"
    col2_subtitle: str = "Synthetic bars"
    col3_title: str = "Hausmade™"
    col3_badge: str = "Best Choice"
    items: List[DifferenceItem] = []
    footer_icon: str = "Leaf"
    footer_text: str = "100% Verified Botanical Ingredients"



class SubscriptionOffer(BaseModel):
    id: str
    name: str
    durationMonths: int
    deliveryFrequency: str
    discountPct: float
    active: bool = True

class CashfreeSettings(BaseModel):
    app_id_test: str = ""
    secret_key_test: str = ""
    app_id_live: str = ""
    secret_key_live: str = ""
    mode: str = "test"  # "test" or "live"
    active: bool = False

class DelhiverySettings(BaseModel):
    api_token: str = ""
    mode: str = "test"  # "test" or "live"
    active: bool = False
    warehouse_name: str = ""
    pickup_name: str = ""
    pickup_phone: str = ""
    pickup_email: str = ""
    pickup_pincode: str = ""
    pickup_state: str = ""
    pickup_city: str = ""
    pickup_address: str = ""

class ReviewsHeaderSettings(BaseModel):
    badge: str = "Reviews"
    title: str = "What Our Customers Say"
    rating_subtext: str = "4.9 / 5 · Verified by Google · 2,400+ reviews"

class FAQHeaderSettings(BaseModel):
    badge: str = "Got Questions?"
    title: str = "Frequently Asked Questions"
    description: str = "Everything you need to know about our handcrafted soaps and ordering process."

class FooterSettings(BaseModel):
    tagline: str = "Reveal Your Artisanal Beauty"
    description: str = "Purely handmade luxury bath elements infused with real saffron, camphor, and 100% pure coconut oil. Product of India."
    marketing_by: str = "HAUSMADE"
    social_subtext: str = "Stay connected for new launches, wellness tips, and exclusive offers."
    copyright_text: str = "© 2026 Hausmade. All rights reserved."

class SiteSettingsModel(BaseModel):
    logo_url: str = ""
    announcement: AnnouncementSettings
    hero: HeroSettings
    story: StorySettings
    contact: ContactSettings
    subscription: SubscriptionSettings
    social_links: SocialLinksSettings = SocialLinksSettings()
    cashfree: Optional[CashfreeSettings] = CashfreeSettings()
    delhivery: Optional[DelhiverySettings] = DelhiverySettings()
    faqs: List[FAQItem] = []
    ingredients: List[IngredientItem] = []
    ingredients_header: Optional[IngredientsHeaderSettings] = IngredientsHeaderSettings()
    difference: Optional[DifferenceSettings] = DifferenceSettings()
    reviews_header: Optional[ReviewsHeaderSettings] = ReviewsHeaderSettings()
    faq_header: Optional[FAQHeaderSettings] = FAQHeaderSettings()
    footer: Optional[FooterSettings] = FooterSettings()
    trust_badges: List[TrustBadgeItem] = []
    ingredients_active: bool = True
    subscription_active: bool = True
    subscription_durations: List[int] = [6, 12]
    subscription_quantities: List[int] = [2, 4, 6]
    subscription_frequencies: List[str] = ["monthly", "every_3_months"]
    subscription_discount_pct: float = 15.0
    subscription_offers: List[SubscriptionOffer] = []
    policies_terms: Optional[str] = ""
    policies_privacy: Optional[str] = ""
    policies_shipping: Optional[str] = ""
    policies_refund: Optional[str] = ""
    product_selector_header: Optional[ProductSelectorHeaderSettings] = ProductSelectorHeaderSettings()
    product_selector_images: List[ProductSelectorImageItem] = []

class ReviewSubmitModel(BaseModel):
    productId: str
    productTitle: str
    rating: int
    comment: str

class AddressItem(BaseModel):
    id: str
    label: str
    address_line1: str
    address_line2: Optional[str] = ""
    city: str
    state: str
    zip_code: str
    country: str = "India"
    is_default: bool = False

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    addresses: Optional[List[AddressItem]] = None
    current_password: Optional[str] = None
    password: Optional[str] = None

class ReviewUpdateModel(BaseModel):
    rating: int
    comment: str

class SocialLoginRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    provider: str = "google"

class SubscriptionCreate(BaseModel):
    durationMonths: Optional[int] = 6
    soapsPerMonth: Optional[int] = 2
    deliveryFrequency: Optional[str] = "monthly"
    customerName: str
    customerPhone: str
    customerEmail: Optional[str] = None
    shippingAddress: ShippingAddress
    paymentMethod: Optional[str] = "Cash on Delivery"

class SalesTargetCreate(BaseModel):
    name: str
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD
    target: float

class UpdateCartRequest(BaseModel):
    cartItems: List[CartItem]




