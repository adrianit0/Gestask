import "./styles/global.css";
import { AppLayout } from "./components/AppLayout.js";
import { assertConfig } from "./config/env.js";
import { AuthPage } from "./pages/AuthPage.js";
import { BacklogPage } from "./pages/BacklogPage.js";
import { CalendarPage } from "./pages/CalendarPage.js";
import { CompletionTasksPage, getAdvanceableNeedPrTasks, getDefaultImputedDate, getDeployableImputedTasks, getPendingImputationTasks } from "./pages/CompletionTasksPage.js";
import { DailyTasksPage } from "./pages/DailyTasksPage.js";
import { DailySchedulePage } from "./pages/DailySchedulePage.js";
import { DailyRoutinePage } from "./pages/DailyRoutinePage.js";
import { ConfigurationPage } from "./pages/ConfigurationPage.js";
import { KanbanPage } from "./pages/KanbanPage.js";
import { OrderTasksPage } from "./pages/OrderTasksPage.js";
import { PerformancePage } from "./pages/PerformancePage.js";
import { TimeManagerPage } from "./pages/TimeManagerPage.js";
import { login, logout, register } from "./services/authService.js";
import { getCalendarMonth, updateCalendarDayStatus } from "./services/calendarService.js";
import { createConfiguration, listConfigurations, updateConfigurationProfile } from "./services/configurationService.js";
import { createDailyReport, getDailyReport, listPendingDailyTasks, setDailyTaskCompletion } from "./services/dailyReportService.js";
import { isAuthenticated } from "./services/sessionService.js";
import { createTask, deleteTask, listDailyRoutineTasks, listTasks, updateTask } from "./services/taskService.js";
import { listOrderTasks, updateOrderTasks } from "./services/taskOrderService.js";
import { listCompletionTasks, resolveCompletionTask } from "./services/taskCompletionService.js";
import { deleteTimeEntry, listTimeEntries, saveTimeEntry } from "./services/timeEntryService.js";
import { getMinutesPerEffortPoint } from "./utils/effortTime.js";
import { TICKET_ORDER_CONFIGURATION_NAME, applyProjectSettings, buildNextTicket, getNextTicketOrderValue } from "./utils/projectSettings.js";
import { getMonthReferenceDate } from "./utils/performanceMetrics.js";
import { todayIso } from "./utils/format.js";
import { DAILY_TICKET_TYPE } from "./utils/constants.js";
import { dailyCompletionKey } from "./components/DailyTasks.js";
import { AsyncActivityIndicator, asyncActivityTitle, formatElapsed } from "./components/AsyncActivity.js";
import { getAsyncOperations, subscribeAsyncOperations } from "./services/asyncTracker.js";

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
  dailyScheduleIncludeExtra: false,
  dailyReportRoutineTasks: [],
  dailyRoutineTasks: [],
  dailyPending: { today: todayIso(), items: [] },
  dailyCompletionPending: new Set(),
  completionTasks: [],
  completionModalTask: null,
  bulkImputeOpen: false,
  bulkImputeSelection: new Set(),
  orderTasks: [],
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth() + 1,
  calendarDays: [],
  calendarModalDay: null,
  timeEntries: [],
  editingTimeEntry: null,
  configurations: [],
  configurationModalOpen: false,
  performanceShowAll: false,
  performanceChartGroup: "points",
  performanceYear: new Date().getFullYear(),
  performanceMonth: new Date().getMonth() + 1,
  performanceDays: [],
};

const pendingTasks = new Map();
let pendingSequence = 0;

async function boot() {
  startAsyncIndicator();
  if (isAuthenticated()) {
    await loadAllData();
  }
  render();
}

let renderedAsyncSignature = "";

function startAsyncIndicator() {
  subscribeAsyncOperations(updateAsyncIndicator);
  window.setInterval(updateAsyncIndicator, 1000);
}

function asyncSignature(operations) {
  return operations.map((operation) => operation.id).join("|");
}

function updateAsyncIndicator() {
  const slot = document.querySelector("[data-async-indicator]");
  if (!slot) return;

  const operations = getAsyncOperations();
  const signature = asyncSignature(operations);
  if (signature === renderedAsyncSignature) {
    refreshAsyncElapsedTimes(slot, operations);
    return;
  }

  renderedAsyncSignature = signature;
  slot.innerHTML = AsyncActivityIndicator(operations);
}

function refreshAsyncElapsedTimes(slot, operations) {
  const container = slot.querySelector(".async-activity");
  if (container) container.title = asyncActivityTitle(operations);
  const elapsedNodes = slot.querySelectorAll(".async-activity-tooltip li strong");
  operations.forEach((operation, index) => {
    if (elapsedNodes[index]) elapsedNodes[index].textContent = formatElapsed(operation.startedAt);
  });
}

function addPendingTask(task, { isCreate = false, label = "Guardando..." } = {}) {
  const key = isCreate ? `pending-${++pendingSequence}` : task.id;
  pendingTasks.set(key, { key, isCreate, label, task: { ...task, id: task.id ?? key } });
  return key;
}

function removePendingTask(key) {
  pendingTasks.delete(key);
}

function decoratePendingTask(entry) {
  return { ...entry.task, __pending: true, __pendingLabel: entry.label };
}

