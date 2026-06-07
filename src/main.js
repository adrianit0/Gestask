import "./styles/global.css";
import { AppLayout } from "./components/AppLayout.js";
import { assertConfig } from "./config/env.js";
import { AuthPage } from "./pages/AuthPage.js";
import { BacklogPage } from "./pages/BacklogPage.js";
import { CalendarPage } from "./pages/CalendarPage.js";
import { DailyTasksPage } from "./pages/DailyTasksPage.js";
import { ConfigurationPage } from "./pages/ConfigurationPage.js";
import { PerformancePage } from "./pages/PerformancePage.js";
import { TimeManagerPage } from "./pages/TimeManagerPage.js";
import { login, logout, register } from "./services/authService.js";
import { getCalendarMonth, updateCalendarDayStatus } from "./services/calendarService.js";
import { createConfiguration, listConfigurations, updateConfigurationProfile } from "./services/configurationService.js";
import { createDailyReport, getDailyReport } from "./services/dailyReportService.js";
import { isAuthenticated } from "./services/sessionService.js";
import { createTask, listTasks, updateTask } from "./services/taskService.js";
import { deleteTimeEntry, listTimeEntries, saveTimeEntry } from "./services/timeEntryService.js";
import { getMinutesPerEffortPoint } from "./utils/effortTime.js";
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
  detailTask: null,
  dailyDate: todayIso(),
  dailySort: { sort_by: "order_points", sort_direction: "desc" },
  dailyReport: null,
  dailyTasks: [],
  dailyEditable: false,
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth() + 1,
  calendarDays: [],
  timeEntries: [],
  editingTimeEntry: null,
  configurations: [],
};

async function boot() {
  if (isAuthenticated()) {
    await loadAllData();
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
    return BacklogPage({ tasks: getFilteredTasks(), filters: state.filters, loading: state.loading, error: state.error, success: state.success, modalTask: state.modalTask, detailTask: state.detailTask });
  }
  if (state.page === "daily") {
    return DailyTasksPage({ date: state.dailyDate, report: state.dailyReport, tasks: state.dailyTasks, editable: state.dailyEditable, loading: state.loading, error: state.error, success: state.success, modalTask: state.modalTask, detailTask: state.detailTask, sort: state.dailySort });
  }
  if (state.page === "calendar") {
    return CalendarPage({ year: state.calendarYear, month: state.calendarMonth, days: state.calendarDays, minutesPerEffortPoint: getMinutesPerEffortPoint(state.configurations), loading: state.loading, error: state.error, success: state.success });
  }
  if (state.page === "time") {
    return TimeManagerPage({ tasks: state.tasks, entries: state.timeEntries, editingEntry: state.editingTimeEntry, error: state.error, success: state.success });
  }
  if (state.page === "configuration") {
    return ConfigurationPage({ configurations: state.configurations, loading: state.loading, error: state.error, success: state.success });
  }
  return PerformancePage({ tasks: state.tasks, calendarDays: state.calendarDays, minutesPerEffortPoint: getMinutesPerEffortPoint(state.configurations), loading: state.loading, error: state.error, success: state.success });
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
      await loadAllData();
    } catch (error) {
      state.error = error.message;
    }
    render();
  });
}

