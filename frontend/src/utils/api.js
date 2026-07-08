const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('127.0.0.1') && !envUrl.includes('localhost')) {
    return envUrl;
  }
  if (window.location.port && window.location.port !== '8005' && window.location.port !== '80' && window.location.port !== '443') {
    return `${window.location.protocol}//${window.location.hostname}:8005`;
  }
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${window.location.protocol}//${window.location.hostname}:8005`;
  }
  return window.location.origin;
};
const API_URL = getApiUrl();

export async function registerUser(name, email, mobile, password) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, mobile, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Registration failed');
  }
  
  return response.json();
}

export async function loginUser(identifier, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Login failed');
  }
  
  return response.json();
}

export async function sendOtp(arg) {
  const payload = typeof arg === 'object' ? arg : { mobile: arg };
  const response = await fetch(`${API_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to send OTP');
  }

  return response.json();
}

export async function verifyOtp(arg1, arg2) {
  let payload;
  if (typeof arg1 === 'object') {
    payload = { ...arg1, otp: arg2 };
  } else {
    payload = { mobile: arg1, otp: arg2 };
  }
  const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'OTP verification failed');
  }

  return response.json();
}

export async function socialLogin(email, name, provider = 'google') {
  const response = await fetch(`${API_URL}/api/auth/social-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, name, provider }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Social login failed');
  }

  return response.json();
}

export async function placeOrder(orderData, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(orderData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to place order');
  }
  
  return response.json();
}

export async function getUserOrders(token) {
  const response = await fetch(`${API_URL}/api/orders`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch orders');
  }
  
  return response.json();
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Image upload failed');
  }

  return response.json();
}

export async function updateUserProfile(profileData, token) {
  const response = await fetch(`${API_URL}/api/user/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update profile');
  }

  return response.json();
}

export async function getUserProfile(token) {
  const response = await fetch(`${API_URL}/api/user/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to retrieve profile');
  }

  return response.json();
}

export async function getAdminStats(token) {
  const response = await fetch(`${API_URL}/api/admin/stats`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to retrieve admin stats');
  }

  return response.json();
}

export async function getAdminOrders(token) {
  const response = await fetch(`${API_URL}/api/admin/orders`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to retrieve admin orders');
  }

  return response.json();
}

export async function getAdminUsers(token) {
  const response = await fetch(`${API_URL}/api/admin/users`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to retrieve admin users');
  }

  return response.json();
}