function withPendingTasks(tasks, { includeCreated = false, daily = false } = {}) {
  if (!pendingTasks.size) return tasks;
  const merged = tasks.map((task) => {
    const entry = pendingTasks.get(task.id);
    return entry ? decoratePendingTask({ ...entry, task: { ...task, ...entry.task } }) : task;
  });
  if (!includeCreated) return merged;
  // Daily tasks being created only show up in their own space, never mixed with regular tasks.
  const created = [...pendingTasks.values()].filter((entry) => entry.isCreate && isDailyTask(entry.task) === daily).map(decoratePendingTask);
  return [...created, ...merged];
}

function isDailyTask(task) {
  return task?.ticket_type === DAILY_TICKET_TYPE;
}

function buildPendingTaskDraft(payload, baseTask) {
  const base = baseTask ?? {};
  return {
    task_status: "To do",
    pr_status: "Not Finished",
    ticket_type: "Bug",
    priority: "Menor",
    effort_points: 0,
    scoring: null,
    ...base,
    ...payload,
  };
}

const FINAL_TASK_STATUSES = ["Done", "Undone", "Unfinished"];

function nextOrderPoints() {
  const values = [...state.orderTasks, ...state.tasks, ...state.dailyTasks]
    .filter((task) => !FINAL_TASK_STATUSES.includes(task.task_status))
    .map((task) => Number(task.order_points))
    .filter((value) => Number.isFinite(value));
  return values.length ? Math.max(...values) + 1 : 1;
}

function render() {
  if (!isAuthenticated()) {
    root.innerHTML = AuthPage({ mode: state.authMode, error: state.error, success: state.success, configError: assertConfig() });
    bindAuthEvents();
    return;
  }

  const draftComment = document.querySelector("[data-task-comment-form] textarea")?.value ?? "";
  root.innerHTML = AppLayout(state.page, currentPageHtml(), { dailyPending: state.dailyPending });
  renderedAsyncSignature = asyncSignature(getAsyncOperations());
  restoreDraftComment(draftComment);
  bindLayoutEvents();
  bindPageEvents();
}

function restoreDraftComment(draftComment) {
  if (!draftComment) return;
  const textarea = document.querySelector("[data-task-comment-form] textarea");
  if (textarea && !textarea.value) textarea.value = draftComment;
}

function renderUnlessEditingTask() {
  if (state.modalTask !== undefined) return;
  render();
}

function currentPageHtml() {
  if (state.page === "backlog") {
    return BacklogPage({ tasks: withPendingTasks(getFilteredTasks(), { includeCreated: true }), filters: state.filters, loading: state.loading, error: state.error, success: state.success, modalTask: state.modalTask, detailTask: state.detailTask });
  }
  if (state.page === "kanban") {
    return KanbanPage({ tasks: withPendingTasks(state.tasks, { includeCreated: true }), loading: state.loading, error: state.error, success: state.success, modalTask: state.modalTask, detailTask: state.detailTask });
  }
  if (state.page === "daily") {
    return DailyTasksPage({ date: state.dailyDate, report: state.dailyReport, tasks: withPendingTasks(state.dailyTasks), editable: state.dailyEditable, loading: state.loading, error: state.error, success: state.success, modalTask: state.modalTask, detailTask: state.detailTask, sort: state.dailySort });
  }
  if (state.page === "completion") {
    return CompletionTasksPage({ tasks: withPendingTasks(state.completionTasks), performanceTasks: state.tasks, calendarDays: state.performanceDays, configurations: state.configurations, minutesPerEffortPoint: getMinutesPerEffortPoint(state.configurations), referenceDate: getMonthReferenceDate(state.performanceYear, state.performanceMonth), loading: state.loading, error: state.error, success: state.success, modalTask: state.completionModalTask, detailTask: state.detailTask, bulkImputeOpen: state.bulkImputeOpen, bulkImputeSelection: state.bulkImputeSelection });
  }
  if (state.page === "order") {
    return OrderTasksPage({ tasks: state.orderTasks, loading: state.loading, error: state.error, success: state.success });
  }
  if (state.page === "dailySchedule") {
    return DailySchedulePage({ report: state.dailyReport, date: state.dailyDate, tasks: withPendingTasks(state.dailyTasks), routineTasks: state.dailyReportRoutineTasks, dailyCompletionPending: state.dailyCompletionPending, configurations: state.configurations, minutesPerEffortPoint: getMinutesPerEffortPoint(state.configurations), includeExtraHours: state.dailyScheduleIncludeExtra, loading: state.loading, error: state.error, success: state.success, modalTask: state.modalTask, detailTask: state.detailTask });
  }
  if (state.page === "dailyRoutine") {
    return DailyRoutinePage({ tasks: withPendingTasks(state.dailyRoutineTasks, { includeCreated: true, daily: true }), pending: state.dailyPending, completionPendingKeys: state.dailyCompletionPending, loading: state.loading, error: state.error, success: state.success, modalTask: state.modalTask });
  }
  if (state.page === "calendar") {
    return CalendarPage({ year: state.calendarYear, month: state.calendarMonth, days: state.calendarDays, configurations: state.configurations, minutesPerEffortPoint: getMinutesPerEffortPoint(state.configurations), loading: state.loading, error: state.error, success: state.success, modalDay: state.calendarModalDay });
  }
  if (state.page === "time") {
    return TimeManagerPage({ tasks: state.tasks, entries: state.timeEntries, editingEntry: state.editingTimeEntry, error: state.error, success: state.success });
  }
  if (state.page === "configuration") {
    return ConfigurationPage({ configurations: state.configurations, loading: state.loading, error: state.error, success: state.success, showCreateModal: state.configurationModalOpen });
  }
  return PerformancePage({ tasks: state.tasks, calendarDays: state.performanceDays, configurations: state.configurations, minutesPerEffortPoint: getMinutesPerEffortPoint(state.configurations), showAll: state.performanceShowAll, chartGroup: state.performanceChartGroup, year: state.performanceYear, month: state.performanceMonth, referenceDate: getMonthReferenceDate(state.performanceYear, state.performanceMonth), loading: state.loading, error: state.error, success: state.success });
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
      state.completionModalTask = null;
      state.configurationModalOpen = false;
      state.calendarModalDay = null;
      state.dailyScheduleIncludeExtra = false;
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
    Object.assign(state, { page: "backlog", tasks: [], dailyReport: null, dailyTasks: [], dailyReportRoutineTasks: [], dailyRoutineTasks: [], dailyPending: { today: todayIso(), items: [] }, completionTasks: [], completionModalTask: null, bulkImputeOpen: false, bulkImputeSelection: new Set(), orderTasks: [], calendarDays: [] });
    clearMessages();
    render();
  });
}

