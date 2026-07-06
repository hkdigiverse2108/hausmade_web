from typing import List, Optional
from pydantic import BaseModel, EmailStr

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

class AnnouncementSettings(BaseModel):
    text: str
    active: bool = True

class HeroSettings(BaseModel):
    badge: str
    title_normal_1: str
    title_italic: str
    title_normal_2: str
    description: str

class StorySettings(BaseModel):
    title: str
    subtitle: str
    paragraph1: str
    paragraph2: str
    image_url: str = ""
    author_name: str = ""
    author_title: str = ""

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

class FAQItem(BaseModel):
    q: str
    a: str

class IngredientItem(BaseModel):
    name: str
    benefit: str
    icon: str = "Sparkles"

class SiteSettingsModel(BaseModel):
    logo_url: str = ""
    announcement: AnnouncementSettings
    hero: HeroSettings
    story: StorySettings
    contact: ContactSettings
    subscription: SubscriptionSettings
    faqs: List[FAQItem] = []
    ingredients: List[IngredientItem] = []
    ingredients_active: bool = True

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
