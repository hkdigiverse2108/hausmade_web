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
        <html>
            <body style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px;">
                    <h2 style="color: #3A2E26; border-bottom: 2px solid #7A8B6F; padding-bottom: 10px;">Hausmade™ Club Login</h2>
                    <p>Hello,</p>
                    <p>Your one-time verification code (OTP) for logging in or signing up is:</p>
                    <div style="font-size: 24px; font-weight: bold; color: #C97C5D; letter-spacing: 4px; padding: 15px; background-color: #FDFBF7; border: 1px dashed #C97C5D; text-align: center; border-radius: 4px; margin: 20px 0;">
                        {otp}
                    </div>
                    <p>This code is valid for 5 minutes. Please do not share it with anyone.</p>
                    <p style="margin-top: 30px; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee; padding-top: 10px;">
                        If you did not request this code, you can safely ignore this email.
                    </p>
                </div>
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