function bindLayoutEvents() {
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.page = button.dataset.page;
      state.detailTask = null;
      state.modalTask = undefined;
      clearMessages();
      render();
    });
  });

  document.querySelector("[data-action='refresh']")?.addEventListener("click", async () => {
    clearMessages();
    await loadAllData();
    if (!state.error) state.success = "Datos actualizados.";
    render();
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
  if (state.page === "configuration") bindConfigurationEvents();
}

function bindBacklogEvents() {
  document.querySelector("[data-open-task-modal]")?.addEventListener("click", () => {
    state.modalTask = null;
    render();
  });

  document.querySelectorAll("[data-edit-task]").forEach((button) => {
    button.addEventListener("click", () => {
      state.modalTask = state.tasks.find((task) => task.id === button.dataset.editTask) ?? null;
      state.detailTask = null;
      render();
    });
  });

  bindTaskTableEvents(state.tasks);

  document.querySelectorAll("[data-filter]").forEach((input) => {
    input.addEventListener("change", async () => {
      clearMessages();
      state.filters[input.dataset.filter] = input.value;
      await loadBacklogTasks({ preserveMessages: true });
      render();
    });
  });

  document.querySelector("[data-clear-filters]")?.addEventListener("click", async () => {
    clearMessages();
    state.filters = {};
    await loadBacklogTasks({ preserveMessages: true });
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

  const taskForm = document.querySelector("#task-form");
  taskForm?.elements.ticket_type?.addEventListener("change", () => syncTaskPrStatusOptions(taskForm));

  document.querySelector("#task-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = normalizeTaskPayload(formToObject(event.target));
    try {
      const isCreate = !payload.id;
      if (payload.id) await updateTask(payload);
      else await createTask(payload);
      state.modalTask = undefined;
      state.success = "Tarea guardada correctamente.";
      await loadAllData({ preserveMessages: true });
      if (isCreate && !state.error) state.success = "Tarea creada y datos actualizados.";
    } catch (error) {
      state.error = error.message;
    }
    render();
  });
}

function syncTaskPrStatusOptions(form) {
  const prStatus = form?.elements.pr_status;
  if (!prStatus) return;

  const currentValue = prStatus.value;
  const statuses = form.elements.ticket_type.value === "Task" ? ["Not Finished", "Imputed"] : ["Not Finished", "Need PR", "PR Hecho", "Imputed", "Deployed"];
  prStatus.innerHTML = statuses.map((status) => `<option ${currentValue === status ? "selected" : ""}>${status}</option>`).join("");
  if (!statuses.includes(currentValue)) prStatus.value = statuses[0];
}

function bindDailyEvents() {
  document.querySelector("[data-create-daily-report]")?.addEventListener("click", async () => {
    clearMessages();
    try {
      await createDailyReport();
      state.success = "Parte diario creado.";
      state.dailyDate = todayIso();
      await loadAllData({ preserveMessages: true });
    } catch (error) {
      state.error = error.message;
    }
    render();
  });

  document.querySelector("[data-load-daily-report]")?.addEventListener("click", async () => {
    state.dailyDate = document.querySelector("[data-daily-date]").value;
    state.detailTask = null;
    state.modalTask = undefined;
    await loadDailyReport();
    render();
  });

  document.querySelectorAll("[data-daily-sort]").forEach((input) => {
    input.addEventListener("change", async () => {
      state.dailySort[input.dataset.dailySort] = input.value;
      await loadDailyReport();
      render();
    });
  });

  document.querySelectorAll("[data-edit-task]").forEach((button) => {
    button.addEventListener("click", () => {
      state.modalTask = state.dailyTasks.find((task) => task.id === button.dataset.editTask) ?? null;
      state.detailTask = null;
      render();
    });
  });

  bindTaskTableEvents(state.dailyTasks, { readonly: !state.dailyEditable });
  bindTaskModalEvents();
}

function bindTaskTableEvents(tasks, { readonly = false } = {}) {
  document.querySelectorAll("[data-view-task]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("a, button, select, input, textarea, label")) return;
      state.detailTask = tasks.find((task) => task.id === row.dataset.viewTask) ?? null;
      render();
    });
  });

  document.querySelectorAll("[data-close-detail-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.detailTask = null;
      render();
    });
  });

  document.querySelectorAll("[data-task-comment-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const comment = form.elements.comment.value.trim();
      if (!comment) {
        state.error = "El comentario no puede estar vacío.";
        render();
        return;
      }
      await mutateTask({ id: form.dataset.taskCommentForm, comment });
    });
  });

  if (readonly) return;

  document.querySelectorAll("[data-task-status]").forEach((select) => {
    select.addEventListener("change", async () => mutateTask({ id: select.dataset.taskStatus, task_status: select.value }));
  });

  document.querySelectorAll("[data-pr-status]").forEach((select) => {
    select.addEventListener("change", async () => mutateTask({ id: select.dataset.prStatus, pr_status: select.value }));
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
    button.addEventListener("click", () => {
      const task = state.tasks.find((item) => item.id === button.dataset.calendarTask);
      state.page = "backlog";
      state.filters = { search: task?.ticket || task?.title || button.textContent };
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

function bindConfigurationEvents() {
  document.querySelectorAll("[data-configuration-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearMessages();
      const payload = formToObject(event.target);
      try {
        await updateConfigurationProfile(payload);
        state.success = "Parámetro actualizado.";
        await loadConfigurations({ preserveMessages: true });
      } catch (error) {
        state.error = error.message;
      }
      render();
    });
  });

  document.querySelector("#configuration-create-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();
    const payload = normalizeConfigurationPayload(formToObject(event.target));
    try {
      await createConfiguration(payload);
      state.success = "Parámetro creado.";
      await loadConfigurations({ preserveMessages: true });
    } catch (error) {
      state.error = error.message;
    }
    render();
  });

  document.querySelector("[data-create-parameter-type]")?.addEventListener("change", (event) => {
    const input = document.querySelector("[data-create-default-value]");
    if (!input) return;
    applyConfigurationInputType(input, event.target.value);
  });
}