// Product APIs
export async function getProducts() {
  const response = await fetch(`${API_URL}/api/products`, {
    method: 'GET'
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch products');
  }
  return response.json();
}

export async function adminCreateProduct(productData, token) {
  const response = await fetch(`${API_URL}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create product');
  }
  return response.json();
}

export async function adminUpdateProduct(id, productData, token) {
  const response = await fetch(`${API_URL}/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update product');
  }
  return response.json();
}

export async function adminDeleteProduct(id, token) {
  const response = await fetch(`${API_URL}/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete product');
  }
  return response.json();
}

// Coupon APIs
export async function adminGetCoupons(token) {
  const response = await fetch(`${API_URL}/api/admin/coupons`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch coupons');
  }
  return response.json();
}

export async function adminCreateCoupon(couponData, token) {
  const response = await fetch(`${API_URL}/api/admin/coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(couponData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create coupon');
  }
  return response.json();
}

export async function adminUpdateCoupon(code, couponData, token) {
  const response = await fetch(`${API_URL}/api/admin/coupons/${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(couponData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update coupon');
  }
  return response.json();
}

export async function adminDeleteCoupon(code, token) {
  const response = await fetch(`${API_URL}/api/admin/coupons/${encodeURIComponent(code)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete coupon');
  }
  return response.json();
}

export async function validateCoupon(code) {
  const response = await fetch(`${API_URL}/api/coupons/validate?code=${encodeURIComponent(code)}`, {
    method: 'GET'
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Invalid coupon code');
  }
  return response.json();
}

export async function getSiteSettings() {
  const response = await fetch(`${API_URL}/api/settings`, {
    method: 'GET'
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch site settings');
  }
  return response.json();
}

export async function updateSiteSettings(settingsData, token) {
  const response = await fetch(`${API_URL}/api/admin/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(settingsData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update site settings');
  }
  return response.json();
}

export async function getReviews() {
  const response = await fetch(`${API_URL}/api/reviews`, {
    method: 'GET'
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch reviews');
  }
  return response.json();
}

export async function submitReview(productId, productTitle, rating, comment, token) {
  const response = await fetch(`${API_URL}/api/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ productId, productTitle, rating, comment })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to submit review');
  }
  return response.json();
}

export async function adminGetReviews(token) {
  const response = await fetch(`${API_URL}/api/admin/reviews`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch reviews for admin');
  }
  return response.json();
}

export async function adminApproveReview(id, token) {
  const response = await fetch(`${API_URL}/api/admin/reviews/${encodeURIComponent(id)}/approve`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to approve review');
  }
  return response.json();
}

export async function adminDeleteReview(id, token) {
  const response = await fetch(`${API_URL}/api/admin/reviews/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete review');
  }
  return response.json();
}

export async function adminUpdateReview(id, reviewData, token) {
  const response = await fetch(`${API_URL}/api/admin/reviews/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(reviewData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update review');
  }
  return response.json();
}

export async function adminCreateReview(reviewData, token) {
  const response = await fetch(`${API_URL}/api/admin/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(reviewData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to manually create review');
  }
  return response.json();
}

export async function getRecentOrders() {
  const response = await fetch(`${API_URL}/api/public/recent-orders`);
  if (!response.ok) {
    throw new Error('Failed to fetch recent orders');
  }
  return response.json();
}

export async function getActiveCoupons() {
  const response = await fetch(`${API_URL}/api/coupons/active`);
  if (!response.ok) {
    throw new Error('Failed to fetch active coupons');
  }
  return response.json();
}

export async function getAdminRecentUsers(token) {
  const response = await fetch(`${API_URL}/api/admin/recent-users`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch recent users');
  }
  return response.json();
}

export async function getAdminSubscriptions(token) {
  const response = await fetch(`${API_URL}/api/admin/subscriptions`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch subscriptions');
  }
  return response.json();
}

export async function updateSubscriptionStatus(orderId, status, token) {
  const response = await fetch(`${API_URL}/api/admin/subscriptions/${encodeURIComponent(orderId)}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update subscription status');
  }
  return response.json();
}

export async function adminLogOfflineSale(offlineSaleData, token) {
  const response = await fetch(`${API_URL}/api/admin/orders/offline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(offlineSaleData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to log offline sale');
  }
  return response.json();
}

export async function createSubscription(subData, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_URL}/api/subscriptions/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(subData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create subscription');
  }
  return response.json();
}

export async function getUserSubscriptions(token) {
  const response = await fetch(`${API_URL}/api/user/subscriptions`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch user subscriptions');
  }
  return response.json();
}

export async function requestUrgentSoap(subscriptionId, token) {
  const response = await fetch(`${API_URL}/api/subscriptions/${encodeURIComponent(subscriptionId)}/urgent`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to request urgent soap');
  }
  return response.json();
}

export async function adminGetTargets(token) {
  const response = await fetch(`${API_URL}/api/admin/targets`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to fetch sales targets');
  }
  return response.json();
}

export async function adminSetTarget(targetData, token) {
  const response = await fetch(`${API_URL}/api/admin/targets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(targetData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to set sales target');
  }
  return response.json();
}

export async function adminDeleteTarget(targetId, token) {
  const response = await fetch(`${API_URL}/api/admin/targets/${encodeURIComponent(targetId)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to delete sales target');
  }
  return response.json();
}

export async function adminSetTargetRange(rangeData, token) {
  const response = await fetch(`${API_URL}/api/admin/targets/range`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(rangeData)
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to set sales target range');
  }
  return response.json();
}



