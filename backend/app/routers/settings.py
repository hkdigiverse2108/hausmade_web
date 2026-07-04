from fastapi import APIRouter, HTTPException, Depends
from app.schemas.models import SiteSettingsModel
from app.database.connection import settings_collection
from app.dependencies.auth_deps import get_admin_user

router = APIRouter(tags=["Settings"])

@router.get("/api/settings")
async def get_site_settings():
    try:
        settings = await settings_collection.find_one({"key": "site_settings"})
        default_subscription = {
            "badge": "Subscribe & Save Club",
            "title_normal": "Never Run Out.",
            "title_highlight": "Save 15% On Every Delivery",
            "description": "Enjoy fresh, 100% cold-cured botanical soaps delivered directly to your door. Completely flexible schedule with zero long-term commitment.",
            "perk1": "Free Priority Delivery",
            "perk2": "Flexible 1, 2, 3 Mo. Cycle",
            "perk3": "1-Click Easy Cancellation",
            "card_badge": "Instant VIP Perk",
            "card_title": "Ready For Lather On Autopilot?",
            "card_description": "Select subscription on any soap pack below to lock in your 15% discount.",
            "button_text": "Configure Your Subscription"
        }
        if not settings:
            settings = {
                "key": "site_settings",
                "logo_url": "",
                "announcement": {
                    "text": "Use promo code HAUS10 for extra 10% OFF at checkout!",
                    "active": True
                },
                "hero": {
                    "badge": "Hausmade™ Luxury Bath Element",
                    "title_normal_1": "Reveal your",
                    "title_italic": "artisanal beauty",
                    "title_normal_2": "with Kesar.",
                    "description": "Purely handmade cleansing bar infused with real saffron extract, camphor, and 100% coconut oil. Naturally removes sun tan, fades dark spots, and brightens your daily complexing glow."
                },
                "story": {
                    "title": "From our kitchen counter to your daily sanctuary.",
                    "subtitle": "Our Heritage",
                    "paragraph1": "Elena started Hausmade Soap after years of battling dry, itchy skin from synthetic ingredients.",
                    "paragraph2": "Elena started Hausmade Soap after years of battling dry, itchy skin from synthetic ingredients.",
                    "image_url": "/images/founder-workshop.png",
                    "author_name": "Elena Vance — Master Artisan",
                    "author_title": "Hand-pouring batches in Vermont"
                },
                "contact": {
                    "email": "info@hausmade.in",
                    "phone": "+91 76000 81431",
                    "address": "305 Muktidham Society, Near Sitanagar Chowk, Surat - 395 010 (Guj.)"
                },
                "subscription": default_subscription,
                "faqs": [
                    {
                        "q": "How long does one soap bar typically last?",
                        "a": "When kept dry on a draining soap dish between uses, one PureBotanica bar lasts approximately 3 to 4 weeks for daily shower use by a single person. Because we cure our soap for 6 full weeks, our bars are firmer and last longer than high-water commercial bars."
                    },
                    {
                        "q": "Is this soap safe for sensitive skin and eczema?",
                        "a": "Yes, absolutely! Our French Lavender & Oat bar was specially formulated for sensitive and reactive skin. We use colloidal oats to calm inflammation and organic plant oils that restore the natural moisture barrier without synthetic detergents."
                    },
                    {
                        "q": "What is your shipping policy?",
                        "a": "We ship all orders in 100% plastic-free, recyclable cardboard boxes. Standard shipping takes 3-5 business days. All orders over $35 ship completely FREE!"
                    },
                    {
                        "q": "How does the Subscribe & Save subscription work?",
                        "a": "When you choose Subscribe & Save, you lock in an extra 15% discount on every order. We deliver fresh soap according to your selected frequency (every 1, 2, or 3 months). You can modify your schedule, pause, or cancel at any time directly from your email link."
                    },
                    {
                        "q": "Are your soaps vegan and cruelty-free?",
                        "a": "All our soap varieties are 100% cruelty-free and never tested on animals. Our formulations use pure plant oils, raw wildflower honey, and organic botanical powders."
                    },
                    {
                        "q": "What is your 30-day return policy?",
                        "a": "We want you to love your bathing experience! If you are not completely delighted with your purchase for any reason within 30 days, reach out to our customer care team and we will provide a full refund or exchange — no hassle required."
                    }
                ]
            }
            await settings_collection.insert_one(settings)
        else:
            if "image_url" not in settings.get("story", {}):
                story = settings.get("story", {})
                story["image_url"] = story.get("image_url", "/images/founder-workshop.png")
                story["author_name"] = story.get("author_name", "Elena Vance — Master Artisan")
                story["author_title"] = story.get("author_title", "Hand-pouring batches in Vermont")
                settings["story"] = story
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"story": story}})
            if "logo_url" not in settings:
                settings["logo_url"] = ""
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"logo_url": ""}})
            if "subscription" not in settings:
                settings["subscription"] = default_subscription
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"subscription": default_subscription}})
            if "faqs" not in settings:
                default_faqs = [
                    {
                        "q": "How long does one soap bar typically last?",
                        "a": "When kept dry on a draining soap dish between uses, one PureBotanica bar lasts approximately 3 to 4 weeks for daily shower use by a single person. Because we cure our soap for 6 full weeks, our bars are firmer and last longer than high-water commercial bars."
                    },
                    {
                        "q": "Is this soap safe for sensitive skin and eczema?",
                        "a": "Yes, absolutely! Our French Lavender & Oat bar was specially formulated for sensitive and reactive skin. We use colloidal oats to calm inflammation and organic plant oils that restore the natural moisture barrier without synthetic detergents."
                    },
                    {
                        "q": "What is your shipping policy?",
                        "a": "We ship all orders in 100% plastic-free, recyclable cardboard boxes. Standard shipping takes 3-5 business days. All orders over $35 ship completely FREE!"
                    },
                    {
                        "q": "How does the Subscribe & Save subscription work?",
                        "a": "When you choose Subscribe & Save, you lock in an extra 15% discount on every order. We deliver fresh soap according to your selected frequency (every 1, 2, or 3 months). You can modify your schedule, pause, or cancel at any time directly from your email link."
                    },
                    {
                        "q": "Are your soaps vegan and cruelty-free?",
                        "a": "All our soap varieties are 100% cruelty-free and never tested on animals. Our formulations use pure plant oils, raw wildflower honey, and organic botanical powders."
                    },
                    {
                        "q": "What is your 30-day return policy?",
                        "a": "We want you to love your bathing experience! If you are not completely delighted with your purchase for any reason within 30 days, reach out to our customer care team and we will provide a full refund or exchange — no hassle required."
                    }
                ]
                settings["faqs"] = default_faqs
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"faqs": default_faqs}})
            
        if "_id" in settings:
            settings["_id"] = str(settings["_id"])
        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/api/admin/settings")
async def update_site_settings(settings_data: SiteSettingsModel, admin: dict = Depends(get_admin_user)):
    try:
        doc = settings_data.dict()
        doc["key"] = "site_settings"
        await settings_collection.update_one({"key": "site_settings"}, {"$set": doc}, upsert=True)
        return {"status": "success", "settings": doc}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
