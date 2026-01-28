
// backend/server.js - DEBUG VERSION
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');


const app = express();
require('dotenv').config();

const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ===== SUPABASE SETUP =====
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

// Create Supabase client with more debugging
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔧 Supabase Key (first 20 chars):', supabaseKey.substring(0, 20) + '...');

// ===== API ENDPOINTS =====

// 1. Test database connection
app.get('/api/test-db', async (req, res) => {  
  try {
    // Test by selecting from subscriptions table
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Database test failed:', error.message);
      return res.json({ 
        success: false, 
        error: error.message,
        hint: 'Check if tables exist and RLS policies'
      });
    }
    
    console.log('✅ Database test successful');
    console.log('Tables accessible:', data !== null);
    
    res.json({ 
      success: true, 
      message: 'Database connected!',
      table_count: data ? data.length : 0
    });
    
  } catch (error) {
    console.log('❌ Database test error:', error.message);
    res.json({ success: false, error: error.message });
  }
});

// 2. Create subscription - FIXED VERSION
app.post('/api/subscribe', async (req, res) => {
  console.log('\n📥 Received subscription request:', req.body);
  
  try {
    const { user_id, plan_id, payment_method, customer_info } = req.body;
    
    if (!customer_info) {
      return res.status(400).json({ error: 'Customer info missing' });
    }
    
    console.log('📊 Processing for:', customer_info.email);
    
    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    // Dynamically set end_date based on plan_id
    if (plan_id === 'monthly') { // Monthly Plan
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan_id === '2monthls') { // 2 Months Plan
      endDate.setMonth(endDate.getMonth() + 2);
    } else if (plan_id === 'annual') { // Annual Plan
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else { // Default fallback
      endDate.setMonth(endDate.getMonth() + 1);
    }


    // 1. First, try to insert into subscriptions
    console.log('💾 Attempting to save to subscriptions table...');
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user_id,
        plan_id: plan_id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select();

    if (subscriptionError) {
      console.log('❌ Subscription insert error:', subscriptionError.message);
      console.log('💡 Hint: Check if subscriptions table exists and has correct columns');
    } else {
      console.log('✅ Subscription saved:', subscriptionData);
    }

    // 2. Try to save message
    console.log('💾 Attempting to save to messages table...');
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        user_id: user_id,
        subject: 'New IPTV Subscription - ' + customer_info.email,
        message: `Name: ${customer_info.fullname}\nEmail: ${customer_info.email}\nPhone: ${customer_info.phone || 'N/A'}\nPlan: ${plan_id}\nPayment: ${payment_method}`,
        created_at: new Date().toISOString()
      })
      .select();

    if (messageError) {
      console.log('❌ Message insert error:', messageError.message);
      console.log('💡 Hint: Check if messages table exists');
    } else {
      console.log('✅ Message saved:', messageData);
    }

    // Log to console for backup
    console.log('🎉 NEW SUBSCRIPTION RECEIVED:');
    console.log('Name:', customer_info.fullname);
    console.log('Email:', customer_info.email);
    console.log('Phone:', customer_info.phone || 'N/A');
    console.log('Plan ID:', plan_id);
    console.log('User ID:', user_id);
    console.log('Time:', new Date().toLocaleString());
    console.log('----------------------------------------\n');

    // Always respond successfully
    res.json({
      success: true,
      message: 'Subscription received! Check your email for confirmation.',
      customer_email: customer_info.email,
      saved_to_db: !subscriptionError && !messageError,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Fatal error in /api/subscribe:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Please contact: Shoplinnocentre@gmail.com'
    });
  }
});

