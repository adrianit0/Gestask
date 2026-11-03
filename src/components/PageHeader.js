import { escapeHtml } from "../utils/format.js";

// Shared page heading: section (eyebrow), page name as in the side menu, optional description and actions (raw HTML).
export function PageHeader({ eyebrow = "", title, description = "", actions = "" }) {
  return `
    <section class="page-header">
      <div class="page-heading">
        ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
        <h1>${escapeHtml(title)}</h1>
        ${description ? `<p class="page-description">${escapeHtml(description)}</p>` : ""}
      </div>
      ${actions ? `<div class="page-header-actions">${actions}</div>` : ""}
    </section>
  `;
}

export function plusIcon() {
  return `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>`;
}
