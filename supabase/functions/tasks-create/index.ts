import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

const allowedTicketTypes = ["Bug", "Feature", "Task"];
const allowedFields = ["ticket", "assigned_date", "effort_points", "order_points", "priority", "more_info"];

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "POST") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const body = await req.json().catch(() => ({}));

  if (typeof body.title !== "string" || !body.title.trim()) return errorResponse("Title is required.", 400);

  const ticketType = body.ticket_type ?? "Bug";
  if (typeof ticketType !== "string" || !allowedTicketTypes.includes(ticketType)) return errorResponse("Invalid ticket type.", 400);

  const limitDate = normalizeOptionalDate(body.limit_date);
  if (limitDate.error) return errorResponse("Invalid limit date.", 400);

  const comments = normalizeComments(body.comments);
  if (comments.error) return errorResponse(comments.error, 400);

  const payload: Record<string, unknown> = {
    user_id: user.id,
    title: body.title.trim(),
    ticket_type: ticketType,
    limit_date: limitDate.value,
    comments: comments.value,
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

function normalizeOptionalDate(value: unknown): { value: string | null; error?: never } | { error: string; value?: never } {
  if (value === undefined || value === null || value === "") return { value: null };
  if (typeof value !== "string" || !isRealIsoDate(value)) return { error: "Invalid limit date." };
  return { value };
}

function normalizeComments(value: unknown): { value: unknown[]; error?: never } | { error: string; value?: never } {
  if (value === undefined || value === null) return { value: [] };
  if (!Array.isArray(value)) return { error: "Comments must be an array." };
  return { value };
}

function isRealIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
