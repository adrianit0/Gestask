import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "PATCH") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const body = await req.json().catch(() => ({}));

  if (typeof body.task_id !== "string" || !body.task_id) return errorResponse("Task id is required.", 400);
  if (typeof body.report_date !== "string" || !isRealIsoDate(body.report_date)) return errorResponse("Invalid date.", 400);
  if (typeof body.completed !== "boolean") return errorResponse("Invalid completion value.", 400);

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, ticket_type")
    .eq("id", body.task_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (taskError) return errorResponse(taskError.message, 400);
  if (!task) return errorResponse("Task not found.", 404);
  if (task.ticket_type !== "Diaria") return errorResponse("Task is not a daily task.", 400);

  const { data: report, error: reportError } = await supabase
    .from("daily_reports")
    .select("id")
    .eq("user_id", user.id)
    .eq("report_date", body.report_date)
    .maybeSingle();

  if (reportError) return errorResponse(reportError.message, 400);
  if (!report) return errorResponse("Daily report not found.", 404);

  const { data, error } = await supabase
    .from("daily_report_tasks")
    .update({ completed_at: body.completed ? new Date().toISOString() : null })
    .eq("daily_report_id", report.id)
    .eq("task_id", task.id)
    .select("task_id, completed_at")
    .maybeSingle();

  if (error) return errorResponse(error.message, 400);
  if (!data) return errorResponse("Daily task not found in report.", 404);

  return jsonResponse({ task_id: data.task_id, report_date: body.report_date, completed_at: data.completed_at });
});

function isRealIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
