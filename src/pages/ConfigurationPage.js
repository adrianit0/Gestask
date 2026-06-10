import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { closeIcon } from "../components/TaskTable.js";
import { escapeHtml } from "../utils/format.js";

const PARAMETER_TYPES = ["string", "number", "boolean", "date", "datetime"];

export function ConfigurationPage({ configurations = [], loading = false, error = "", success = "", showCreateModal = false } = {}) {
  return `
    <section class="page-header">
      <div>
        <p class="eyebrow">Configuración</p>
        <h1>Parámetros</h1>
      </div>
      <button class="primary" data-open-configuration-modal>Crear parámetro</button>
    </section>
    ${ErrorMessage(error)}
    ${SuccessMessage(success)}
    <section class="panel">
      <h2>Valores activos</h2>
      ${loading ? LoadingState() : ConfigurationTable(configurations)}
    </section>
    ${showCreateModal ? ConfigurationCreateModal() : ""}
  `;
}

function ConfigurationCreateModal() {
  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="configuration-modal-title">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Configuración</p>
            <h2 id="configuration-modal-title">Crear parámetro</h2>
          </div>
          <button class="icon-button close-icon-button" data-close-configuration-modal aria-label="Cerrar">${closeIcon()}</button>
        </div>
        <form id="configuration-create-form" class="configuration-form">
          <label>Nombre
            <input name="name" required placeholder="Ej. puntos_objetivo_diarios" />
          </label>
          <label>Tipo
            <select name="parameter_type" required data-create-parameter-type>
              ${PARAMETER_TYPES.map((type) => `<option value="${type}">${type}</option>`).join("")}
            </select>
          </label>
          <label>Valor por defecto
            <input name="default_value" required data-create-default-value />
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="fixed_value" value="true" />
            Valor fijo para todos los usuarios
          </label>
          <div class="modal-actions span-2">
            <button type="button" class="secondary" data-close-configuration-modal>Cancelar</button>
            <button type="submit" class="primary">Crear parámetro</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function ConfigurationTable(configurations) {
  if (!configurations.length) return EmptyState("Aún no hay parámetros de configuración.");

  return `
    <div class="table-wrap">
      <table class="task-table configuration-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Valor activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${configurations.map(ConfigurationRow).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function ConfigurationRow(configuration) {
  const disabled = configuration.readonly ? "disabled" : "";
  const canReset = !configuration.is_default && !configuration.readonly && !configuration.fixed_value;
  return `
    <tr>
      <td><strong>${escapeHtml(configuration.name)}</strong></td>
      <td>${escapeHtml(configuration.parameter_type)}</td>
      <td>
        <form class="configuration-value-form" data-configuration-form>
          <input type="hidden" name="configuration_id" value="${escapeHtml(configuration.id)}" />
          ${ValueControl(configuration, disabled)}
        </form>
      </td>
      <td class="row-actions">
        <button class="icon-button" type="submit" form="${escapeHtml(formId(configuration.id))}" ${disabled}>Guardar</button>
        ${canReset ? `<button class="icon-button reset-icon-button" type="button" data-reset-configuration="${escapeHtml(configuration.id)}" title="Valor por defecto: ${escapeHtml(formatValue(configuration.default_value, configuration.parameter_type))}" aria-label="Volver al valor por defecto">${undoIcon()}</button>` : ""}
        ${configuration.readonly ? `<span class="muted-text">No editable</span>` : ""}
      </td>
    </tr>
  `.replace("<form class=\"configuration-value-form\"", `<form id="${escapeHtml(formId(configuration.id))}" class="configuration-value-form"`);
}

function ValueControl(configuration, disabled) {
  const value = escapeHtml(inputValue(configuration.value, configuration.parameter_type));
  const name = "value";

  if (configuration.parameter_type === "boolean") {
    return `
      <select name="${name}" ${disabled}>
        <option value="true" ${String(configuration.value) === "true" ? "selected" : ""}>true</option>
        <option value="false" ${String(configuration.value) === "false" ? "selected" : ""}>false</option>
      </select>
    `;
  }

  if (configuration.parameter_type === "date") {
    return `<input type="date" name="${name}" value="${value}" required ${disabled} />`;
  }

  if (configuration.parameter_type === "datetime") {
    return `<input type="datetime-local" name="${name}" value="${value}" required ${disabled} />`;
  }

  if (configuration.parameter_type === "number") {
    return `<input type="number" name="${name}" value="${value}" required step="any" ${disabled} />`;
  }

  return `<input name="${name}" value="${value}" required ${disabled} />`;
}

function undoIcon() {
  return `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M9 14 4 9l5-5"></path>
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"></path>
    </svg>
  `;
}

function formId(id) {
  return `configuration-form-${id}`;
}

function inputValue(value, parameterType) {
  if (parameterType !== "datetime") return value ?? "";
  return String(value ?? "").slice(0, 16);
}

function formatValue(value, parameterType) {
  if (parameterType !== "datetime") return value ?? "";
  return String(value ?? "").replace("T", " ").slice(0, 16);
}
