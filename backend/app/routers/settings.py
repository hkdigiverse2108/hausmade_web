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
        default_hero = {
            "badge": "Hausmade™ Luxury Bath Element",
            "title_normal_1": "Reveal your",
            "title_italic": "artisanal beauty",
            "title_normal_2": "with Kesar.",
            "description": "Purely handmade cleansing bar infused with real saffron extract, camphor, and 100% coconut oil. Naturally removes sun tan, fades dark spots, and brightens your daily complexing glow.",
            "primary_button_text": "Select Your Pack",
            "primary_button_link": "#product-selector",
            "secondary_button_text": "Discover Our Craft",
            "secondary_button_link": "#story",
            "rating_score": "4.8 / 5.0 rating",
            "rating_subtext": "Over 2,400+ happy bathers",
            "rating_stars": 5,
            "card_subtitle": "Royal Saffron Formula",
            "card_title": "Pure Kesar Artisanal Shaving Puck",
            "card_badge": "100% Pure",
            "image_url": "/images/soap-hero.png"
        }
        if not settings:
            settings = {
                "key": "site_settings",
                "logo_url": "",
                "announcement": {
                    "text": "Use promo code HAUS10 for extra 10% OFF at checkout!",
                    "active": True
                },
                "hero": default_hero,
                "story": {
                    "title": "From our kitchen counter to your daily sanctuary.",
                    "subtitle": "Our Heritage",
                    "paragraph1": "Elena started Hausmade Soap after years of battling dry, itchy skin from synthetic ingredients.",
                    "paragraph2": "We went back to ancient cold-process saponification roots: slowly combining raw organic butter, wildflower honey, and steam-distilled essential oils. Every single bar is poured by hand, cut with guitar wire, and cured for 6 full weeks to ensure a long-lasting, ultra-creamy bar.",
                    "image_url": "/images/founder-workshop.png",
                    "author_name": "Elena Vance — Master Artisan",
                    "author_title": "Hand-pouring batches in Vermont",
                    "pillars": [
                        {
                            "title": "Sustainable Farming",
                            "subtitle": "Ethically sourced non-GMO herbs",
                            "icon": "Sprout"
                        },
                        {
                            "title": "Zero Chemicals",
                            "subtitle": "Free from parabens & sulfates",
                            "icon": "Sparkles"
                        }
                    ]
                },
                "contact": {
                    "email": "info@hausmade.in",
                    "phone": "+91 76000 81431",
                    "address": "305 Muktidham Society, Near Sitanagar Chowk, Surat - 395 010 (Guj.)"
                },
                "cashfree": {
                    "app_id_test": "TEST104445831599a05b38d35677ad854445831599",
                    "secret_key_test": "cfsk_ma_test_3062828b8cf4b3f3ea4d6a695123d456789",
                    "app_id_live": "",
                    "secret_key_live": "",
                    "mode": "test",
                    "active": False
                },
                "razorpay": {
                    "key_id_test": "",
                    "key_secret_test": "",
                    "key_id_live": "",
                    "key_secret_live": "",
                    "mode": "test",
                    "active": False
                },
                "subscription": default_subscription,
                "faqs": [
                    {
                        "q": "How long does one soap bar typically last?",
                        "a": "When kept dry on a draining soap dish between uses, one Hausmade bar lasts approximately 3 to 4 weeks for daily shower use by a single person. Because we cure our soap for 6 full weeks, our bars are firmer and last longer than high-water commercial bars."
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
            hero = settings.get("hero", {})
            hero_updated = False
            for k, v in default_hero.items():
                if k not in hero:
                    hero[k] = v
                    hero_updated = True
            if hero_updated:
                settings["hero"] = hero
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"hero": hero}})

            story = settings.get("story", {})
            story_updated = False
            if not story.get("image_url"):
                story["image_url"] = "/images/founder-workshop.png"
                story_updated = True
            if not story.get("author_name"):
                story["author_name"] = "Elena Vance — Master Artisan"
                story_updated = True
            if not story.get("author_title"):
                story["author_title"] = "Hand-pouring batches in Vermont"
                story_updated = True
            if not story.get("title"):
                story["title"] = "From our kitchen counter to your daily sanctuary."
                story_updated = True
            if not story.get("subtitle"):
                story["subtitle"] = "Our Heritage"
                story_updated = True
            if not story.get("paragraph1"):
                story["paragraph1"] = "Hausmade began in the autumn of 2018 when our founder Elena could not find a commercial soap that didn’t leave her skin dry, itchy, and irritated by synthetic dyes and fake fragrances."
                story_updated = True
            if not story.get("paragraph2"):
                story["paragraph2"] = "We went back to ancient cold-process saponification roots: slowly combining raw organic butter, wildflower honey, and steam-distilled essential oils. Every single bar is poured by hand, cut with guitar wire, and cured for 6 full weeks to ensure a long-lasting, ultra-creamy bar."
                story_updated = True
            if "pillars" not in story or not story["pillars"]:
                story["pillars"] = [
                    { "title": "Sustainable Farming", "subtitle": "Ethically sourced non-GMO herbs", "icon": "Sprout" },
                    { "title": "Zero Chemicals", "subtitle": "Free from parabens & sulfates", "icon": "Sparkles" }
                ]
                story_updated = True
            if story_updated:
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
                        "a": "When kept dry on a draining soap dish between uses, one Hausmade bar lasts approximately 3 to 4 weeks for daily shower use by a single person. Because we cure our soap for 6 full weeks, our bars are firmer and last longer than high-water commercial bars."
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
            if "ingredients" not in settings:
                default_ingredients = [
                    {"name": "Pure Kashmiri Kesar (Saffron)", "benefit": "Known for skin-glowing properties, reduces post-shave hyperpigmentation and calms razor burn.", "icon": "Sparkles"},
                    {"name": "Organic Shea Butter Cushion", "benefit": "Creates a rich protective barrier on skin so razors glide smoothly without nicks or irritation.", "icon": "HeartHandshake"},
                    {"name": "Steam-Distilled Sandalwood Oil", "benefit": "Provides an authentic earthy botanical scent while naturally calming shaved skin follicles.", "icon": "Flower2"},
                    {"name": "Cold-Pressed Coconut Glycerin", "benefit": "Whips into a dense micro-foam lather that holds moisture against hair follicles for a close shave.", "icon": "Droplets"}
                ]
                settings["ingredients"] = default_ingredients
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"ingredients": default_ingredients}})
            if "ingredients_header" not in settings:
                default_ingredients_header = {
                    "badge": "Pure & Honest",
                    "badge_icon": "Leaf",
                    "title_normal": "Ingredients You Can",
                    "title_highlight": "Pronounce",
                    "description": "Every bar is crafted with intention. No fillers, no mysterious chemicals, just whole plant remedies sourced from nature's finest botanicals."
                }
                settings["ingredients_header"] = default_ingredients_header
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"ingredients_header": default_ingredients_header}})
            if "difference" not in settings:
                default_difference = {
                    "badge": "The Difference",
                    "badge_icon": "Sparkles",
                    "title_normal": "Why Hausmade is",
                    "title_italic": "Different",
                    "description": "Mass-market soaps are technically synthetic detergent bars. Here is how we compare:",
                    "col1_title": "Botanical Quality",
                    "col2_title": "Mass-Market",
                    "col2_subtitle": "Synthetic bars",
                    "col3_title": "Hausmade™",
                    "col3_badge": "Best Choice",
                    "items": [
                        {"feature": "Dense Shaving Cushion Lather", "commercial": False, "pure": True, "detail": "Commercial foams collapse quickly; Hausmade holds dense foam"},
                        {"feature": "Pure Kashmiri Kesar Infusion", "commercial": False, "pure": True, "detail": "Infused with real saffron strands to brighten skin tone"},
                        {"feature": "Zero Synthetic Propellants", "commercial": False, "pure": True, "detail": "Canned foams use chemical butane gas that dries out skin"},
                        {"feature": "6-Week Cold Cured Puck", "commercial": False, "pure": True, "detail": "Hand-cured for max longevity in a shaving bowl"},
                        {"feature": "Zero Plastic Packaging", "commercial": False, "pure": True, "detail": "Wrapped in 100% biodegradable recycled paper"}
                    ],
                    "footer_icon": "Leaf",
                    "footer_text": "100% Verified Botanical Ingredients"
                }
                settings["difference"] = default_difference
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"difference": default_difference}})
            if "ingredients_active" not in settings:
                settings["ingredients_active"] = True
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"ingredients_active": True}})
            if "subscription_discount_pct" not in settings:
                settings["subscription_discount_pct"] = 15.0
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"subscription_discount_pct": 15.0}})
            if "subscription_active" not in settings:
                settings["subscription_active"] = True
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"subscription_active": True}})
            if "subscription_durations" not in settings:
                settings["subscription_durations"] = [6, 12]
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"subscription_durations": [6, 12]}})
            if "subscription_quantities" not in settings:
                settings["subscription_quantities"] = [1, 2, 3, 4, 5, 6]
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"subscription_quantities": [1, 2, 3, 4, 5, 6]}})
            if "subscription_frequencies" not in settings:
                settings["subscription_frequencies"] = ["monthly", "every_3_months"]
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"subscription_frequencies": ["monthly", "every_3_months"]}})
            if "trust_badges" not in settings:
                default_trust_badges = [
                    {"title": "100% Natural Ingredients", "description": "Pure essential oils & plant extracts", "icon": "Leaf"},
                    {"title": "Small-Batch Cold Processed", "description": "Cured slowly for 6 weeks", "icon": "Award"},
                    {"title": "Cruelty-Free & Plastic-Free", "description": "Zero synthetic chemicals or packaging waste", "icon": "ShieldCheck"}
                ]
                settings["trust_badges"] = default_trust_badges
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"trust_badges": default_trust_badges}})
            if "social_links" not in settings:
                default_social_links = {
                    "instagram": "",
                    "facebook": "",
                    "whatsapp": "",
                    "twitter": "",
                    "youtube": ""
                }
                settings["social_links"] = default_social_links
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"social_links": default_social_links}})
            if "reviews_header" not in settings:
                default_reviews_header = {
                    "badge": "Reviews",
                    "title": "What Our Customers Say",
                    "rating_subtext": "4.9 / 5 · Verified by Google · 2,400+ reviews"
                }
                settings["reviews_header"] = default_reviews_header
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"reviews_header": default_reviews_header}})
            if "faq_header" not in settings:
                default_faq_header = {
                    "badge": "Got Questions?",
                    "title": "Frequently Asked Questions",
                    "description": "Everything you need to know about our handcrafted soaps and ordering process."
                }
                settings["faq_header"] = default_faq_header
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"faq_header": default_faq_header}})
            if "footer" not in settings:
                default_footer = {
                    "tagline": "Reveal Your Artisanal Beauty",
                    "description": "Purely handmade luxury bath elements infused with real saffron, camphor, and 100% pure coconut oil. Product of India.",
                    "marketing_by": "HAUSMADE",
                    "social_subtext": "Stay connected for new launches, wellness tips, and exclusive offers.",
                    "copyright_text": "© 2026 Hausmade. All rights reserved."
                }
                settings["footer"] = default_footer
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"footer": default_footer}})
            if "subscription_offers" not in settings:
                default_offers = [
                    {"id": "6_month_monthly", "name": "6 Month Starter Subscription", "durationMonths": 6, "deliveryFrequency": "monthly", "discountPct": 15.0, "active": True},
                    {"id": "12_month_monthly", "name": "12 Month VIP Subscription", "durationMonths": 12, "deliveryFrequency": "monthly", "discountPct": 20.0, "active": True},
                    {"id": "6_month_every_3_months", "name": "6 Month Seasonal Plan", "durationMonths": 6, "deliveryFrequency": "every_3_months", "discountPct": 18.0, "active": True},
                    {"id": "12_month_every_3_months", "name": "12 Month Ultimate Value Plan", "durationMonths": 12, "deliveryFrequency": "every_3_months", "discountPct": 25.0, "active": True}
                ]
                settings["subscription_offers"] = default_offers
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"subscription_offers": default_offers}})
            if "cashfree" not in settings:
                default_cashfree = {
                    "app_id_test": "TEST104445831599a05b38d35677ad854445831599",
                    "secret_key_test": "cfsk_ma_test_3062828b8cf4b3f3ea4d6a695123d456789",
                    "app_id_live": "",
                    "secret_key_live": "",
                    "mode": "test",
                    "active": False
                }
                settings["cashfree"] = default_cashfree
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"cashfree": default_cashfree}})
            if "razorpay" not in settings:
                default_razorpay = {
                    "key_id_test": "",
                    "key_secret_test": "",
                    "key_id_live": "",
                    "key_secret_live": "",
                    "mode": "test",
                    "active": False
                }
                settings["razorpay"] = default_razorpay
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"razorpay": default_razorpay}})
            if "delhivery" not in settings:
                default_delhivery = {
                    "api_token": "",
                    "mode": "test",
                    "active": False,
                    "pickup_name": "",
                    "pickup_phone": "",
                    "pickup_email": "",
                    "pickup_pincode": "",
                    "pickup_state": "",
                    "pickup_city": "",
                    "pickup_address": ""
                }
                settings["delhivery"] = default_delhivery
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"delhivery": default_delhivery}})
            if "policies_terms" not in settings:
                settings["policies_terms"] = ""
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"policies_terms": ""}})
            if "policies_privacy" not in settings:
                settings["policies_privacy"] = ""
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"policies_privacy": ""}})
            if "policies_shipping" not in settings:
                settings["policies_shipping"] = ""
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"policies_shipping": ""}})
            if "policies_refund" not in settings:
                settings["policies_refund"] = ""
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"policies_refund": ""}})
            if "product_selector_header" not in settings:
                default_ps_header = {
                    "badge": "Choose Your Ritual",
                    "title": "Select Your Handmade Batch",
                    "description": "Handcrafted with organic botanical butter and essential oils. Stock up and save more per bar.",
                    "product_badge": "LUXURY BATH ELEMENT",
                    "product_title": "Hausmade™ Kesar Soap",
                    "weight_badge": "75g Bar",
                    "rating_text": "4.9 ★ · 480+ Happy Glow Reviews",
                    "product_description": "A purely handmade cleansing bar infused with real saffron extract, camphor, and 100% coconut oil. Helps remove sun tanning, fade dark spots, and deeply nourish skin for natural daily glow care. Suitable for all skins."
                }
                settings["product_selector_header"] = default_ps_header
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"product_selector_header": default_ps_header}})
            if "product_selector_images" not in settings or not settings["product_selector_images"]:
                default_ps_images = [
                    {"src": "/images/soap-hero.png", "alt": "Hausmade Kesar Soap Single Box"},
                    {"src": "/images/founder-workshop.png", "alt": "Artisan Workshop Studio"}
                ]
                settings["product_selector_images"] = default_ps_images
                await settings_collection.update_one({"key": "site_settings"}, {"$set": {"product_selector_images": default_ps_images}})
            
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

import httpx
from pydantic import BaseModel

class DelhiveryTestModel(BaseModel):
    api_token: str
    mode: str = "test"

@router.post("/api/admin/delhivery/test")
async def test_delhivery_connection(test_data: DelhiveryTestModel, admin: dict = Depends(get_admin_user)):
    token = test_data.api_token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="API Token is required")
    
    base_url = "https://staging-express.delhivery.com" if test_data.mode == "test" else "https://track.delhivery.com"
    url = f"{base_url}/c/api/pin-codes/json/?token={token}&filter_codes=110001"
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, headers=headers, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                if "delivery_codes" in data or "postal_code" in str(data):
                    return {"status": "success", "message": "Successfully connected to Delhivery!"}
                else:
                    return {"status": "success", "message": "Connected to Delhivery API!"}
            elif resp.status_code in [401, 403]:
                raise HTTPException(status_code=401, detail="Authentication failed: Invalid API Token")
            else:
                raise HTTPException(status_code=400, detail=f"Delhivery API returned status {resp.status_code}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