function bindPageEvents() {
  if (state.page === "backlog") bindBacklogEvents();
  if (state.page === "kanban") bindKanbanEvents();
  if (state.page === "daily") bindDailyEvents();
  if (state.page === "completion") bindCompletionEvents();
  if (state.page === "order") bindOrderEvents();
  if (state.page === "dailySchedule") bindDailyScheduleEvents();
  if (state.page === "dailyRoutine") bindDailyRoutineEvents();
  if (state.page === "calendar") bindCalendarEvents();
  if (state.page === "time") bindTimeEvents();
  if (state.page === "configuration") bindConfigurationEvents();
  if (state.page === "charts") bindPerformanceEvents();
  bindBacklogTaskNavigation();
}

function bindBacklogTaskNavigation() {
  document.querySelectorAll("[data-go-backlog-task]").forEach((button) => {
    button.addEventListener("click", async () => {
      const task = findKnownTask(button.dataset.goBacklogTask);
      const search = task?.ticket || task?.title || "";
      state.page = "backlog";
      state.filters = { search, show_history: true };
      state.detailTask = null;
      state.modalTask = undefined;
      state.completionModalTask = null;
      clearMessages();
      await loadBacklogTasks({ preserveMessages: true });
      render();
    });
  });
}

function findKnownTask(taskId) {
  return [...state.tasks, ...state.dailyTasks, ...state.completionTasks, ...state.orderTasks, ...state.dailyRoutineTasks].find((task) => task.id === taskId) ?? null;
}

