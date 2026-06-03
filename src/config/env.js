export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
};

export function assertConfig() {
  if (!config.supabaseUrl || !config.publishableKey) {
    return "Configura VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env.";
  }
  return null;
}
