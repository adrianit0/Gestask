import { ErrorMessage, SuccessMessage } from "../components/StateMessages.js";

const FEATURES = [
  "Backlog, Kanban y orden manual de tareas",
  "Parte diario con horario planificado por esfuerzo",
  "Calendario laboral y gráficas de rendimiento",
];

export function AuthPage({ mode = "login", error = "", success = "", configError = "" } = {}) {
  const isRegister = mode === "register";
  return `
    <main class="auth-screen">
      <section class="auth-card">
        <div class="auth-copy">
          <div class="auth-brand">
            <img src="${import.meta.env.BASE_URL}icon.png" alt="" />
            <span>Gestask</span>
          </div>
          <div>
            <p class="auth-eyebrow">Productividad personal laboral</p>
            <h1>Organiza tu trabajo del día a día.</h1>
          </div>
          <ul class="auth-features">
            ${FEATURES.map((feature) => `<li>${feature}</li>`).join("")}
          </ul>
        </div>
        <div class="auth-form-panel">
          <div class="segmented auth-tabs" role="tablist" aria-label="Acceso">
            <button type="button" role="tab" class="chart-menu-item ${isRegister ? "" : "active"}" aria-selected="${!isRegister}" data-auth-mode="login">Entrar</button>
            <button type="button" role="tab" class="chart-menu-item ${isRegister ? "active" : ""}" aria-selected="${isRegister}" data-auth-mode="register">Crear cuenta</button>
          </div>
          <div>
            <h2>${isRegister ? "Crea tu cuenta" : "Bienvenido de nuevo"}</h2>
            <p class="muted-text">${isRegister ? "Completa tus datos para empezar a usar Gestask." : "Accede con tu email y contraseña."}</p>
          </div>
          ${ErrorMessage(configError || error)}
          ${SuccessMessage(success)}
          <form id="auth-form" class="auth-form">
            <label>Email<input name="email" type="email" autocomplete="email" required autofocus /></label>
            <label>Contraseña<input name="password" type="password" autocomplete="${isRegister ? "new-password" : "current-password"}" required /></label>
            ${isRegister ? `
              <label>Nombre visible<input name="name" autocomplete="name" required /></label>
              <label>Usuario<input name="username" autocomplete="username" required /></label>
              <label>Avatar URL <span class="optional">(opcional)</span><input name="avatar_url" type="url" /></label>
            ` : ""}
            <button class="primary button-lg" type="submit" ${configError ? "disabled" : ""}>${isRegister ? "Crear cuenta" : "Entrar"}</button>
          </form>
        </div>
      </section>
    </main>
  `;
}