function bindBacklogEvents() {
  document.querySelector("[data-open-task-modal]")?.addEventListener("click", () => {
    state.modalTask = { order_points: nextOrderPoints(), ticket: buildNextTicket() };
    render();
  });

  document.querySelectorAll("[data-edit-task]").forEach((button) => {
    button.addEventListener("click", () => {
      state.modalTask = state.tasks.find((task) => task.id === button.dataset.editTask) ?? null;
      state.detailTask = null;
      render();
    });
  });

  document.querySelectorAll("[data-clone-task]").forEach((button) => {
    button.addEventListener("click", () => {
      const task = state.tasks.find((item) => item.id === button.dataset.cloneTask);
      state.modalTask = task ? cloneTaskDraft(task) : null;
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

  document.querySelectorAll("[data-filter-check]").forEach((input) => {
    input.addEventListener("change", async () => {
      clearMessages();
      state.filters[input.dataset.filterCheck] = input.checked;
      await loadBacklogTasks({ preserveMessages: true });
      render();
    });
  });

  document.querySelectorAll("[data-status-filter]").forEach((input) => {
    input.addEventListener("change", async () => {
      clearMessages();
      const selectedStatuses = Array.from(document.querySelectorAll("[data-status-filter]:checked")).map((item) => item.value);
      state.filters.statuses = selectedStatuses;
      delete state.filters.status;
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

function bindKanbanEvents() {
  bindTaskTableEvents(state.tasks);
  bindTaskModalEvents();
}

function bindPerformanceEvents() {
  document.querySelector("[data-performance-show-all]")?.addEventListener("change", (event) => {
    state.performanceShowAll = event.target.checked;
    render();
  });

  document.querySelectorAll("[data-performance-group]").forEach((button) => {
    button.addEventListener("click", () => {
      state.performanceChartGroup = button.dataset.performanceGroup;
      render();
    });
  });

  document.querySelector("[data-load-performance]")?.addEventListener("click", async () => {
    state.performanceYear = Number(document.querySelector("[data-performance-year]").value);
    state.performanceMonth = Number(document.querySelector("[data-performance-month]").value);
    await reloadPerformance();
  });

  document.querySelector("[data-performance-prev]")?.addEventListener("click", async () => {
    shiftPerformanceMonth(-1);
    await reloadPerformance();
  });

  document.querySelector("[data-performance-next]")?.addEventListener("click", async () => {
    shiftPerformanceMonth(1);
    await reloadPerformance();
  });

  document.querySelector("[data-performance-current]")?.addEventListener("click", async () => {
    const now = new Date();
    state.performanceYear = now.getFullYear();
    state.performanceMonth = now.getMonth() + 1;
    await reloadPerformance();
  });
}

function bindCompletionEvents() {
  document.querySelectorAll("[data-open-completion-resolve]").forEach((button) => {
    button.addEventListener("click", () => {
      state.completionModalTask = state.completionTasks.find((task) => task.id === button.dataset.openCompletionResolve) ?? null;
      state.detailTask = null;
      clearMessages();
      render();
    });
  });

  document.querySelectorAll("[data-close-completion-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.completionModalTask = null;
      render();
    });
  });

  document.querySelector("[data-toggle-bulk-impute]")?.addEventListener("click", () => {
    state.bulkImputeOpen = !state.bulkImputeOpen;
    render();
  });

  document.querySelectorAll("[data-impute-select]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      toggleBulkImputeSelection(checkbox.dataset.imputeSelect, checkbox.checked);
      render();
    });
  });

  document.querySelector("[data-impute-select-all]")?.addEventListener("change", (event) => {
    const pendingIds = getPendingImputationTasks(state.completionTasks).map((task) => task.id);
    pendingIds.forEach((id) => toggleBulkImputeSelection(id, event.target.checked));
    render();
  });

  document.querySelector("[data-advance-all-need-pr]")?.addEventListener("click", async () => {
    const needPrTasks = getAdvanceableNeedPrTasks(state.completionTasks);
    if (!needPrTasks.length) return;
    if (!window.confirm(`¿Pasar ${needPrTasks.length} tarea(s) de Need PR a Need to Impute?`)) return;
    await runCompletionBulkAction(needPrTasks.map((task) => ({ id: task.id })), `${needPrTasks.length} tarea(s) pasadas a Need to Impute.`);
  });

  document.querySelector("[data-impute-all]")?.addEventListener("click", async () => {
    const selectedTasks = getPendingImputationTasks(state.completionTasks).filter((task) => state.bulkImputeSelection.has(task.id));
    if (!selectedTasks.length) return;
    const sharedDate = document.querySelector("#bulk-impute-date")?.value || "";
    if (!window.confirm(`¿Imputar ${selectedTasks.length} tarea(s) seleccionada(s) y pasarlas a Imputed?`)) return;
    const payloads = selectedTasks.map((task) => ({ id: task.id, imputed_date: sharedDate || getDefaultImputedDate(task) }));
    const succeeded = await runCompletionBulkAction(payloads, `${selectedTasks.length} tarea(s) imputadas correctamente.`);
    if (succeeded) selectedTasks.forEach((task) => state.bulkImputeSelection.delete(task.id));
    render();
  });

  document.querySelector("[data-close-all-imputed]")?.addEventListener("click", async () => {
    const imputedTasks = getDeployableImputedTasks(state.completionTasks);
    if (!imputedTasks.length) return;
    if (!window.confirm(`¿Cerrar ${imputedTasks.length} tarea(s) en estado Imputed y pasarlas a Deployed?`)) return;
    await runCompletionBulkAction(imputedTasks.map((task) => ({ id: task.id })), `${imputedTasks.length} tarea(s) cerradas correctamente.`);
  });

  document.querySelector("#completion-resolve-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();
    const payload = normalizeCompletionResolvePayload(formToObject(event.target), event.target.dataset.completionStatus);
    try {
      await resolveCompletionTask(payload);
      state.completionModalTask = null;
      state.success = "Tarea resuelta correctamente.";
      await loadAllData({ preserveMessages: true });
    } catch (error) {
      state.error = error.message;
    }
    render();
  });

  bindTaskTableEvents(state.completionTasks, { readonly: true });
}

async function runCompletionBulkAction(payloads, successMessage) {
  clearMessages();
  let succeeded = false;
  try {
    for (const payload of payloads) {
      await resolveCompletionTask(payload);
    }
    state.completionModalTask = null;
    state.success = successMessage;
    succeeded = true;
    await loadAllData({ preserveMessages: true });
  } catch (error) {
    state.error = error.message;
  }
  render();
  return succeeded;
}

function toggleBulkImputeSelection(taskId, selected) {
  if (!taskId) return;
  if (selected) state.bulkImputeSelection.add(taskId);
  else state.bulkImputeSelection.delete(taskId);
}

function bindOrderEvents() {
  document.querySelectorAll("[data-order-row]").forEach((row) => {
    row.addEventListener("dragstart", (event) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", row.dataset.orderIndex);
      row.classList.add("dragging");
    });

    row.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      clearOrderDropTargets();
      row.classList.add("drop-target");
    });

    row.addEventListener("dragleave", () => {
      row.classList.remove("drop-target");
    });

    row.addEventListener("drop", async (event) => {
      event.preventDefault();
      const fromIndex = Number(event.dataTransfer.getData("text/plain"));
      const toIndex = Number(row.dataset.orderIndex);
      clearOrderDropTargets();
      await saveOrderUpdates(calculateMoveUpdates(state.orderTasks, fromIndex, toIndex));
    });

    row.addEventListener("dragend", clearOrderDropTargets);
  });

  document.querySelectorAll("[data-order-move]").forEach((button) => {
    button.addEventListener("click", async () => {
      const fromIndex = Number(button.dataset.orderIndex);
      const toIndex = button.dataset.orderMove === "up" ? fromIndex - 1 : fromIndex + 1;
      await saveOrderUpdates(calculateMoveUpdates(state.orderTasks, fromIndex, toIndex));
    });
  });

  document.querySelector("[data-order-normalize]")?.addEventListener("click", async () => {
    await saveOrderUpdates(calculateNormalizeUpdates(state.orderTasks));
  });
}

