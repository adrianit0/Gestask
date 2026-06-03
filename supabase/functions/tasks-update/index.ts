import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

const editableFields = ["ticket", "assigned_date", "finished_date", "title", "effort_points", "order_points", "priority", "task_status", "pr_status", "more_info"];

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "PATCH") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const body = await req.json().catch(() => ({}));
  if (!body.id) return errorResponse("Task id is required.", 400);

  const { data: current, error: currentError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", body.id)
    .eq("user_id", user.id)
    .single();

  if (currentError || !current) return errorResponse("Task not found.", 404);

  const patch: Record<string, unknown> = {};
  for (const field of editableFields) {
    if (body[field] !== undefined) patch[field] = body[field];
  }

  const nextStatus = String(patch.task_status ?? current.task_status);
  if (nextStatus === "Done") {
    if (!patch.finished_date && !current.finished_date) patch.finished_date = new Date().toISOString().slice(0, 10);
    if ((patch.pr_status ?? current.pr_status) === "Not Finished") patch.pr_status = "Need PR";
  } else {
    patch.finished_date = null;
    patch.pr_status = "Not Finished";
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ task: data });
});
