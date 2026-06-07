const allowedParameterTypes = ["string", "number", "boolean", "date", "datetime"] as const;

export type ConfigurationParameterType = typeof allowedParameterTypes[number];
type NormalizedConfigurationValue = { value: string; error?: never } | { error: string; value?: never };
type ScoringConfig = Record<string, number>;

type TaskLike = {
  ticket_type?: string | null;
  priority?: string | null;
  effort_points?: number | null;
  order_points?: number | null;
  assigned_date?: string | null;
  limit_date?: string | null;
  task_status?: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const defaultScoringConfig: ScoringConfig = {
  scoring_dias_pasadas: 0.05,
  scoring_prioridad: 5,
  scoring_puntos_esfuerzo: 1,
  scoring_orden: 1,
  scoring_dias_limites: 5,
  scoring_tipo_bug: 1,
  scoring_tipo_feature: 1,
  scoring_tipo_task: 1,
  scoring_estado_waiting: -1,
  scoring_estado_need_fix: 2,
  scoring_estado_warning: 1,
};

const priorityValues: Record<string, number> = {
  trivial: 1,
  menor: 2,
  prioritaria: 3,
  critica: 4,
  bloqueante: 5,
};

const finalTaskStatuses = new Set(["Done", "Undone", "Unfinished"]);

export function isAllowedParameterType(value: unknown): value is ConfigurationParameterType {
  return typeof value === "string" && allowedParameterTypes.includes(value as ConfigurationParameterType);
}

export function normalizeConfigurationValue(parameterType: ConfigurationParameterType, rawValue: unknown): NormalizedConfigurationValue {
  if (rawValue === null || rawValue === undefined) {
    return { error: "Configuration value is required." };
  }

  switch (parameterType) {
    case "string":
      return { value: String(rawValue) };
    case "number": {
      const value = typeof rawValue === "number" ? String(rawValue) : String(rawValue).trim();
      if (value === "" || !Number.isFinite(Number(value))) return { error: "Configuration value must be a valid number." };
      return { value };
    }
    case "boolean": {
      if (typeof rawValue === "boolean") return { value: String(rawValue) };
      const value = String(rawValue).trim().toLowerCase();
      if (value !== "true" && value !== "false") return { error: "Configuration value must be true or false." };
      return { value };
    }
    case "date": {
      const value = String(rawValue).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !isRealIsoDate(value)) {
        return { error: "Configuration value must be a valid date in YYYY-MM-DD format." };
      }
      return { value };
    }
    case "datetime": {
      const value = String(rawValue).trim();
      if (value === "" || Number.isNaN(Date.parse(value))) return { error: "Configuration value must be a valid datetime." };
      return { value };
    }
  }
}

export async function addScoringToTasks(supabase: any, userId: string, tasks: TaskLike[]) {
  const config = await getEffectiveScoringConfig(supabase, userId);
  return tasks.map((task) => ({ ...task, scoring: calculateTaskScoring(task, config) }));
}

export async function getEffectiveScoringConfig(supabase: any, userId: string): Promise<ScoringConfig> {
  const { data: configurations, error: configurationError } = await supabase
    .from("gestask_configuration")
    .select("id, name, parameter_type, default_value, fixed_value")
    .ilike("name", "scoring_%");

  if (configurationError) throw new Error(configurationError.message);

  const { data: profiles, error: profileError } = await supabase
    .from("gestask_configuration_profile")
    .select("configuration_id, value")
    .eq("user_id", userId);

  if (profileError) throw new Error(profileError.message);

  const profileByConfigurationId = new Map((profiles ?? []).map((profile: any) => [profile.configuration_id, profile]));
  const config = { ...defaultScoringConfig };

  for (const configuration of configurations ?? []) {
    if (configuration.parameter_type !== "number") continue;

    const profile = profileByConfigurationId.get(configuration.id);
    const rawValue = profile && !configuration.fixed_value ? profile.value : configuration.default_value;
    const numericValue = Number(rawValue);
    if (Number.isFinite(numericValue)) config[configuration.name] = numericValue;
  }

  return config;
}

export function calculateTaskScoring(task: TaskLike, config: ScoringConfig, now = new Date()) {
  if (finalTaskStatuses.has(String(task.task_status ?? ""))) return 0;

  const priorityValue = priorityValues[normalizeKey(task.priority)] ?? 0;
  const effortPoints = Number(task.effort_points ?? 0);
  const orderPoints = Number(task.order_points ?? 0);
  const today = toUtcDateOnly(now);
  const daysSinceAssigned = getDaysSince(task.assigned_date, today);
  const limitDateFactor = getLimitDateFactor(task.limit_date, today);
  const statusAdjustment = getStatusAdjustment(task.task_status, config);
  const ticketTypeMultiplier = getTicketTypeMultiplier(task.ticket_type, config);

  const baseScoring =
    (priorityValue * config.scoring_prioridad) +
    (safeNumber(effortPoints) * config.scoring_puntos_esfuerzo) +
    (safeNumber(orderPoints) * config.scoring_orden) +
    (daysSinceAssigned * config.scoring_dias_pasadas) +
    (limitDateFactor * config.scoring_dias_limites) +
    statusAdjustment;

  return roundScoring(baseScoring * ticketTypeMultiplier);
}

function getDaysSince(value: string | null | undefined, today: Date) {
  const date = parseIsoDate(value);
  if (!date) return 0;
  return Math.max(0, Math.floor((today.getTime() - date.getTime()) / DAY_MS));
}

function getLimitDateFactor(value: string | null | undefined, today: Date) {
  const limitDate = parseIsoDate(value);
  if (!limitDate) return 0;

  const daysRemaining = Math.floor((limitDate.getTime() - today.getTime()) / DAY_MS);
  if (daysRemaining < 0) return 1 + Math.abs(daysRemaining);
  if (daysRemaining === 0) return 1;
  return 1 / daysRemaining;
}

function getStatusAdjustment(status: string | null | undefined, config: ScoringConfig) {
  const key = `scoring_estado_${normalizeKey(status)}`;
  return config[key] ?? 0;
}

function getTicketTypeMultiplier(ticketType: string | null | undefined, config: ScoringConfig) {
  const key = `scoring_tipo_${normalizeKey(ticketType ?? "Bug")}`;
  return config[key] ?? 1;
}

function normalizeKey(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function roundScoring(value: number) {
  return Math.round(value * 100) / 100;
}

function parseIsoDate(value: string | null | undefined) {
  if (!value || !isRealIsoDate(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toUtcDateOnly(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function isRealIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
