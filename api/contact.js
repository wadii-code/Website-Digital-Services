import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { user_id, subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: "Missing fields" });

    await supabase.from("messages").insert({
      user_id: user_id || "guest",
      subject,
      message,
      created_at: new Date().toISOString()
    });

    return res.json({ success: true });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
