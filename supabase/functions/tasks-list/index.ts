import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "GET") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const url = new URL(req.url);

  let query = supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");
  const date = url.searchParams.get("date");
  const search = url.searchParams.get("search");

  if (status) query = query.eq("task_status", status);
  if (priority) query = query.eq("priority", priority);
  if (date) query = query.eq("assigned_date", date);
  if (search) query = query.or(`title.ilike.%${search}%,ticket.ilike.%${search}%,more_info.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ tasks: data ?? [] });
});
