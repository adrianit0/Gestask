import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

const DAILY_TICKET_TYPE = "Diaria";
const validDailyStatuses = ["To do", "Doing", "Draft", "Need Fix", "Waiting", "Warning"];
const today = () => new Date().toISOString().slice(0, 10);

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "POST") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const reportDate = today();

  const { data: existing } = await supabase
    .from("daily_reports")
    .select("id")
    .eq("user_id", user.id)
    .eq("report_date", reportDate)
    .maybeSingle();

  if (existing) return errorResponse("El parte diario está ya creado", 409);

  const { data: report, error: reportError } = await supabase
    .from("daily_reports")
    .insert({ user_id: user.id, report_date: reportDate })
    .select("*")
    .single();

  if (reportError) return errorResponse(reportError.message, 400);

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.id)
    .neq("ticket_type", DAILY_TICKET_TYPE)
    .in("task_status", validDailyStatuses);

  if (tasksError) return errorResponse(tasksError.message, 400);

  // Daily tasks are mandatory every day while their finished_date is not set.
  const { data: dailyTasks, error: dailyTasksError } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", user.id)
    .eq("ticket_type", DAILY_TICKET_TYPE)
    .is("finished_date", null);

  if (dailyTasksError) return errorResponse(dailyTasksError.message, 400);

  const rows = [...(tasks ?? []), ...(dailyTasks ?? [])].map((task) => ({ daily_report_id: report.id, task_id: task.id }));
  if (rows.length > 0) {
    const { error } = await supabase.from("daily_report_tasks").insert(rows);
    if (error) return errorResponse(error.message, 400);
  }

  return jsonResponse({ report, added_tasks: (tasks ?? []).length, added_daily_tasks: (dailyTasks ?? []).length }, 201);
});
