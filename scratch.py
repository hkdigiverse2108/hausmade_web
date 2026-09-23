import os
import sys
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.security.email_sender import _send_order_email_sync

test_order = {
    "orderId": "TEST-1234",
    "grandTotal": 299.0,
    "paymentMethod": "COD",
    "shippingAddress": {
        "fullName": "Test Customer",
        "email": "devaniparth27@gmail.com",
        "phone": "9876543210",
        "address": "123 Test Street",
        "city": "Surat",
        "pincode": "395010"
    },
    "cartItems": [
        {
            "title": "Saffron Soap",
            "quantity": 2,
            "price": 149.5
        }
    ]
}

res = _send_order_email_sync(test_order)
print("RESULT:", res)
