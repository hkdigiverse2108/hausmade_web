import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio
from app.config.settings import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM

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
