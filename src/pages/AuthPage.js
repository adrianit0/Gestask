import { ErrorMessage, SuccessMessage } from "../components/StateMessages.js";

export function AuthPage({ mode = "login", error = "", success = "", configError = "" } = {}) {
  const isRegister = mode === "register";
  return `
    <main class="auth-screen">
      <section class="auth-card">
        <div class="auth-copy">
          <p class="eyebrow">Productividad personal laboral</p>
          <h1>Gestask</h1>
          <p>Gestiona backlog, parte diario y calendario de rendimiento desde una interfaz ligera.</p>
        </div>
        ${ErrorMessage(configError || error)}
        ${SuccessMessage(success)}
        <form id="auth-form" class="form-grid">
          <label>Email<input name="email" type="email" autocomplete="email" required /></label>
          <label>Contraseña<input name="password" type="password" autocomplete="current-password" required /></label>
          ${isRegister ? `
            <label>Nombre visible<input name="name" required /></label>
            <label>Usuario<input name="username" required /></label>
            <label>Avatar URL<input name="avatar_url" type="url" /></label>
          ` : ""}
          <button class="primary" type="submit" ${configError ? "disabled" : ""}>${isRegister ? "Crear cuenta" : "Entrar"}</button>
        </form>
        <button class="text-button" data-auth-mode="${isRegister ? "login" : "register"}">
          ${isRegister ? "Ya tengo cuenta" : "Crear cuenta nueva"}
        </button>
      </section>
    </main>
  `;
}
