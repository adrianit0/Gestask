import { addScoringToTasks } from "../_shared/configuration.ts";
import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { parseTaskSort, sortTasks } from "../_shared/taskSorting.ts";
import { requireUser } from "../_shared/supabase.ts";

const DAILY_TICKET_TYPE = "Diaria";
const today = () => new Date().toISOString().slice(0, 10);

type ReportItem = { completed_at: string | null; tasks: Record<string, any> | null };

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "GET") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return errorResponse("Invalid date.", 400);

  const sort = parseTaskSort(url.searchParams, { sortBy: "order_points", sortDirection: "desc" });
  if ("error" in sort) return errorResponse(sort.error, 400);

  const { data: report, error } = await supabase
    .from("daily_reports")
    .select("id, user_id, report_date, created_at, daily_report_tasks(created_at, completed_at, tasks(*))")
    .eq("user_id", user.id)
    .eq("report_date", date)
    .maybeSingle();

  if (error) return errorResponse(error.message, 400);

  const reportItems = ((report?.daily_report_tasks ?? []) as ReportItem[]).filter((item) => item.tasks);
  const reportTasks = reportItems
    .filter((item) => item.tasks!.ticket_type !== DAILY_TICKET_TYPE)
    .map((item) => item.tasks);
  // Daily tasks are returned apart from the regular ones, with the completion mark of this report.
  const dailyTasks = reportItems
    .filter((item) => item.tasks!.ticket_type === DAILY_TICKET_TYPE)
    .map((item) => ({ ...item.tasks, completed_at: item.completed_at ?? null }))
    .sort((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")));

  let tasks;
  try {
    tasks = await addScoringToTasks(supabase, user.id, reportTasks as any[]);
  } catch (scoringError) {
    return errorResponse(scoringError instanceof Error ? scoringError.message : "Invalid scoring configuration.", 400);
  }

  return jsonResponse({ report: report ? { ...report, daily_report_tasks: undefined } : null, tasks: sortTasks(tasks, sort.sortBy, sort.sortDirection), daily_tasks: dailyTasks, editable: date === today() });
});
