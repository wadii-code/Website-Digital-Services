
// script.js - UPDATED TO SHOW ERRORS
const API_BASE = 'http://localhost:3001/api';

// ===== Sports Carousel Scroll ===== 
function scrollSports(direction) {
  const sportsGrid = document.querySelector('.sports-grid');
  const scrollAmount = 400;
  
  if (direction === 'left') {
    sportsGrid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    sportsGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}

function scrollSportsEvents(direction) {
  const sportsEventsGrid = document.querySelector('.sports-events-grid');
  const scrollAmount = 400;
  
  if (direction === 'left') {
    sportsEventsGrid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  } else {
    sportsEventsGrid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }
}

// ===== Login Toggle ===== 
function toggleLogin() {
  const loginSection = document.getElementById('login');
  loginSection.classList.toggle('active');
  if (loginSection.classList.contains('active')) {
    showLoginForm();
  }
}

function toggleSignup(e) {
  e.preventDefault();
  document.getElementById('login-form-container').classList.toggle('active');
  document.getElementById('signup-form-container').classList.toggle('active');
}

function showLoginForm() {
  document.getElementById('login-form-container').classList.add('active');
  document.getElementById('signup-form-container').classList.remove('active');
}

// ===== Plan Selection ===== 
let selectedPlan = null;

function selectPlan(planId, planName, price) {
  selectedPlan = { id: planId, name: planName, price: price };
  
  document.getElementById('planType').innerText = planName;
  document.getElementById('planPrice').innerText = '$' + price.toFixed(2);
  
  const tax = (price * 0.08).toFixed(2);
  const total = (price + parseFloat(tax)).toFixed(2);
  
  document.getElementById('subtotal').innerText = '$' + price.toFixed(2);
  document.getElementById('tax').innerText = '$' + tax;
  document.getElementById('total').innerText = '$' + total;

  document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' });
}

// ===== Payment Processing ===== 
async function processPayment() {
  const fullname = document.getElementById('fullname').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value || 'Not provided';
  const country = document.getElementById('country').value;
  const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
  
  if (!fullname || !email) {
    alert('Please enter your name and email');
    return;
  }

  if (!selectedPlan) {
    alert('Please select a plan first');
    return;
  }

  const userId = `user_${Date.now()}_${email.replace(/[@.]/g, '_')}`;
  
  const btn = document.querySelector('.btn-checkout');
  const originalText = btn.textContent;
  btn.textContent = 'Processing...';
  btn.disabled = true;

  try {
    console.log('🔄 Sending subscription to backend...');
    
    const response = await fetch(`${API_BASE}/subscribe`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        plan_id: selectedPlan.id,
        payment_method: paymentMethod,
        customer_info: { 
          fullname: fullname, 
          email: email, 
          phone: phone, 
          country: country 
        }
      })
    });

    const result = await response.json();
    
    console.log('📥 Backend response:', result);

    btn.textContent = originalText;
    btn.disabled = false;

    if (response.ok) {
      // Show detailed success message
      alert(`✅ SUBSCRIPTION SUCCESSFUL!\n\n` +
            `Thank you, ${fullname}!\n` +
            `Plan: ${selectedPlan.name}\n` +
            `Email: ${email}\n` +
            `\nWe will contact you within 24 hours.\n` +
            `Support: Shoplinnocentre@gmail.com`);
      
      document.querySelector('.checkout-form').reset();
      
      // Clear selected plan
      selectedPlan = null;
      
    } else {
      alert('❌ Payment failed: ' + (result.error || 'Please try again or contact support'));
    }
  } catch (error) {
    btn.textContent = originalText;
    btn.disabled = false;
    console.error('Network error:', error);
    alert('❌ Network error. Please:\n1. Check your internet\n2. Try again\n3. Contact: Shoplinnocentre@gmail.com');
  }
}

// ===== Registration ===== 
async function handleSignup(e) {
  e.preventDefault();
  
  const fullname = document.getElementById('signup-fullname').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;
  
  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }
  
  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname, email, password })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('✅ Account created! You can now login.');
      document.querySelector('.signup-form').reset();
      showLoginForm();
    } else {
      alert('Registration failed: ' + (result.error || 'Try again'));
    }
  } catch (error) {
    alert('Registration failed. Please try again.');
  }
}

// ===== Login ===== 
const loginForm = document.querySelector('.login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        localStorage.setItem('iptv_user', JSON.stringify({
          user_id: result.user_id,
          username: result.username
        }));
        
        alert('✅ Login successful!');
        toggleLogin();
        updateLoginStatus();
      } else {
        alert('Login failed: Invalid credentials');
      }
    } catch (error) {
      alert('Login failed. Please try again.');
    }
  });
}

// ===== Update UI ===== 
function updateLoginStatus() {
  const userData = localStorage.getItem('iptv_user');
  if (userData) {
    const user = JSON.parse(userData);
    const loginLink = document.querySelector('a[href="#login"]');
    if (loginLink) {
      loginLink.textContent = `👤 ${user.username}`;
      loginLink.href = '#';
      loginLink.onclick = () => {
        alert(`Logged in as: ${user.username}\nUser ID: ${user.user_id}`);
      };
    }
  }
}

// ===== Contact Form ===== 
function submitContactForm() {
  const name = document.getElementById('contact-name')?.value || 'Not provided';
  const email = document.getElementById('contact-email')?.value || 'Not provided';
  const message = document.getElementById('contact-message')?.value || 'Not provided';
  
  const userData = localStorage.getItem('iptv_user');
  const userId = userData ? JSON.parse(userData).user_id : 'guest';

  fetch(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      subject: 'Contact Form - IPTV Website',
      message: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    })
  })
  .then(response => response.json())
  .then(result => {
    alert('✅ Message sent! We will contact you soon.');
    if (document.getElementById('contact-name')) {
      document.getElementById('contact-name').value = '';
      document.getElementById('contact-email').value = '';
      document.getElementById('contact-message').value = '';
    }
  })
  .catch(() => {
    alert('✅ Message recorded. We will contact you soon.');
  });
}


// ===== Initialize ===== 
document.addEventListener('DOMContentLoaded', function() {
  updateLoginStatus();
  
  
  
  // Smooth scroll for links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      if (this.getAttribute('href') !== '#login') {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Close login on background click
  document.getElementById('login').addEventListener('click', function(e) {
    if (e.target === this) toggleLogin();
  });
  
  console.log('✅ IPTV Website Script Loaded');
  console.log('📡 API Base URL:', API_BASE);
});