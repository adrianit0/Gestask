import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "GET") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("tasks")
    .select("id,ticket,ticket_type,title,finished_date,effort_points,pr_status,pr_link,test_cases,imputed_date,task_status,created_at,updated_at")
    .eq("user_id", user.id)
    .eq("task_status", "Done")
    .or("and(ticket_type.eq.Task,pr_status.neq.Imputed),and(ticket_type.neq.Task,pr_status.neq.Deployed)");

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ tasks: data ?? [] });
});
