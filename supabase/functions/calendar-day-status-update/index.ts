import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

const allowedStatuses = ["Laboral", "Vacaciones", "Festivos", "Ausencia"];

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "PATCH") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  const body = await req.json().catch(() => ({}));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.day ?? "")) return errorResponse("Valid day is required.", 400);
  if (!allowedStatuses.includes(body.status)) return errorResponse("Invalid status.", 400);

  const { data, error } = await supabase
    .from("calendar_day_statuses")
    .upsert({ user_id: user.id, day: body.day, status: body.status, note: body.note ?? null }, { onConflict: "user_id,day" })
    .select("*")
    .single();

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ day_status: data });
});
