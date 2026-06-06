const allowedParameterTypes = ["string", "number", "boolean", "date", "datetime"] as const;

export type ConfigurationParameterType = typeof allowedParameterTypes[number];
type NormalizedConfigurationValue = { value: string; error?: never } | { error: string; value?: never };

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

function isRealIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
