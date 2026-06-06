import { normalizeConfigurationValue } from "../_shared/configuration.ts";
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

  if (!body.configuration_id) return errorResponse("Configuration id is required.", 400);

  const { data: configuration, error: configurationError } = await supabase
    .from("gestask_configuration")
    .select("id, name, parameter_type, default_value, fixed_value")
    .eq("id", body.configuration_id)
    .single();

  if (configurationError || !configuration) return errorResponse("Configuration parameter not found.", 404);
  if (configuration.fixed_value) return errorResponse("Fixed configuration values cannot be modified.", 400);

  const normalized = normalizeConfigurationValue(configuration.parameter_type, body.value);
  if (normalized.error) return errorResponse(normalized.error, 400);

  if (normalized.value === configuration.default_value) {
    const { error } = await supabase
      .from("gestask_configuration_profile")
      .delete()
      .eq("configuration_id", configuration.id)
      .eq("user_id", user.id);

    if (error) return errorResponse(error.message, 400);
    return jsonResponse({
      configuration: {
        id: configuration.id,
        configuration_id: null,
        profile_id: null,
        user_id: user.id,
        name: configuration.name,
        parameter_type: configuration.parameter_type,
        default_value: configuration.default_value,
        value: configuration.default_value,
        fixed_value: configuration.fixed_value,
        readonly: false,
        is_default: true,
      },
    });
  }

  const { data: profile, error } = await supabase
    .from("gestask_configuration_profile")
    .upsert(
      { configuration_id: configuration.id, user_id: user.id, value: normalized.value },
      { onConflict: "configuration_id,user_id" },
    )
    .select("id, configuration_id, user_id, value, created_at, updated_at")
    .single();

  if (error) return errorResponse(error.message, 400);
  return jsonResponse({
    configuration: {
      id: configuration.id,
      configuration_id: profile.configuration_id,
      profile_id: profile.id,
      user_id: profile.user_id,
      name: configuration.name,
      parameter_type: configuration.parameter_type,
      default_value: configuration.default_value,
      value: profile.value,
      fixed_value: configuration.fixed_value,
      readonly: false,
      is_default: false,
      profile_created_at: profile.created_at,
      profile_updated_at: profile.updated_at,
    },
  });
});
