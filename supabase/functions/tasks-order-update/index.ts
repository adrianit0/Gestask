import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

const finalStatuses = new Set(["Done", "Undone", "Unfinished"]);

type OrderUpdate = {
  id: string;
  order_points: number;
};

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "PATCH") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const body = await req.json().catch(() => ({}));

  const validation = validateUpdates(body.updates);
  if (validation.error) return errorResponse(validation.error, 400);
  const updates = validation.updates;

  const ids = updates.map((update) => update.id);
  const { data: currentTasks, error: currentError } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .in("id", ids);

  if (currentError) return errorResponse(currentError.message, 400);
  if ((currentTasks ?? []).length !== ids.length) return errorResponse("One or more tasks were not found.", 404);

  const currentById = new Map((currentTasks ?? []).map((task) => [String(task.id), task]));
  for (const update of updates) {
    const task = currentById.get(update.id);
    if (!task) return errorResponse("One or more tasks were not found.", 404);
    if (task.order_points === null || task.order_points === undefined) return errorResponse("Tasks without order points cannot be reordered.", 400);
    if (finalStatuses.has(String(task.task_status))) return errorResponse("Final tasks cannot be reordered.", 400);
  }

  const rows = updates.map((update) => ({
    ...currentById.get(update.id),
    order_points: update.order_points,
  }));
  const { error: updateError } = await supabase
    .from("tasks")
    .upsert(rows, { onConflict: "id" });

  if (updateError) return errorResponse(updateError.message, 400);

  const { data: tasks, error: listError } = await supabase
    .from("tasks")
    .select("id,ticket,ticket_type,title,order_points,priority,task_status,assigned_date,limit_date,created_at")
    .eq("user_id", user.id)
    .not("order_points", "is", null)
    .not("task_status", "in", "(Done,Undone,Unfinished)")
    .order("order_points", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  if (listError) return errorResponse(listError.message, 400);

  return jsonResponse({ tasks: (tasks ?? []).filter((task) => !finalStatuses.has(String(task.task_status))) });
});

function validateUpdates(value: unknown): { updates: OrderUpdate[]; error?: never } | { error: string; updates?: never } {
  if (!Array.isArray(value) || value.length === 0) return { error: "Updates cannot be empty." };

  const seen = new Set<string>();
  const updates: OrderUpdate[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") return { error: "Invalid update item." };
    const update = item as Record<string, unknown>;
    if (typeof update.id !== "string" || !update.id.trim()) return { error: "Task id is required." };
    if (seen.has(update.id)) return { error: "Duplicate task ids are not allowed." };
    const orderPoints = update.order_points;
    if (typeof orderPoints !== "number" || !Number.isInteger(orderPoints)) return { error: "Order points must be integers." };
    seen.add(update.id);
    updates.push({ id: update.id, order_points: orderPoints });
  }

  return { updates };
}