// 3. Contact form - FIXED
app.post('/api/contact', async (req, res) => {
  console.log('\n📧 Contact form submission:', req.body);
  
  try {
    const { user_id, subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message required' });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        user_id: user_id || 'guest',
        subject: subject,
        message: message,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.log('❌ Contact form error:', error.message);
      console.log('Data attempted:', { user_id, subject, message });
    } else {
      console.log('✅ Contact message saved:', data);
    }

    // Always log to console
    console.log('📝 CONTACT FORM:');
    console.log('Subject:', subject);
    console.log('Message preview:', message.substring(0, 100) + '...');
    console.log('User:', user_id || 'guest');
    console.log('Time:', new Date().toLocaleString());
    console.log('----------------------------------------\n');

    res.json({
      success: true,
      message: 'Message received! We will contact you soon.',
      saved_to_db: !error
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.json({
      success: true,
      message: 'Message logged locally. Contact: Shoplinnocentre@gmail.com'
    });
  }
});

// 4. Check database tables
app.get('/api/check-tables', async (req, res) => {
  try {
    console.log('🔍 Checking database tables...');
    
    // Check subscriptions table
    const { data: subs, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5);
    
    // Check messages table
    const { data: msgs, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .limit(5);
    
    // Check plans table
    const { data: plans, error: planError } = await supabase
      .from('plans')
      .select('*');
    
    console.log('📊 Table status:');
    console.log('- Subscriptions:', subError ? 'Error: ' + subError.message : 'OK (' + (subs?.length || 0) + ' rows)');
    console.log('- Messages:', msgError ? 'Error: ' + msgError.message : 'OK (' + (msgs?.length || 0) + ' rows)');
    console.log('- Plans:', planError ? 'Error: ' + planError.message : 'OK (' + (plans?.length || 0) + ' rows)');
    
    res.json({
      success: true,
      tables: {
        subscriptions: {
          exists: !subError,
          error: subError?.message,
          count: subs?.length || 0,
          sample: subs || []
        },
        messages: {
          exists: !msgError,
          error: msgError?.message,
          count: msgs?.length || 0,
          sample: msgs || []
        },
        plans: {
          exists: !planError,
          error: planError?.message,
          count: plans?.length || 0,
          sample: plans || []
        }
      }
    });
    
  } catch (error) {
    console.error('Check tables error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Simple endpoints (unchanged)
app.get('/api/plans', async (req, res) => {
  const plans = [
    { id: 1, name: 'Monthly Plan', price: 10 },
    { id: 2, name: '2 Months Plan', price: 18 },
    { id: 3, name: 'Annual Plan', price: 70 }
  ];
  res.json({ success: true, plans });
});

app.post('/api/register', (req, res) => {
  const { fullname, email } = req.body;
  const userId = `user_${Date.now()}_${email.replace(/[@.]/g, '_')}`;
  
  console.log('👤 New registration:', email);
  
  res.json({
    success: true,
    user_id: userId,
    username: fullname.split(' ')[0] || 'User'
  });
});

app.post('/api/login', (req, res) => {
  const { username } = req.body;
  const userId = `user_${Date.now()}_${username.replace(/\s+/g, '_')}`;
  
  res.json({
    success: true,
    user_id: userId,
    username: username
  });
});

// 6. Health check with more info
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    server_time: new Date().toISOString(),
    supabase_connected: true,
    endpoints: [
      '/api/health',
      '/api/test-db',
      '/api/check-tables',
      '/api/subscribe',
      '/api/contact',
      '/api/plans',
      '/api/register',
      '/api/login'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 IPTV Backend Server - DEBUG MODE');
  console.log('📡 http://localhost:' + PORT);
  console.log('\n🔧 To test database connection:');
  console.log('1. http://localhost:3001/api/test-db');
  console.log('2. http://localhost:3001/api/check-tables');
  console.log('\n⚠️  If data is not saving, check:');
  console.log('- Tables exist in Supabase');
  console.log('- Row Level Security (RLS) is disabled or has proper policies');
  console.log('- Table columns match the insert query');
  console.log('\n📧 Support: Shoplinnocentre@gmail.com');
  console.log('='.repeat(50) + '\n');
  console.log('nigga : ' + process.env.SUPABASE_URL);
});