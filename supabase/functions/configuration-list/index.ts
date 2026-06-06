import { errorResponse, handleOptions, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== "GET") return errorResponse("Method not allowed.", 405);

  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  const { data: configurations, error: configurationError } = await supabase
    .from("gestask_configuration")
    .select("id, name, parameter_type, default_value, fixed_value, created_at, updated_at")
    .order("name", { ascending: true });

  if (configurationError) return errorResponse(configurationError.message, 400);

  const { data: profiles, error: profileError } = await supabase
    .from("gestask_configuration_profile")
    .select("id, configuration_id, user_id, value, created_at, updated_at")
    .eq("user_id", user.id);

  if (profileError) return errorResponse(profileError.message, 400);

  const profileByConfigurationId = new Map((profiles ?? []).map((profile) => [profile.configuration_id, profile]));
  const items = (configurations ?? []).map((configuration) => {
    const profile = profileByConfigurationId.get(configuration.id);
    const usesProfile = profile !== undefined && !configuration.fixed_value;

    return {
      id: configuration.id,
      configuration_id: usesProfile ? profile?.configuration_id : null,
      profile_id: usesProfile ? profile?.id : null,
      user_id: user.id,
      name: configuration.name,
      parameter_type: configuration.parameter_type,
      default_value: configuration.default_value,
      value: usesProfile ? profile?.value : configuration.default_value,
      fixed_value: configuration.fixed_value,
      readonly: configuration.fixed_value,
      is_default: !usesProfile,
      created_at: configuration.created_at,
      updated_at: configuration.updated_at,
      profile_created_at: usesProfile ? profile?.created_at : null,
      profile_updated_at: usesProfile ? profile?.updated_at : null,
    };
  });

  return jsonResponse({ configurations: items });
});