function clearOrderDropTargets() {
  document.querySelectorAll("[data-order-row]").forEach((row) => row.classList.remove("dragging", "drop-target"));
}

async function saveOrderUpdates(updates) {
  clearMessages();
  if (!updates.length) {
    state.success = "El orden ya está actualizado.";
    render();
    return;
  }

  state.loading = true;
  render();
  try {
    const data = await updateOrderTasks(updates);
    state.orderTasks = data.tasks ?? [];
    applyOrderPointsToLoadedTasks(updates);
    state.success = "Orden actualizado correctamente.";
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
  }
  render();
}

function calculateMoveUpdates(tasks, fromIndex, toIndex) {
  if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return [];
  if (fromIndex < 0 || fromIndex >= tasks.length || toIndex < 0 || toIndex >= tasks.length || fromIndex === toIndex) return [];

  if (fromIndex < toIndex) {
    return compactChangedUpdates([
      { id: tasks[fromIndex].id, order_points: Number(tasks[toIndex].order_points) },
      ...tasks.slice(fromIndex + 1, toIndex + 1).map((task) => ({ id: task.id, order_points: Number(task.order_points) + 1 })),
    ], tasks);
  }

  return compactChangedUpdates([
    { id: tasks[fromIndex].id, order_points: Number(tasks[toIndex].order_points) },
    ...tasks.slice(toIndex, fromIndex).map((task) => ({ id: task.id, order_points: Number(task.order_points) - 1 })),
  ], tasks);
}

function calculateNormalizeUpdates(tasks) {
  const ascendingTasks = [...tasks].sort((a, b) => {
    const orderCompared = Number(a.order_points) - Number(b.order_points);
    if (orderCompared !== 0) return orderCompared;
    const createdCompared = new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    if (createdCompared !== 0) return createdCompared;
    return String(a.id).localeCompare(String(b.id));
  });

  return compactChangedUpdates(ascendingTasks.map((task, index) => ({ id: task.id, order_points: index + 1 })), tasks);
}

function compactChangedUpdates(updates, currentTasks) {
  const currentById = new Map(currentTasks.map((task) => [task.id, Number(task.order_points)]));
  return updates.filter((update) => Number.isInteger(update.order_points) && currentById.get(update.id) !== update.order_points);
}

function applyOrderPointsToLoadedTasks(updates) {
  const orderById = new Map(updates.map((update) => [update.id, update.order_points]));
  const apply = (task) => orderById.has(task.id) ? { ...task, order_points: orderById.get(task.id) } : task;
  state.tasks = state.tasks.map(apply);
  state.dailyTasks = state.dailyTasks.map(apply);
  state.completionTasks = state.completionTasks.map(apply);
}

function cloneTaskDraft(task) {
  const { id, created_at, updated_at, scoring, comments, ...draft } = task;
  return { ...draft, finished_date: "", order_points: nextOrderPoints(), ticket: buildNextTicket() || draft.ticket };
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
  taskForm?.elements.task_status?.addEventListener("change", () => syncTaskFinishedDate(taskForm));

  document.querySelector("[data-delete-task]")?.addEventListener("click", async (event) => {
    const taskId = event.currentTarget.dataset.deleteTask;
    if (!window.confirm("¿Seguro que quieres eliminar esta tarea? Esta acción no se puede deshacer.")) return;
    clearMessages();
    const baseTask = findKnownTask(taskId);
    const pendingKey = addPendingTask({ ...(baseTask ?? {}), id: taskId }, { label: "Eliminando..." });
    state.modalTask = undefined;
    state.detailTask = null;
    state.success = "Eliminación en curso: la tarea se retirará al responder el servidor.";
    render();

    runTaskMutation({
      pendingKey,
      action: () => deleteTask(taskId),
      successMessage: "Tarea eliminada correctamente.",
    });
  });

  document.querySelector("#task-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const payload = normalizeTaskPayload(formToObject(event.target));
    const isCreate = !payload.id;
    const baseTask = isCreate ? null : findKnownTask(payload.id);
    const pendingKey = addPendingTask(buildPendingTaskDraft(payload, baseTask), {
      isCreate,
      label: isCreate ? "Creando..." : "Guardando...",
    });

    clearMessages();
    state.modalTask = undefined;
    state.detailTask = null;
    state.success = isCreate
      ? "Tarea creada de forma provisional: se actualizará al responder el servidor."
      : "Cambios aplicados de forma provisional: se actualizarán al responder el servidor.";
    render();

    runTaskMutation({
      pendingKey,
      action: () => (isCreate ? createTaskWithTicketOrder(payload) : updateTask(payload)),
      successMessage: isCreate ? "Tarea creada y datos actualizados." : "Tarea guardada correctamente.",
    });
  });
}

function syncTaskFinishedDate(form) {
  const finishedDate = form?.elements.finished_date;
  const taskStatus = form?.elements.task_status;
  if (!finishedDate || !taskStatus) return;

  const isDone = taskStatus.value === "Done";
  finishedDate.disabled = !isDone;
  if (isDone && !finishedDate.value) finishedDate.value = todayIso();
}

