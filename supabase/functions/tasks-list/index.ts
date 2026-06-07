import { addScoringToTasks } from "../_shared/configuration.ts";
import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { parseTaskSort, sortTasks } from "../_shared/taskSorting.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "GET") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const url = new URL(req.url);

  const sort = parseTaskSort(url.searchParams, { sortBy: "created_at", sortDirection: "desc" });
  if ("error" in sort) return errorResponse(sort.error, 400);

  let query = supabase.from("tasks").select("*").eq("user_id", user.id);
  const status = url.searchParams.get("status");
  const priority = url.searchParams.get("priority");
  const date = url.searchParams.get("date");
  const search = url.searchParams.get("search");

  if (status) query = query.eq("task_status", status);
  if (priority) query = query.eq("priority", priority);
  if (date) query = query.eq("assigned_date", date);
  if (search) query = query.or(`title.ilike.%${search}%,ticket.ilike.%${search}%,more_info.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return errorResponse(error.message, 400);

  try {
    const tasks = await addScoringToTasks(supabase, user.id, data ?? []);
    return jsonResponse({ tasks: sortTasks(tasks, sort.sortBy, sort.sortDirection) });
  } catch (scoringError) {
    return errorResponse(scoringError instanceof Error ? scoringError.message : "Invalid scoring configuration.", 400);
  }
});
