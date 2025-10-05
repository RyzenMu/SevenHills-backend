import express from "express";
import bodyParser from "body-parser";
import { supabase } from "./supabaseClient";



const app = express();
app.use(bodyParser.json());

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




// Start server
app.listen(4000, () => {
  console.log("Auth backend running on http://localhost:4000");
});
