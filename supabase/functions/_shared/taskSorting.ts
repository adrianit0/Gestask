type SortDirection = "asc" | "desc";
type SortableTask = Record<string, any>;

const allowedSortFields = new Set([
  "order_points",
  "scoring",
  "assigned_date",
  "limit_date",
  "finished_date",
  "priority",
  "task_status",
  "pr_status",
  "ticket_type",
  "created_at",
  "updated_at",
]);

const priorityValues: Record<string, number> = {
  trivial: 1,
  menor: 2,
  prioritaria: 3,
  critica: 4,
  bloqueante: 5,
};

export function parseTaskSort(searchParams: URLSearchParams, defaults: { sortBy: string; sortDirection: SortDirection }) {
  const sortBy = searchParams.get("sort_by") ?? defaults.sortBy;
  const sortDirection = searchParams.get("sort_direction") ?? defaults.sortDirection;

  if (!allowedSortFields.has(sortBy)) return { error: "Invalid sort field." } as const;
  if (sortDirection !== "asc" && sortDirection !== "desc") return { error: "Invalid sort direction." } as const;

  return { sortBy, sortDirection } as const;
}

export function sortTasks<T extends SortableTask>(tasks: T[], sortBy: string, sortDirection: SortDirection) {
  return [...tasks].sort((a, b) => {
    const compared = compareValues(getSortValue(a, sortBy), getSortValue(b, sortBy), sortDirection, sortBy);
    if (compared !== 0) return compared;

    const createdAtCompared = compareValues(getSortValue(a, "created_at"), getSortValue(b, "created_at"), "desc", "created_at");
    if (createdAtCompared !== 0) return createdAtCompared;

    return compareValues(getSortValue(a, "id"), getSortValue(b, "id"), "asc", "id");
  });
}

function getSortValue(task: SortableTask, sortBy: string) {
  if (sortBy === "priority") return priorityValues[normalizeKey(task.priority)] ?? 0;
  return task[sortBy];
}

function compareValues(a: unknown, b: unknown, direction: SortDirection, sortBy: string) {
  const aMissing = a === null || a === undefined || a === "";
  const bMissing = b === null || b === undefined || b === "";

  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;

  let result: number;
  if (typeof a === "number" && typeof b === "number") {
    result = a - b;
  } else if (sortBy.endsWith("_date") || sortBy === "created_at" || sortBy === "updated_at") {
    result = new Date(String(a)).getTime() - new Date(String(b)).getTime();
  } else {
    result = String(a).localeCompare(String(b));
  }

  return direction === "asc" ? result : -result;
}

function normalizeKey(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