async function mutateTask(payload) {
  clearMessages();
  try {
    await updateTask(payload);
    state.success = "Tarea actualizada.";
    await loadAllData({ preserveMessages: true });
    refreshSelectedTask(payload.id);
  } catch (error) {
    state.error = error.message;
  }
  render();
}

function refreshSelectedTask(taskId) {
  if (!state.detailTask || state.detailTask.id !== taskId) return;
  state.detailTask = state.tasks.find((task) => task.id === taskId) ?? state.dailyTasks.find((task) => task.id === taskId) ?? null;
}

async function loadAllData({ preserveMessages = false } = {}) {
  await withLoading(async () => {
    const [tasksResult, dailyResult, calendarResult, configurationsResult] = await Promise.allSettled([
      listTasks(state.filters),
      getDailyReport(state.dailyDate, state.dailySort),
      getCalendarMonth(state.calendarYear, state.calendarMonth),
      listConfigurations(),
    ]);

    state.timeEntries = listTimeEntries();

    const errors = [];

    if (tasksResult.status === "fulfilled") {
      state.tasks = tasksResult.value.tasks ?? [];
    } else {
      errors.push(tasksResult.reason.message);
    }

    if (dailyResult.status === "fulfilled") {
      state.dailyReport = dailyResult.value.report;
      state.dailyTasks = dailyResult.value.tasks ?? [];
      state.dailyEditable = Boolean(dailyResult.value.editable);
    } else {
      errors.push(dailyResult.reason.message);
    }

    if (calendarResult.status === "fulfilled") {
      state.calendarDays = calendarResult.value.days ?? [];
    } else {
      errors.push(calendarResult.reason.message);
    }

    if (configurationsResult.status === "fulfilled") {
      state.configurations = configurationsResult.value.configurations ?? [];
    } else {
      errors.push(configurationsResult.reason.message);
    }

    if (errors.length) {
      state.success = "";
      state.error = errors.join(" ");
    }
  }, { preserveMessages });
}

async function loadConfigurations({ preserveMessages = false } = {}) {
  await withLoading(async () => {
    const data = await listConfigurations();
    state.configurations = data.configurations ?? [];
  }, { preserveMessages });
}

async function loadBacklogTasks({ preserveMessages = false } = {}) {
  await withLoading(async () => {
    const data = await listTasks(state.filters);
    state.tasks = data.tasks ?? [];
  }, { preserveMessages });
}

async function loadDailyReport() {
  await withLoading(async () => {
    const data = await getDailyReport(state.dailyDate, state.dailySort);
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

async function withLoading(action, { preserveMessages = false } = {}) {
  state.loading = true;
  if (!preserveMessages) clearMessages();
  render();
  try {
    await action();
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
  }
}

function getFilteredTasks() {
  return state.tasks.filter((task) => {
    const search = state.filters.search?.trim().toLowerCase();
    const matchesSearch = !search || [task.title, task.ticket, task.more_info]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
    const matchesStatus = !state.filters.status || task.task_status === state.filters.status;
    const matchesPriority = !state.filters.priority || task.priority === state.filters.priority;
    const matchesDate = !state.filters.date || task.assigned_date === state.filters.date || task.finished_date === state.filters.date;
    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });
}

function formToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function normalizeTaskPayload(payload) {
  const normalized = { ...payload };
  if (!normalized.id) delete normalized.id;
  if (!normalized.ticket) normalized.ticket = null;
  if (!normalized.ticket_type) normalized.ticket_type = "Bug";
  if (!normalized.limit_date) normalized.limit_date = null;
  if (!normalized.finished_date) delete normalized.finished_date;
  if (!normalized.more_info) normalized.more_info = null;
  normalized.effort_points = Number(normalized.effort_points || 0);
  normalized.order_points = normalized.order_points === "" ? null : Number(normalized.order_points);
  return normalized;
}

function normalizeConfigurationPayload(payload) {
  return {
    ...payload,
    name: payload.name?.trim(),
    fixed_value: payload.fixed_value === "true",
  };
}

function applyConfigurationInputType(input, parameterType) {
  const typeByParameter = {
    string: "text",
    number: "number",
    boolean: "text",
    date: "date",
    datetime: "datetime-local",
  };
  input.type = typeByParameter[parameterType] ?? "text";
  input.step = parameterType === "number" ? "any" : "";
  input.placeholder = parameterType === "boolean" ? "true o false" : "";
}

function clearMessages() {
  state.error = "";
  state.success = "";
}

boot();



