import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio
from datetime import datetime, timedelta
from app.config.settings import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, FRONTEND_URL, ENV

def _send_email_sync(email_to: str, otp: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[EMAIL SENDER] Warning: SMTP_USER or SMTP_PASSWORD is not configured. Email NOT sent.")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_FROM or SMTP_USER
        msg['To'] = email_to
        msg['Subject'] = f"{otp} is your Hausmade™ verification code"
        
        body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hausmade Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #FDFBF9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FDFBF9; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #EAE5DE; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(58, 46, 38, 0.03);">
                            
                            <!-- Header -->
                            <tr>
                                <td align="center" style="background-color: #3A2E26; padding: 30px 20px; border-bottom: 3px solid #C97C5D;">
                                    <table border="0" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="color: #FFFFFF; font-size: 26px; font-weight: bold; font-family: 'Georgia', serif; letter-spacing: 1px;">
                                                Hausmade<span style="font-size: 12px; color: #C97C5D; vertical-align: super;">™</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center" style="color: #C97C5D; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; padding-top: 5px;">
                                                Reveal Your Artisanal Beauty
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Body Content -->
                            <tr>
                                <td style="padding: 40px 40px 30px 40px; background-color: #FFFFFF;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td style="color: #3A2E26; font-size: 16px; font-weight: 600; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding-bottom: 15px;">
                                                Hello,
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="color: #4A4A4A; font-size: 15px; line-height: 24px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding-bottom: 20px;">
                                                Thank you for being part of the <strong>Hausmade™ Club</strong>. Use the verification code below to complete your sign-in or registration process:
                                            </td>
                                        </tr>
                                        
                                        <!-- OTP Box -->
                                        <tr>
                                            <td align="center" style="padding: 20px 0 30px 0;">
                                                <table border="0" cellpadding="0" cellspacing="0" style="background-color: #FDFBF7; border: 1px dashed #C97C5D; border-radius: 8px;">
                                                    <tr>
                                                        <td align="center" style="font-size: 32px; font-weight: bold; color: #C97C5D; letter-spacing: 6px; padding: 18px 40px; font-family: 'Courier New', Courier, monospace;">
                                                            {otp}
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>

                                        <tr>
                                            <td style="color: #666666; font-size: 14px; line-height: 22px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding-bottom: 15px;">
                                                This verification code is valid for <strong>5 minutes</strong>. For security reasons, please do not share this code with anyone.
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="color: #888888; font-size: 13px; font-style: italic; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding-bottom: 30px; border-bottom: 1px solid #EAE5DE;">
                                                If you did not request this verification code, you can safely ignore this email.
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Brand / Company Note -->
                            <tr>
                                <td style="padding: 0 40px 30px 40px; background-color: #FFFFFF;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td style="color: #3A2E26; font-size: 14px; font-weight: 600; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding-bottom: 8px;">
                                                About Hausmade™
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="color: #666666; font-size: 13px; line-height: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                                                We craft purely handmade luxury bath elements infused with real saffron, camphor, and 100% pure coconut oil. Every bar is lovingly handcrafted in India to reveal your skin's natural, artisanal beauty.
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #F8F5F0; padding: 30px 40px; border-top: 1px solid #EAE5DE; text-align: center;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="center" style="color: #7A8B6F; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                                                Customer Care & Support
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center" style="color: #555555; font-size: 12px; line-height: 18px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding-bottom: 15px;">
                                                <strong>Helpline:</strong> +91 76000 81431 &nbsp;|&nbsp; <strong>Email:</strong> info@hausmade.in<br>
                                                <strong>Website:</strong> <a href="https://www.hausmade.in" target="_blank" style="color: #C97C5D; text-decoration: none;">www.hausmade.in</a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center" style="color: #999999; font-size: 11px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                                                © 2026 Hausmade. All rights reserved.<br>
                                                305 Muktidham Society, Near Sitanagar Chowk, Surat - 395 010 (Guj.)
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(msg['From'], email_to, msg.as_string())
        server.quit()
        print(f"[EMAIL SENDER] Email successfully sent to {email_to}")
        return True
    except Exception as e:
        print(f"[EMAIL SENDER] Error sending email to {email_to}: {e}")
        return False

async def send_otp_email(email_to: str, otp: str):
    return await asyncio.to_thread(_send_email_sync, email_to, otp)


def _send_order_email_sync(order_dict: dict):
    if not SMTP_USER or not SMTP_PASSWORD:
        print("[EMAIL SENDER] Warning: SMTP_USER or SMTP_PASSWORD is not configured. Order email NOT sent.")
        return False

    shipping = order_dict.get("shippingAddress", {}) or {}
    email_to = shipping.get("email") or order_dict.get("user_email")
    if not email_to:
        print("[EMAIL SENDER] Warning: No recipient email found for order. Order email NOT sent.")
        return False

    try:
        order_id = order_dict.get("orderId", "N/A")
        grand_total = float(order_dict.get("grandTotal", 0))
        payment_method = str(order_dict.get("paymentMethod", "COD")).upper()
        customer_name = shipping.get("fullName", "Valued Customer")
        
        created_at_raw = order_dict.get("created_at")
        if isinstance(created_at_raw, datetime):
            dt_utc = created_at_raw
        elif isinstance(created_at_raw, str):
            try:
                dt_utc = datetime.fromisoformat(created_at_raw.replace("Z", "+00:00"))
            except Exception:
                dt_utc = datetime.utcnow()
        else:
            dt_utc = datetime.utcnow()
        
        dt_ist = dt_utc + timedelta(hours=5, minutes=30)
        order_time_ist = dt_ist.strftime("%d %b %Y, %I:%M %p")

        cart_items = order_dict.get("cartItems", [])
        items_rows_html = ""
        for item in cart_items:
            title = item.get("title", "Artisanal Soap")
            qty = item.get("quantity", 1)
            raw_price = item.get("unitPrice") or item.get("price") or item.get("packPrice")
            if raw_price is not None:
                try:
                    price = float(raw_price)
                except (ValueError, TypeError):
                    price = 0.0
            else:
                try:
                    total_p = float(item.get("totalPrice", 0))
                    price = total_p / max(1, int(qty))
                except (ValueError, TypeError):
                    price = 0.0

            item_total = price * float(qty)
            items_rows_html += f"""
            <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #EAE5DE; font-size: 14px; color: #3A2E26; font-weight: 600;">{title}</td>
                <td align="center" style="padding: 12px 15px; border-bottom: 1px solid #EAE5DE; font-size: 14px; color: #666666;">x{qty}</td>
                <td align="right" style="padding: 12px 15px; border-bottom: 1px solid #EAE5DE; font-size: 14px; color: #3A2E26; font-weight: bold;">₹{item_total:.2f}</td>
            </tr>
            """

        custom_url = order_dict.get("frontend_url")
        if custom_url:
            base_url = custom_url.rstrip("/")
        elif ENV == "production":
            base_url = FRONTEND_URL.rstrip("/") if (FRONTEND_URL and "localhost" not in FRONTEND_URL) else "https://www.hausmade.in"
        elif FRONTEND_URL and "localhost" not in FRONTEND_URL:
            base_url = FRONTEND_URL.rstrip("/")
        else:
            base_url = "https://www.hausmade.in" if ENV == "production" else "http://localhost:5174"

        tracking_url = f"{base_url}/?id={order_id}#track"

        msg = MIMEMultipart()
        msg['From'] = SMTP_FROM or SMTP_USER
        msg['To'] = email_to
        msg['Subject'] = f"Order Confirmed! Your Hausmade™ Order #{order_id}"

        body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation - Hausmade</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #FDFBF9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FDFBF9; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #EAE5DE; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(58, 46, 38, 0.03);">
                            
                            <!-- Header -->
                            <tr>
                                <td align="center" style="background-color: #3A2E26; padding: 30px 20px; border-bottom: 3px solid #C97C5D;">
                                    <table border="0" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td align="center" style="color: #FFFFFF; font-size: 26px; font-weight: bold; font-family: 'Georgia', serif; letter-spacing: 1px;">
                                                Hausmade<span style="font-size: 12px; color: #C97C5D; vertical-align: super;">™</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center" style="color: #C97C5D; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; padding-top: 5px;">
                                                Order Confirmation
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Body Content -->
                            <tr>
                                <td style="padding: 30px 40px; background-color: #FFFFFF;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td style="color: #3A2E26; font-size: 18px; font-weight: bold; padding-bottom: 10px;">
                                                Thank You for Your Order, {customer_name}!
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="color: #666666; font-size: 14px; line-height: 22px; padding-bottom: 25px;">
                                                We've received your order <strong>#{order_id}</strong> and are currently preparing your artisanal cleansing ritual elements.
                                            </td>
                                        </tr>

                                        <!-- Order Details Banner -->
                                        <tr>
                                            <td style="background-color: #FDFBF7; border: 1px solid #EAE5DE; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td style="font-size: 13px; color: #3A2E26;"><strong>Order ID:</strong> #{order_id}</td>
                                                        <td align="right" style="font-size: 13px; color: #3A2E26;"><strong>Date & Time:</strong> {order_time_ist} IST</td>
                                                    </tr>
                                                    <tr>
                                                        <td style="font-size: 13px; color: #3A2E26; padding-top: 6px;"><strong>Payment:</strong> {payment_method}</td>
                                                        <td align="right" style="font-size: 13px; color: #3A2E26; padding-top: 6px;"></td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>

                                        <!-- Items Summary Table -->
                                        <tr>
                                            <td style="padding-top: 20px;">
                                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                                                    <thead>
                                                        <tr style="background-color: #F8F5F0; text-align: left;">
                                                            <th style="padding: 10px 15px; font-size: 12px; color: #3A2E26; text-transform: uppercase; letter-spacing: 1px;">Item</th>
                                                            <th align="center" style="padding: 10px 15px; font-size: 12px; color: #3A2E26; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                                                            <th align="right" style="padding: 10px 15px; font-size: 12px; color: #3A2E26; text-transform: uppercase; letter-spacing: 1px;">Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {items_rows_html}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>

                                        <!-- Total Amount -->
                                        <tr>
                                            <td align="right" style="padding: 20px 15px 30px 15px; font-size: 16px; color: #3A2E26;">
                                                <strong>Total Amount:</strong> <span style="font-size: 20px; color: #C97C5D; font-weight: bold;">₹{grand_total:.2f}</span>
                                            </td>
                                        </tr>

                                        <!-- Shipping Address Box -->
                                        <tr>
                                            <td style="background-color: #F8F5F0; border-radius: 8px; padding: 20px; font-size: 13px; color: #4A4A4A; line-height: 20px;">
                                                <strong style="color: #3A2E26; font-size: 14px;">Shipping Address:</strong><br>
                                                {shipping.get('fullName', '')}<br>
                                                {shipping.get('address', '')}, {shipping.get('city', '')} - {shipping.get('pincode', '')}<br>
                                                Phone: {shipping.get('phone', '')}
                                            </td>
                                        </tr>

                                        <!-- Track Order CTA Button -->
                                        <tr>
                                            <td align="center" style="padding: 35px 0 20px 0;">
                                                <a href="{tracking_url}" target="_blank" style="background-color: #3A2E26; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: bold; display: inline-block; letter-spacing: 1px; text-transform: uppercase;">
                                                    Track & Manage Your Order
                                                </a>
                                            </td>
                                        </tr>

                                        <tr>
                                            <td align="center" style="color: #888888; font-size: 12px; padding-bottom: 25px;">
                                                Need to make changes or cancel? You can track or cancel your order before dispatch using the tracking button above.
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #F8F5F0; padding: 25px 40px; border-top: 1px solid #EAE5DE; text-align: center;">
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="center" style="color: #555555; font-size: 12px; line-height: 18px;">
                                                <strong>Helpline:</strong> +91 76000 81431 &nbsp;|&nbsp; <strong>Email:</strong> info@hausmade.in<br>
                                                <strong>Website:</strong> <a href="https://www.hausmade.in" target="_blank" style="color: #C97C5D; text-decoration: none;">www.hausmade.in</a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td align="center" style="color: #999999; font-size: 11px; padding-top: 10px;">
                                                © 2026 Hausmade. All rights reserved.
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(msg['From'], email_to, msg.as_string())
        server.quit()
        print(f"[EMAIL SENDER] Order confirmation email sent successfully to {email_to}")
        return True
    except Exception as e:
        print(f"[EMAIL SENDER] Error sending order confirmation email to {email_to}: {e}")
        return False

async def send_order_confirmation_email(order_dict: dict):
    return await asyncio.to_thread(_send_order_email_sync, order_dict)

