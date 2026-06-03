import "./styles/global.css";
import { AppLayout } from "./components/AppLayout.js";
import { assertConfig } from "./config/env.js";
import { AuthPage } from "./pages/AuthPage.js";
import { BacklogPage } from "./pages/BacklogPage.js";
import { CalendarPage } from "./pages/CalendarPage.js";
import { DailyTasksPage } from "./pages/DailyTasksPage.js";
import { PerformancePage } from "./pages/PerformancePage.js";
import { TimeManagerPage } from "./pages/TimeManagerPage.js";
import { login, logout, register } from "./services/authService.js";
import { getCalendarMonth, updateCalendarDayStatus } from "./services/calendarService.js";
import { createDailyReport, getDailyReport } from "./services/dailyReportService.js";
import { isAuthenticated } from "./services/sessionService.js";
import { createTask, listTasks, updateTask } from "./services/taskService.js";
import { deleteTimeEntry, listTimeEntries, saveTimeEntry } from "./services/timeEntryService.js";
import { todayIso } from "./utils/format.js";

const root = document.querySelector("#app");
const state = {
  authMode: "login",
  page: "backlog",
  error: "",
  success: "",
  loading: false,
  tasks: [],
  filters: {},
  modalTask: undefined,
  dailyDate: todayIso(),
  dailyReport: null,
  dailyTasks: [],
  dailyEditable: false,
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth() + 1,
  calendarDays: [],
  timeEntries: [],
  editingTimeEntry: null,
};

async function boot() {
  if (isAuthenticated()) {
    await loadPageData();
  }
  render();
}

function render() {
  if (!isAuthenticated()) {
    root.innerHTML = AuthPage({ mode: state.authMode, error: state.error, success: state.success, configError: assertConfig() });
    bindAuthEvents();
    return;
  }

  root.innerHTML = AppLayout(state.page, currentPageHtml());
  bindLayoutEvents();
  bindPageEvents();
}

function currentPageHtml() {
  if (state.page === "backlog") {
    return BacklogPage({ tasks: state.tasks, filters: state.filters, loading: state.loading, error: state.error, success: state.success, modalTask: state.modalTask });
  }
  if (state.page === "daily") {
    return DailyTasksPage({ date: state.dailyDate, report: state.dailyReport, tasks: state.dailyTasks, editable: state.dailyEditable, loading: state.loading, error: state.error, success: state.success });
  }
  if (state.page === "calendar") {
    return CalendarPage({ year: state.calendarYear, month: state.calendarMonth, days: state.calendarDays, loading: state.loading, error: state.error, success: state.success });
  }
  if (state.page === "time") {
    return TimeManagerPage({ tasks: state.tasks, entries: state.timeEntries, editingEntry: state.editingTimeEntry, error: state.error, success: state.success });
  }
  return PerformancePage({ tasks: state.tasks, calendarDays: state.calendarDays, loading: state.loading, error: state.error, success: state.success });
}

function bindAuthEvents() {
  document.querySelector("[data-auth-mode]")?.addEventListener("click", (event) => {
    state.authMode = event.target.dataset.authMode;
    clearMessages();
    render();
  });

  document.querySelector("#auth-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();
    const payload = formToObject(event.target);
    try {
      if (state.authMode === "login") await login(payload);
      else await register(payload);
      state.page = "backlog";
      await loadBacklog();
    } catch (error) {
      state.error = error.message;
    }
    render();
  });
}

function bindLayoutEvents() {
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.page = button.dataset.page;
      clearMessages();
      await loadPageData();
      render();
    });
  });

  document.querySelector("[data-action='logout']")?.addEventListener("click", () => {
    logout();
    Object.assign(state, { page: "backlog", tasks: [], dailyReport: null, calendarDays: [] });
    clearMessages();
    render();
  });
}

function bindPageEvents() {
  if (state.page === "backlog") bindBacklogEvents();
  if (state.page === "daily") bindDailyEvents();
  if (state.page === "calendar") bindCalendarEvents();
  if (state.page === "time") bindTimeEvents();
}

function bindBacklogEvents() {
  document.querySelector("[data-open-task-modal]")?.addEventListener("click", () => {
    state.modalTask = null;
    render();
  });

  document.querySelectorAll("[data-edit-task]").forEach((button) => {
    button.addEventListener("click", () => {
      state.modalTask = state.tasks.find((task) => task.id === button.dataset.editTask) ?? null;
      render();
    });
  });

  document.querySelectorAll("[data-task-status]").forEach((select) => {
    select.addEventListener("change", async () => mutateTask({ id: select.dataset.taskStatus, task_status: select.value }));
  });

  document.querySelectorAll("[data-pr-status]").forEach((select) => {
    select.addEventListener("change", async () => mutateTask({ id: select.dataset.prStatus, pr_status: select.value }));
  });

  document.querySelectorAll("[data-filter]").forEach((input) => {
    input.addEventListener("change", async () => {
      clearMessages();
      state.filters[input.dataset.filter] = input.value;
      await loadBacklog();
      render();
    });
  });

  document.querySelector("[data-clear-filters]")?.addEventListener("click", async () => {
    clearMessages();
    state.filters = {};
    await loadBacklog();
    render();
  });

  bindTaskModalEvents();
}

