import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

const validDailyStatuses = ["To do", "Doing", "Draft", "Need Fix", "Waiting", "Warning"];
const today = () => new Date().toISOString().slice(0, 10);
const previousDate = (date: string) => {
  const previous = new Date(`${date}T00:00:00.000Z`);
  previous.setUTCDate(previous.getUTCDate() - 1);
  return previous.toISOString().slice(0, 10);
};

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

  const { data: previousReport } = await supabase
    .from("daily_reports")
    .select("id, report_date, daily_report_tasks(task_id)")
    .eq("user_id", user.id)
    .eq("report_date", previousDate(reportDate))
    .maybeSingle();

  const previousTaskIds = (previousReport?.daily_report_tasks ?? []).map((item: { task_id: string }) => item.task_id);
  if (previousTaskIds.length > 0) {
    await supabase
      .from("tasks")
      .update({ task_status: "Unfinished" })
      .eq("user_id", user.id)
      .in("id", previousTaskIds)
      .neq("task_status", "Done")
      .neq("task_status", "Undone");
  }

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
    .in("task_status", validDailyStatuses);

  if (tasksError) return errorResponse(tasksError.message, 400);

  const rows = (tasks ?? []).map((task) => ({ daily_report_id: report.id, task_id: task.id }));
  if (rows.length > 0) {
    const { error } = await supabase.from("daily_report_tasks").insert(rows);
    if (error) return errorResponse(error.message, 400);
  }

  return jsonResponse({ report, added_tasks: rows.length }, 201);
});
