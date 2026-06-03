import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse } from "./http.ts";

export function getSupabaseClient(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
}

export async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { response: errorResponse("Authentication required.", 401) };
  }

  const supabase = getSupabaseClient(req);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { response: errorResponse("Invalid or expired session.", 401) };
  }

  return { supabase, user: data.user };
}
