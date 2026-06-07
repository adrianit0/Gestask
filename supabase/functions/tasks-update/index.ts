import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

const allowedTicketTypes = ["Bug", "Feature", "Task"];
const allowedPrStatuses = ["Not Finished", "Need PR", "PR Hecho", "Imputed", "Deployed"];
const allowedTaskPrStatuses = ["Not Finished", "Imputed"];
const editableFields = ["ticket", "assigned_date", "finished_date", "effort_points", "order_points", "priority", "task_status", "pr_status", "more_info"];

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "PATCH") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const body = await req.json().catch(() => ({}));
  if (!body.id) return errorResponse("Task id is required.", 400);

  const { data: current, error: currentError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", body.id)
    .eq("user_id", user.id)
    .single();

  if (currentError || !current) return errorResponse("Task not found.", 404);

  const patch: Record<string, unknown> = {};
  for (const field of editableFields) {
    if (body[field] !== undefined) patch[field] = body[field];
  }

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) return errorResponse("Title is required.", 400);
    patch.title = body.title.trim();
  }

  if (body.ticket_type !== undefined) {
    if (typeof body.ticket_type !== "string" || !allowedTicketTypes.includes(body.ticket_type)) {
      return errorResponse("Invalid ticket type.", 400);
    }
    patch.ticket_type = body.ticket_type;
  }

  if (body.limit_date !== undefined) {
    const limitDate = normalizeOptionalDate(body.limit_date);
    if (limitDate.error) return errorResponse("Invalid limit date.", 400);
    patch.limit_date = limitDate.value;
  }

  if (body.comments !== undefined) {
    const comments = normalizeComments(body.comments);
    if (comments.error) return errorResponse(comments.error, 400);
    patch.comments = comments.value;
  }

  const commentToAppend = body.comment ?? body.new_comment;
  if (commentToAppend !== undefined) {
    const nextComments = appendComment(current.comments, commentToAppend, user.id);
    if (nextComments.error) return errorResponse(nextComments.error, 400);
    patch.comments = nextComments.value;
  }

  const nextTicketType = String(patch.ticket_type ?? current.ticket_type ?? "Bug");
  const nextStatus = String(patch.task_status ?? current.task_status);
  const nextPrStatus = String(patch.pr_status ?? current.pr_status ?? "Not Finished");

  if (patch.pr_status !== undefined && !allowedPrStatuses.includes(nextPrStatus)) {
    return errorResponse("Invalid PR status.", 400);
  }

  if (nextTicketType === "Task" && patch.pr_status !== undefined && !allowedTaskPrStatuses.includes(nextPrStatus)) {
    return errorResponse("Invalid PR status for ticket type.", 400);
  }

  if (nextTicketType === "Task") {
    if (nextStatus === "Done") {
      if (!patch.finished_date && !current.finished_date) patch.finished_date = new Date().toISOString().slice(0, 10);
      patch.pr_status = "Imputed";
    } else {
      patch.finished_date = null;
      patch.pr_status = "Not Finished";
    }
  } else if (nextStatus === "Done") {
    if (!patch.finished_date && !current.finished_date) patch.finished_date = new Date().toISOString().slice(0, 10);
    if ((patch.pr_status ?? current.pr_status) === "Not Finished") patch.pr_status = "Need PR";
  } else {
    patch.finished_date = null;
    patch.pr_status = "Not Finished";
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ task: data });
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

function appendComment(currentComments: unknown, rawComment: unknown, userId: string): { value: unknown[]; error?: never } | { error: string; value?: never } {
  if (typeof rawComment !== "string" || !rawComment.trim()) return { error: "Comment is required." };

  const comments = Array.isArray(currentComments) ? currentComments : [];
  return {
    value: [
      ...comments,
      {
        text: rawComment.trim(),
        created_at: new Date().toISOString(),
        user_id: userId,
      },
    ],
  };
}

function isRealIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
