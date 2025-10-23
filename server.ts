import express from "express";
import bodyParser from "body-parser";
import { supabase } from "./supabaseClient";
import cors from "cors";
import pkg from 'pg';



const app = express();
app.use(bodyParser.json());

// Enable CORS
app.use(cors({
  origin: ["https://ryzenmu.github.io",
    "http://localhost:5173"
  ],  // allow your frontend domain
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

//Neon DB connection
const {Pool} = pkg;
const pool = new Pool({
  connectionString: process.env.NEON_DB_STRING || "postgresql://neondb_owner:npg_j6z9qAIJNWpM@ep-falling-shadow-a1vl0r93-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

// 🔹 1. Register User (Sign Up)
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ user: data.user, message: "Verification email sent" });
});

// 🔹 2. Login User
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ session: data.session, user: data.user });
});

// 🔹 3. Resend Verification Email
app.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Verification email resent" });
});

// 🔹 4. Get Current User (if session JWT provided)
app.get("/me", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).json({ error: "No token" });

  const { data, error } = await supabase.auth.getUser(token);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ user: data.user });
});

// 🔹 5. Logout (invalidate session token)
app.post("/logout", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) return res.status(401).json({ error: "No token" });

  const { error } = await supabase.auth.admin.signOut(token);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Logged out" });
});

// ===========================================
// 🔹 TWEETS ENDPOINTS
// ===========================================

// ➕ Create new tweet
app.post("/tweets", async (req, res) => {
  try {
    const { text, media_url } = req.body;
    if (!text) return res.status(400).json({ error: "Tweet text is required" });

    const result = await pool.query(
      `INSERT INTO sevenhills_tweets (text, media_url)
       VALUES ($1, $2)
       RETURNING *;`,
      [text, media_url]
    );

    res.status(201).json({ tweet: result.rows[0] });
  } catch (err) {
    console.error("Error inserting tweet:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// create a new tweet for Android
app.post("tweets-android", async (req, res) => {
  
})

// 🟡 Get all tweets
app.get("/tweets", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM sevenhills_tweets ORDER BY id DESC;`);
    res.json({ tweets: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tweets" });
  }
});

// 🟢 Toggle completed
app.put("/tweets/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE sevenhills_tweets
       SET completed = NOT completed,
           completed_time = CASE WHEN completed = FALSE THEN NOW() ELSE NULL END
       WHERE id = $1
       RETURNING *;`,
      [id]
    );
    res.json({ tweet: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update tweet" });
  }
});

// 🔴 Soft delete
app.delete("/tweets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE sevenhills_tweets SET deleted = TRUE WHERE id = $1;`, [id]);
    res.json({ message: "Tweet deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete tweet" });
  }
});


const PORT = process.env.PORT || 4000;



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

