import { escapeHtml } from "./format.js";

export const EXTERNAL_PAGE_CONFIGURATION_NAME = "project-external-page";
export const TICKET_MODEL_CONFIGURATION_NAME = "project-ticket-model";
export const TICKET_ORDER_CONFIGURATION_NAME = "project-ticket-order";

const emptySettings = { externalPage: "", ticketModel: "", ticketOrder: "" };

let settings = { ...emptySettings };

export function applyProjectSettings(configurations = []) {
  settings = {
    externalPage: readConfigurationValue(configurations, EXTERNAL_PAGE_CONFIGURATION_NAME),
    ticketModel: readConfigurationValue(configurations, TICKET_MODEL_CONFIGURATION_NAME),
    ticketOrder: readConfigurationValue(configurations, TICKET_ORDER_CONFIGURATION_NAME),
  };
  return settings;
}

export function getProjectSettings() {
  return settings;
}

export function hasExternalPage() {
  return Boolean(settings.externalPage);
}

export function buildTicketUrl(ticket) {
  const base = settings.externalPage;
  const value = String(ticket ?? "").trim();
  if (!base || !value) return "";

  const encoded = encodeURIComponent(value);
  if (base.includes("{ticket}")) return base.split("{ticket}").join(encoded);
  return `${base.replace(/\/+$/, "")}/${encoded}`;
}

export function ticketLinkHtml(ticket, { fallback = "-" } = {}) {
  const value = String(ticket ?? "").trim();
  if (!value) return fallback;

  const url = buildTicketUrl(value);
  if (!url) return escapeHtml(value);
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`;
}

export function isTicketNumberingEnabled() {
  return Boolean(settings.ticketModel && isTicketOrderValue(settings.ticketOrder));
}

export function buildNextTicket() {
  if (!isTicketNumberingEnabled()) return "";
  return applyTicketOrder(settings.ticketModel, settings.ticketOrder);
}

export function applyTicketOrder(model, order) {
  const template = String(model ?? "").trim();
  const value = String(order ?? "").trim();
  if (!template || !isTicketOrderValue(value)) return "";

  const placeholder = template.match(/X+/);
  if (!placeholder) return `${template}${value}`;

  const number = String(Number(value));
  const padded = number.padStart(Math.max(placeholder[0].length, value.length), "0");
  return template.replace(placeholder[0], padded);
}

export function getNextTicketOrderValue(order = settings.ticketOrder) {
  const value = String(order ?? "").trim();
  if (!isTicketOrderValue(value)) return "";

  const next = String(Number(value) + 1);
  return next.padStart(value.length, "0");
}

function isTicketOrderValue(value) {
  return /^\d+$/.test(String(value ?? "").trim());
}

function readConfigurationValue(configurations, name) {
  const configuration = (configurations ?? []).find((item) => item.name === name);
  return String(configuration?.value ?? "").trim();
}
