import { EmptyState, ErrorMessage, LoadingState, SuccessMessage } from "../components/StateMessages.js";
import { escapeHtml } from "../utils/format.js";

const PARAMETER_TYPES = ["string", "number", "boolean", "date", "datetime"];

export function ConfigurationPage({ configurations = [], loading = false, error = "", success = "" } = {}) {
  return `
    <section class="page-header">
      <div>
        <p class="eyebrow">Configuración</p>
        <h1>Parámetros</h1>
      </div>
    </section>
    ${ErrorMessage(error)}
    ${SuccessMessage(success)}
    <section class="configuration-layout">
      <section class="panel">
        <h2>Valores activos</h2>
        ${loading ? LoadingState() : ConfigurationTable(configurations)}
      </section>
      <form id="configuration-create-form" class="panel configuration-form">
        <h2>Crear parámetro</h2>
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
        <button type="submit" class="primary">Crear parámetro</button>
      </form>
    </section>
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
            <th>Valor por defecto</th>
            <th>Valor activo</th>
            <th>Estado</th>
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
  return `
    <tr>
      <td><strong>${escapeHtml(configuration.name)}</strong></td>
      <td>${escapeHtml(configuration.parameter_type)}</td>
      <td>${escapeHtml(formatValue(configuration.default_value, configuration.parameter_type))}</td>
      <td>
        <form class="configuration-value-form" data-configuration-form>
          <input type="hidden" name="configuration_id" value="${escapeHtml(configuration.id)}" />
          ${ValueControl(configuration, disabled)}
        </form>
      </td>
      <td>
        <span class="status-pill ${configuration.fixed_value ? "locked" : configuration.is_default ? "default" : "custom"}">
          ${configuration.fixed_value ? "Fijo" : configuration.is_default ? "Default" : "Personalizado"}
        </span>
      </td>
      <td class="row-actions">
        <button class="icon-button" type="submit" form="${escapeHtml(formId(configuration.id))}" ${disabled}>Guardar</button>
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
