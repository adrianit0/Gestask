import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "DELETE") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const body = await req.json().catch(() => ({}));
  if (!body.id) return errorResponse("Task id is required.", 400);

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return errorResponse(error.message, 400);
  if (!data) return errorResponse("Task not found.", 404);
  return jsonResponse({ deleted: data.id });
});
