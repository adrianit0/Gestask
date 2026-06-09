import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

const finalStatuses = new Set(["Done", "Undone", "Unfinished"]);

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "GET") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("tasks")
    .select("id,ticket,ticket_type,title,order_points,priority,task_status,assigned_date,limit_date,created_at")
    .eq("user_id", user.id)
    .not("order_points", "is", null)
    .not("task_status", "in", "(Done,Undone,Unfinished)")
    .order("order_points", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  if (error) return errorResponse(error.message, 400);

  const tasks = (data ?? []).filter((task) => !finalStatuses.has(String(task.task_status)));
  return jsonResponse({ tasks });
});
