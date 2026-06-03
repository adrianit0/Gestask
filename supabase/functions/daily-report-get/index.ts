import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

const today = () => new Date().toISOString().slice(0, 10);

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

  const { data: report, error } = await supabase
    .from("daily_reports")
    .select("id, user_id, report_date, created_at, daily_report_tasks(created_at, tasks(*))")
    .eq("user_id", user.id)
    .eq("report_date", date)
    .maybeSingle();

  if (error) return errorResponse(error.message, 400);

  const tasks = (report?.daily_report_tasks ?? [])
    .map((item: { tasks: unknown }) => item.tasks)
    .filter(Boolean)
    .sort((a: any, b: any) => {
      if (a.order_points == null && b.order_points == null) return 0;
      if (a.order_points == null) return 1;
      if (b.order_points == null) return -1;
      return b.order_points - a.order_points;
    });

  return jsonResponse({ report: report ? { ...report, daily_report_tasks: undefined } : null, tasks, editable: date === today() });
});
