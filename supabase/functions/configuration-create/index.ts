import { isAllowedParameterType, normalizeConfigurationValue } from "../_shared/configuration.ts";
import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "POST") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase } = auth;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();

  if (!name) return errorResponse("Configuration name is required.", 400);
  if (!isAllowedParameterType(body.parameter_type)) return errorResponse("Invalid configuration parameter type.", 400);
  if (typeof body.fixed_value !== "boolean") return errorResponse("Configuration fixed_value must be boolean.", 400);

  const normalized = normalizeConfigurationValue(body.parameter_type, body.default_value);
  if (normalized.error) return errorResponse(normalized.error, 400);

  const { data, error } = await supabase
    .from("gestask_configuration")
    .insert({
      name,
      parameter_type: body.parameter_type,
      default_value: normalized.value,
      fixed_value: body.fixed_value,
    })
    .select("id, name, parameter_type, default_value, fixed_value, created_at, updated_at")
    .single();

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({ configuration: data }, 201);
});
