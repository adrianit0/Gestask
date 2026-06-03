import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

const allowedFields = ["ticket", "assigned_date", "title", "effort_points", "order_points", "priority", "more_info"];

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "POST") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const body = await req.json().catch(() => ({}));

  if (!body.title?.trim()) return errorResponse("Title is required.", 400);

  const payload: Record<string, unknown> = {
    user_id: user.id,
    title: body.title.trim(),
    effort_points: body.effort_points ?? 3,
    priority: body.priority ?? "Menor",
    task_status: "To do",
    pr_status: "Not Finished",
  };

  for (const field of allowedFields) {
    if (body[field] !== undefined) payload[field] = body[field];
  }

  const { data, error } = await supabase.from("tasks").insert(payload).select("*").single();
  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ task: data }, 201);
});