function syncTaskPrStatusOptions(form) {
  const prStatus = form?.elements.pr_status;
  if (!prStatus) return;

  const currentValue = prStatus.value;
  const statuses = form.elements.ticket_type.value === "Task" ? ["Not Finished", "Need to Impute", "Imputed"] : ["Not Finished", "Need PR", "Need to Impute", "Imputed", "Deployed"];
  prStatus.innerHTML = statuses.map((status) => `<option ${currentValue === status ? "selected" : ""}>${status}</option>`).join("");
  if (!statuses.includes(currentValue)) prStatus.value = statuses[0];
}

function bindDailyEvents() {
  document.querySelector("[data-create-daily-report]")?.addEventListener("click", async () => {
    clearMessages();
    try {
      const data = await createDailyReport();
      state.success = data.added_daily_tasks
        ? `Parte diario creado con ${data.added_daily_tasks} tarea(s) diaria(s) obligatoria(s).`
        : "Parte diario creado.";
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

function bindDailyScheduleEvents() {
  document.querySelector("[data-toggle-extra-hours]")?.addEventListener("click", () => {
    state.dailyScheduleIncludeExtra = !state.dailyScheduleIncludeExtra;
    render();
  });

  document.querySelectorAll("[data-schedule-task]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("a, button, select, input, textarea, label")) return;
      state.detailTask = state.dailyTasks.find((task) => task.id === row.dataset.scheduleTask) ?? null;
      render();
    });
  });

  bindDailyTaskCompletionEvents();
  bindTaskTableEvents(state.dailyTasks);
  bindTaskModalEvents();
}

function bindDailyRoutineEvents() {
  document.querySelector("[data-open-daily-task-modal]")?.addEventListener("click", () => {
    state.modalTask = { ticket_type: DAILY_TICKET_TYPE };
    render();
  });

  document.querySelectorAll("[data-edit-daily-task]").forEach((button) => {
    button.addEventListener("click", () => {
      const task = state.dailyRoutineTasks.find((item) => item.id === button.dataset.editDailyTask);
      if (!task) return;
      state.modalTask = task;
      render();
    });
  });

  document.querySelectorAll("[data-finish-daily-task]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!window.confirm("¿Finalizar esta tarea diaria? Dejará de añadirse a los nuevos partes diarios.")) return;
      mutateTask({ id: button.dataset.finishDailyTask, task_status: "Done" });
    });
  });

  document.querySelectorAll("[data-reactivate-daily-task]").forEach((button) => {
    button.addEventListener("click", () => mutateTask({ id: button.dataset.reactivateDailyTask, task_status: "To do" }));
  });

  bindDailyTaskCompletionEvents();
  bindTaskModalEvents();
}

function bindDailyTaskCompletionEvents() {
  document.querySelectorAll("[data-daily-task-check]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => toggleDailyTaskCompletion(checkbox.dataset.dailyTaskCheck, checkbox.dataset.reportDate, checkbox.checked));
  });
}

async function toggleDailyTaskCompletion(taskId, reportDate, completed) {
  const key = dailyCompletionKey(taskId, reportDate);
  if (!taskId || !reportDate || state.dailyCompletionPending.has(key)) return;

  clearMessages();
  state.dailyCompletionPending.add(key);
  applyDailyCompletion(taskId, reportDate, completed ? new Date().toISOString() : null);
  render();

  try {
    await setDailyTaskCompletion({ task_id: taskId, report_date: reportDate, completed });
    state.success = completed ? "Tarea diaria marcada como realizada." : "Tarea diaria marcada como pendiente.";
  } catch (error) {
    state.error = error.message;
  }

  state.dailyCompletionPending.delete(key);
  // Reload from the server so the header indicator and checklists reflect the confirmed state (or revert on error).
  await loadDailyTaskState();
  renderUnlessEditingTask();
}

function applyDailyCompletion(taskId, reportDate, completedAt) {
  if (state.dailyReport?.report_date === reportDate) {
    state.dailyReportRoutineTasks = state.dailyReportRoutineTasks.map((task) => (task.id === taskId ? { ...task, completed_at: completedAt } : task));
  }
  if (completedAt) {
    state.dailyPending = { ...state.dailyPending, items: state.dailyPending.items.filter((item) => !(item.task_id === taskId && item.report_date === reportDate)) };
  }
}

async function loadDailyTaskState() {
  const [pendingResult, dailyResult] = await Promise.allSettled([
    listPendingDailyTasks(),
    getDailyReport(state.dailyDate, state.dailySort),
  ]);

  if (pendingResult.status === "fulfilled") setDailyPending(pendingResult.value);
  else state.error = pendingResult.reason.message;

  if (dailyResult.status === "fulfilled") applyDailyReportData(dailyResult.value);
  else state.error = dailyResult.reason.message;
}

function setDailyPending(data) {
  state.dailyPending = { today: data.today || todayIso(), items: data.items ?? [] };
}

