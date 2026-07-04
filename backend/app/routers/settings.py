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
                    "paragraph2": "Elena started Hausmade Soap after years of battling dry, itchy skin from synthetic ingredients."
                },
                "contact": {
                    "email": "info@hausmade.in",
                    "phone": "+91 76000 81431",
                    "address": "305 Muktidham Society, Near Sitanagar Chowk, Surat - 395 010 (Guj.)"
                },
                "subscription": default_subscription
            }
            await settings_collection.insert_one(settings)
        else:
            if "logo_url" not in settings:
                settings["logo_url"] = ""
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"logo_url": ""}})
            if "subscription" not in settings:
                settings["subscription"] = default_subscription
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"subscription": default_subscription}})
            
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
