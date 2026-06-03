import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "GET") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const url = new URL(req.url);
  const now = new Date();
  const year = Number(url.searchParams.get("year") ?? now.getFullYear());
  const month = Number(url.searchParams.get("month") ?? now.getMonth() + 1);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return errorResponse("Invalid year or month.", 400);
  }

  const firstDay = isoDate(year, month, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const lastDay = isoDate(year, month, daysInMonth);

  const { data: statuses, error: statusError } = await supabase
    .from("calendar_day_statuses")
    .select("day, status, note")
    .eq("user_id", user.id)
    .gte("day", firstDay)
    .lte("day", lastDay);

  if (statusError) return errorResponse(statusError.message, 400);

  const { data: doneTasks, error: taskError } = await supabase
    .from("tasks")
    .select("id, ticket, title, effort_points, finished_date")
    .eq("user_id", user.id)
    .eq("task_status", "Done")
    .gte("finished_date", firstDay)
    .lte("finished_date", lastDay);

  if (taskError) return errorResponse(taskError.message, 400);

  const statusByDay = new Map((statuses ?? []).map((item) => [item.day, item]));
  const tasksByDay = new Map<string, unknown[]>();
  for (const task of doneTasks ?? []) {
    const key = task.finished_date;
    tasksByDay.set(key, [...(tasksByDay.get(key) ?? []), task]);
  }

  const currentDay = new Date().toISOString().slice(0, 10);
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const dayNumber = index + 1;
    const date = isoDate(year, month, dayNumber);
    const jsDate = new Date(`${date}T00:00:00`);
    const isWeekend = jsDate.getDay() === 0 || jsDate.getDay() === 6;
    const manual = statusByDay.get(date) as { status: string; note?: string } | undefined;
    const tasks = (tasksByDay.get(date) ?? []) as Array<{ effort_points: number }>;
    const completed_points = tasks.reduce((sum, task) => sum + (task.effort_points ?? 0), 0);

    return {
      date,
      day: dayNumber,
      status: isWeekend ? "Finde" : manual?.status ?? "Laboral",
      note: manual?.note ?? null,
      is_today: date === currentDay,
      completed_points,
      completed_tasks: tasks,
    };
  });

  return jsonResponse({ year, month, days });
});