function applyDailyReportData(data) {
  state.dailyReport = data.report;
  state.dailyTasks = data.tasks ?? [];
  state.dailyReportRoutineTasks = data.daily_tasks ?? [];
  state.dailyEditable = Boolean(data.editable);
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

  document.querySelectorAll("[data-edit-detail-task]").forEach((button) => {
    button.addEventListener("click", () => {
      const task = tasks.find((item) => item.id === button.dataset.editDetailTask) ?? findKnownTask(button.dataset.editDetailTask);
      if (!task) return;
      state.modalTask = task;
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
    await reloadCalendar();
  });

  document.querySelector("[data-calendar-prev]")?.addEventListener("click", async () => {
    shiftCalendarMonth(-1);
    await reloadCalendar();
  });

  document.querySelector("[data-calendar-next]")?.addEventListener("click", async () => {
    shiftCalendarMonth(1);
    await reloadCalendar();
  });

  document.querySelector("[data-calendar-current]")?.addEventListener("click", async () => {
    const now = new Date();
    state.calendarYear = now.getFullYear();
    state.calendarMonth = now.getMonth() + 1;
    await reloadCalendar();
  });

  document.querySelectorAll("[data-calendar-day]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      state.calendarModalDay = state.calendarDays.find((day) => day.date === card.dataset.calendarDay) ?? null;
      clearMessages();
      render();
    });
  });

  document.querySelectorAll("[data-close-calendar-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.calendarModalDay = null;
      render();
    });
  });

  document.querySelector("#calendar-day-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();
    const payload = formToObject(event.target);
    try {
      await updateCalendarDayStatus({ day: payload.day, status: payload.status, note: payload.note?.trim() || null });
      state.calendarModalDay = null;
      state.success = "Día actualizado.";
      await loadCalendar();
    } catch (error) {
      state.error = error.message;
    }
    render();
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

  document.querySelectorAll("[data-reset-configuration]").forEach((button) => {
    button.addEventListener("click", async () => {
      clearMessages();
      const configuration = state.configurations.find((item) => item.id === button.dataset.resetConfiguration);
      if (!configuration) return;
      try {
        await updateConfigurationProfile({ configuration_id: configuration.id, value: configuration.default_value });
        state.success = "Parámetro restablecido al valor por defecto.";
        await loadConfigurations({ preserveMessages: true });
      } catch (error) {
        state.error = error.message;
      }
      render();
    });
  });

  document.querySelector("[data-open-configuration-modal]")?.addEventListener("click", () => {
    state.configurationModalOpen = true;
    clearMessages();
    render();
  });

  document.querySelectorAll("[data-close-configuration-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      state.configurationModalOpen = false;
      render();
    });
  });

  document.querySelector("#configuration-create-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();
    const payload = normalizeConfigurationPayload(formToObject(event.target));
    try {
      await createConfiguration(payload);
      state.configurationModalOpen = false;
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

function mutateTask(payload) {
  clearMessages();
  const baseTask = findKnownTask(payload.id);
  const draft = buildPendingTaskDraft(withOptimisticComment(payload, baseTask), baseTask);
  const pendingKey = addPendingTask(draft, { label: "Guardando..." });
  if (state.detailTask?.id === payload.id) {
    state.detailTask = { ...draft, __pending: true, __pendingLabel: "Guardando..." };
  }
  state.success = "Cambios aplicados de forma provisional: se actualizarán al responder el servidor.";
  render();

  return runTaskMutation({
    pendingKey,
    action: () => updateTask(payload),
    successMessage: "Tarea actualizada.",
    selectedTaskId: payload.id,
  });
}

function withOptimisticComment(payload, baseTask) {
  if (!payload.comment) return payload;
  const { comment, ...rest } = payload;
  const comments = Array.isArray(baseTask?.comments) ? baseTask.comments : [];
  return { ...rest, comments: [...comments, { text: comment, created_at: new Date().toISOString() }] };
}

async function createTaskWithTicketOrder(payload) {
  const generatedTicket = buildNextTicket();
  const result = await createTask(payload);
  if (generatedTicket && String(payload.ticket ?? "").trim() === generatedTicket) {
    await advanceTicketOrder();
  }
  return result;
}

async function advanceTicketOrder() {
  const configuration = state.configurations.find((item) => item.name === TICKET_ORDER_CONFIGURATION_NAME);
  if (!configuration || configuration.readonly) return;

  const nextOrder = getNextTicketOrderValue(configuration.value);
  if (!nextOrder) return;

  try {
    await updateConfigurationProfile({ configuration_id: configuration.id, value: nextOrder });
  } catch (error) {
    state.error = `La tarea se creó pero no se pudo actualizar el contador de tickets: ${error.message}`;
  }
}

async function runTaskMutation({ pendingKey, action, successMessage, selectedTaskId = null }) {
  try {
    await action();
    await loadAllData({ preserveMessages: true, silent: true });
    removePendingTask(pendingKey);
    if (selectedTaskId) refreshSelectedTask(selectedTaskId);
    if (!state.error) state.success = successMessage;
  } catch (error) {
    removePendingTask(pendingKey);
    if (selectedTaskId) refreshSelectedTask(selectedTaskId);
    state.success = "";
    state.error = error.message;
  }
  renderUnlessEditingTask();
}

function refreshSelectedTask(taskId) {
  if (!state.detailTask || state.detailTask.id !== taskId) return;
  state.detailTask = findKnownTask(taskId);
}

async function loadAllData({ preserveMessages = false, silent = false } = {}) {
  await withLoading(async () => {
    const [tasksResult, dailyResult, calendarResult, configurationsResult, completionResult, orderResult, performanceResult, dailyRoutineResult, dailyPendingResult] = await Promise.allSettled([
      listTasks(state.filters),
      getDailyReport(state.dailyDate, state.dailySort),
      getCalendarMonth(state.calendarYear, state.calendarMonth),
      listConfigurations(),
      listCompletionTasks(),
      listOrderTasks(),
      getCalendarMonth(state.performanceYear, state.performanceMonth),
      listDailyRoutineTasks(),
      listPendingDailyTasks(),
    ]);

    state.timeEntries = listTimeEntries();

    const errors = [];

    if (tasksResult.status === "fulfilled") {
      state.tasks = tasksResult.value.tasks ?? [];
    } else {
      errors.push(tasksResult.reason.message);
    }

    if (dailyResult.status === "fulfilled") {
      applyDailyReportData(dailyResult.value);
    } else {
      errors.push(dailyResult.reason.message);
    }

    if (dailyRoutineResult.status === "fulfilled") {
      state.dailyRoutineTasks = dailyRoutineResult.value.tasks ?? [];
    } else {
      errors.push(dailyRoutineResult.reason.message);
    }

    if (dailyPendingResult.status === "fulfilled") {
      setDailyPending(dailyPendingResult.value);
    } else {
      errors.push(dailyPendingResult.reason.message);
    }

    if (calendarResult.status === "fulfilled") {
      state.calendarDays = calendarResult.value.days ?? [];
    } else {
      errors.push(calendarResult.reason.message);
    }

    if (configurationsResult.status === "fulfilled") {
      setConfigurations(configurationsResult.value.configurations ?? []);
    } else {
      errors.push(configurationsResult.reason.message);
    }

    if (completionResult.status === "fulfilled") {
      state.completionTasks = completionResult.value.tasks ?? [];
    } else {
      errors.push(completionResult.reason.message);
    }

    if (orderResult.status === "fulfilled") {
      state.orderTasks = orderResult.value.tasks ?? [];
    } else {
      errors.push(orderResult.reason.message);
    }

    if (performanceResult.status === "fulfilled") {
      state.performanceDays = performanceResult.value.days ?? [];
    } else {
      errors.push(performanceResult.reason.message);
    }

    if (errors.length) {
      state.success = "";
      state.error = errors.join(" ");
    }
  }, { preserveMessages, silent });
}

function setConfigurations(configurations) {
  state.configurations = configurations;
  applyProjectSettings(state.configurations);
}

async function loadConfigurations({ preserveMessages = false } = {}) {
  await withLoading(async () => {
    const data = await listConfigurations();
    setConfigurations(data.configurations ?? []);
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
    applyDailyReportData(data);
  });
}

async function loadCalendar() {
  await withLoading(async () => {
    const data = await getCalendarMonth(state.calendarYear, state.calendarMonth);
    state.calendarDays = data.days ?? [];
  });
}

function shiftCalendarMonth(delta) {
  const reference = new Date(state.calendarYear, state.calendarMonth - 1 + delta, 1);
  state.calendarYear = reference.getFullYear();
  state.calendarMonth = reference.getMonth() + 1;
}

async function reloadCalendar() {
  state.calendarModalDay = null;
  await loadCalendar();
  render();
}

async function loadPerformance() {
  await withLoading(async () => {
    const data = await getCalendarMonth(state.performanceYear, state.performanceMonth);
    state.performanceDays = data.days ?? [];
  });
}

function shiftPerformanceMonth(delta) {
  const reference = new Date(state.performanceYear, state.performanceMonth - 1 + delta, 1);
  state.performanceYear = reference.getFullYear();
  state.performanceMonth = reference.getMonth() + 1;
}

async function reloadPerformance() {
  await loadPerformance();
  render();
}

async function withLoading(action, { preserveMessages = false, silent = false } = {}) {
  if (!silent) state.loading = true;
  if (!preserveMessages) clearMessages();
  if (!silent) render();
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
    const selectedStatuses = Array.isArray(state.filters.statuses) ? state.filters.statuses : [];
    const matchesSearch = !search || [task.title, task.ticket, task.more_info]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
    const matchesStatus = !selectedStatuses.length || selectedStatuses.includes(task.task_status);
    const matchesPriority = !state.filters.priority || task.priority === state.filters.priority;
    const matchesDate = !state.filters.date || task.assigned_date === state.filters.date || task.finished_date === state.filters.date;
    const matchesHistory = state.filters.show_history || !isHiddenBacklogHistoryTask(task);
    return matchesSearch && matchesStatus && matchesPriority && matchesDate && matchesHistory;
  });
}

function isHiddenBacklogHistoryTask(task) {
  if (["Undone", "Unfinished"].includes(task.task_status)) return true;
  if (task.task_status !== "Done") return false;
  if (task.ticket_type === "Task") return task.pr_status === "Imputed";
  return task.pr_status === "Deployed";
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
  if (isDailyTask(normalized)) {
    normalized.effort_points = 0;
    normalized.order_points = null;
    return normalized;
  }
  normalized.effort_points = Number(normalized.effort_points || 0);
  normalized.order_points = normalized.order_points === "" ? null : Number(normalized.order_points);
  return normalized;
}

function normalizeCompletionResolvePayload(payload, status) {
  const normalized = { id: payload.id };
  if (status === "Need PR") {
    normalized.pr_link = payload.pr_link || "";
    if (payload.test_cases !== undefined) normalized.test_cases = payload.test_cases || "";
  }
  if (status === "Need to Impute") {
    normalized.imputed_date = payload.imputed_date;
  }
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


