import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();

// Middleware
app.use(cors(
  {
    origin: 'https://shoplinno.vercel.app', 
    credentials: true
  }
));
app.use(express.json());

// ===== SUPABASE SETUP =====
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// ===== API ENDPOINTS =====

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    server_time: new Date().toISOString(),
    endpoints: [
      "/api/health",
      "/api/test-db",
      "/api/check-tables",
      "/api/subscribe",
      "/api/contact",
      "/api/plans",
      "/api/register",
      "/api/login"
    ]
  });
});

// Test DB
app.get("/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .limit(1);

    if (error) {
      return res.json({ success: false, error: error.message });
    }

    res.json({ success: true, table_count: data?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Subscribe
app.post("/subscribe", async (req, res) => {
  try {
    const { user_id, plan_id, payment_method, customer_info } = req.body;

    if (!customer_info) {
      return res.status(400).json({ error: "Customer info missing" });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);

    if (plan_id === "monthly") endDate.setMonth(endDate.getMonth() + 1);
    else if (plan_id === "2monthls") endDate.setMonth(endDate.getMonth() + 2);
    else if (plan_id === "annual") endDate.setFullYear(endDate.getFullYear() + 1);
    else endDate.setMonth(endDate.getMonth() + 1);

    const { error: subError } = await supabase.from("subscriptions").insert({
      user_id,
      plan_id,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: "active",
      created_at: new Date().toISOString()
    });

    const { error: msgError } = await supabase.from("messages").insert({
      user_id,
      subject: "New IPTV Subscription - " + customer_info.email,
      message: `Name: ${customer_info.fullname}
Email: ${customer_info.email}
Phone: ${customer_info.phone || "N/A"}
Plan: ${plan_id}
Payment: ${payment_method}`,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      saved_to_db: !subError && !msgError
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Contact
app.post("/contact", async (req, res) => {
  const { user_id, subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: "Missing fields" });
  }

  await supabase.from("messages").insert({
    user_id: user_id || "guest",
    subject,
    message,
    created_at: new Date().toISOString()
  });

  res.json({ success: true });
});

// Plans
app.get("/plans", (req, res) => {
  res.json({
    success: true,
    plans: [
      { id: 1, name: "Monthly Plan", price: 10 },
      { id: 2, name: "2 Months Plan", price: 18 },
      { id: 3, name: "Annual Plan", price: 70 }
    ]
  });
});

// Register
app.post("/register", (req, res) => {
  const { fullname, email } = req.body;
  const userId = `user_${Date.now()}_${email.replace(/[@.]/g, "_")}`;

  res.json({
    success: true,
    user_id: userId,
    username: fullname.split(" ")[0] || "User"
  });
});

// Login
app.post("/login", (req, res) => {
  const { username } = req.body;
  res.json({
    success: true,
    user_id: `user_${Date.now()}`,
    username
  });
});

const PORT = process.env.PORT || 3001;


if (process.env.VERCEL === undefined) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// 🚀 EXPORT — NO app.listen()
export default app;