function bindTaskModalEvents() {
  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.modalTask = undefined;
      render();
    });
  });

  document.querySelector("#task-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = normalizeTaskPayload(formToObject(event.target));
    try {
      if (payload.id) await updateTask(payload);
      else await createTask(payload);
      state.modalTask = undefined;
      state.success = "Tarea guardada correctamente.";
      await loadBacklog();
    } catch (error) {
      state.error = error.message;
    }
    render();
  });
}

function bindDailyEvents() {
  document.querySelector("[data-create-daily-report]")?.addEventListener("click", async () => {
    clearMessages();
    try {
      await createDailyReport();
      state.success = "Parte diario creado.";
      state.dailyDate = todayIso();
      await loadDailyReport();
    } catch (error) {
      state.error = error.message;
    }
    render();
  });

  document.querySelector("[data-load-daily-report]")?.addEventListener("click", async () => {
    state.dailyDate = document.querySelector("[data-daily-date]").value;
    await loadDailyReport();
    render();
  });
}

function bindCalendarEvents() {
  document.querySelector("[data-load-calendar]")?.addEventListener("click", async () => {
    state.calendarYear = Number(document.querySelector("[data-calendar-year]").value);
    state.calendarMonth = Number(document.querySelector("[data-calendar-month]").value);
    await loadCalendar();
    render();
  });

  document.querySelectorAll("[data-day-status]").forEach((select) => {
    select.addEventListener("change", async () => {
      clearMessages();
      try {
        await updateCalendarDayStatus({ day: select.dataset.dayStatus, status: select.value });
        state.success = "Estado de día actualizado.";
        await loadCalendar();
      } catch (error) {
        state.error = error.message;
      }
      render();
    });
  });

  document.querySelectorAll("[data-calendar-task]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.page = "backlog";
      state.filters = { search: button.textContent };
      await loadBacklog();
      render();
    });
  });
}

function bindTimeEvents() {
  document.querySelector("#time-entry-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessages();
    const payload = formToObject(event.target);
    if (payload.end_time <= payload.start_time) {
      state.error = "La hora de fin debe ser posterior a la hora de inicio.";
      render();
      return;
    }
    saveTimeEntry(payload);
    state.editingTimeEntry = null;
    state.timeEntries = listTimeEntries();
    state.success = "Registro horario guardado.";
    render();
  });

  document.querySelector("[data-cancel-time-edit]")?.addEventListener("click", () => {
    state.editingTimeEntry = null;
    clearMessages();
    render();
  });

  document.querySelectorAll("[data-edit-time-entry]").forEach((button) => {
    button.addEventListener("click", () => {
      state.editingTimeEntry = state.timeEntries.find((entry) => entry.id === button.dataset.editTimeEntry) ?? null;
      clearMessages();
      render();
    });
  });

  document.querySelectorAll("[data-delete-time-entry]").forEach((button) => {
    button.addEventListener("click", () => {
      deleteTimeEntry(button.dataset.deleteTimeEntry);
      state.timeEntries = listTimeEntries();
      state.success = "Registro horario borrado.";
      render();
    });
  });
}

async function mutateTask(payload) {
  clearMessages();
  try {
    await updateTask(payload);
    state.success = "Tarea actualizada.";
    await loadBacklog();
  } catch (error) {
    state.error = error.message;
  }
  render();
}

async function loadPageData() {
  if (state.page === "backlog") await loadBacklog();
  if (state.page === "daily") await loadDailyReport();
  if (state.page === "calendar") await loadCalendar();
  if (state.page === "time") await loadTimeManager();
  if (state.page === "charts") await loadPerformance();
}

async function loadBacklog() {
  await withLoading(async () => {
    const data = await listTasks(state.filters);
    state.tasks = data.tasks ?? [];
  });
}

async function loadDailyReport() {
  await withLoading(async () => {
    const data = await getDailyReport(state.dailyDate);
    state.dailyReport = data.report;
    state.dailyTasks = data.tasks ?? [];
    state.dailyEditable = Boolean(data.editable);
  });
}

async function loadCalendar() {
  await withLoading(async () => {
    const data = await getCalendarMonth(state.calendarYear, state.calendarMonth);
    state.calendarDays = data.days ?? [];
  });
}

async function loadTimeManager() {
  state.timeEntries = listTimeEntries();
  if (!state.tasks.length) await loadBacklog();
}

async function loadPerformance() {
  if (!state.tasks.length) await loadBacklog();
  if (!state.calendarDays.length) await loadCalendar();
}

async function withLoading(action) {
  state.loading = true;
  render();
  try {
    await action();
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
  }
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function normalizeTaskPayload(payload) {
  const normalized = { ...payload };
  if (!normalized.id) delete normalized.id;
  if (!normalized.ticket) normalized.ticket = null;
  if (!normalized.finished_date) delete normalized.finished_date;
  if (!normalized.more_info) normalized.more_info = null;
  normalized.effort_points = Number(normalized.effort_points || 0);
  normalized.order_points = normalized.order_points === "" ? null : Number(normalized.order_points);
  return normalized;
}

function clearMessages() {
  state.error = "";
  state.success = "";
}

boot();



