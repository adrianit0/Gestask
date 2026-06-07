import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

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
  if (current.task_status !== "Done") return errorResponse("Invalid completion transition.", 400);

  const ticketType = String(current.ticket_type ?? "Bug");
  const prStatus = String(current.pr_status ?? "Not Finished");
  const patch = buildCompletionPatch(ticketType, prStatus, body);
  if ("error" in patch) return errorResponse(patch.error, 400);

  const { data, error } = await supabase
    .from("tasks")
    .update(patch.value)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ task: data });
});

function buildCompletionPatch(ticketType: string, prStatus: string, body: Record<string, unknown>) {
  if (prStatus === "Need PR") {
    if (ticketType === "Task") return { error: "Invalid completion transition." } as const;

    const patch: Record<string, unknown> = { pr_status: "Need to Impute" };

    if (body.pr_link !== undefined) {
      const prLink = normalizeOptionalText(body.pr_link);
      if ("error" in prLink) return prLink;
      patch.pr_link = prLink.value;
    }

    if (ticketType === "Feature" && body.test_cases !== undefined) {
      const testCases = normalizeOptionalText(body.test_cases);
      if ("error" in testCases) return testCases;
      patch.test_cases = testCases.value;
    }

    return { value: patch } as const;
  }

  if (prStatus === "Need to Impute") {
    const imputedDate = normalizeRequiredDate(body.imputed_date);
    if ("error" in imputedDate) return imputedDate;
    return { value: { pr_status: "Imputed", imputed_date: imputedDate.value } } as const;
  }

  if (prStatus === "Imputed") {
    if (ticketType === "Task") return { error: "Invalid completion transition." } as const;
    return { value: { pr_status: "Deployed" } } as const;
  }

  return { error: "Invalid completion transition." } as const;
}

function normalizeOptionalText(value: unknown): { value: string | null; error?: never } | { error: string; value?: never } {
  if (value === null || value === "") return { value: null };
  if (typeof value !== "string") return { error: "Invalid completion transition." };
  const trimmed = value.trim();
  return { value: trimmed === "" ? null : trimmed };
}

function normalizeRequiredDate(value: unknown): { value: string; error?: never } | { error: string; value?: never } {
  if (typeof value !== "string" || !isRealIsoDate(value)) return { error: "Invalid imputed date." };
  return { value };
}

function isRealIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
