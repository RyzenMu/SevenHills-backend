import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
dotenv.config();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

// Use service role key ONLY in backend (never expose in frontend!)
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
