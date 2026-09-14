import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

const today = () => new Date().toISOString().slice(0, 10);

type PendingRow = {
  daily_reports: { report_date: string } | null;
  tasks: { id: string; ticket: string | null; title: string; more_info: string | null; finished_date: string | null } | null;
};

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "GET") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("daily_report_tasks")
    .select("daily_reports!inner(report_date, user_id), tasks!inner(id, ticket, title, more_info, ticket_type, finished_date)")
    .is("completed_at", null)
    .eq("daily_reports.user_id", user.id)
    .eq("tasks.ticket_type", "Diaria");

  if (error) return errorResponse(error.message, 400);

  const items = ((data ?? []) as unknown as PendingRow[])
    .filter((row) => row.daily_reports && row.tasks)
    // A finished daily task is no longer required from its finished_date onwards.
    .filter((row) => !row.tasks!.finished_date || row.daily_reports!.report_date < row.tasks!.finished_date)
    .map((row) => ({
      task_id: row.tasks!.id,
      ticket: row.tasks!.ticket,
      title: row.tasks!.title,
      more_info: row.tasks!.more_info,
      report_date: row.daily_reports!.report_date,
    }))
    .sort((a, b) => a.report_date.localeCompare(b.report_date) || a.title.localeCompare(b.title));

  return jsonResponse({ today: today(), items });
});
