const TIME_ENTRIES_KEY = "gestask.timeEntries";

export function listTimeEntries() {
  return readEntries().sort((left, right) => `${right.date} ${right.start_time}`.localeCompare(`${left.date} ${left.start_time}`));
}

export function saveTimeEntry(payload) {
  const entries = readEntries();
  const normalized = normalizeEntry(payload);
  if (normalized.id) {
    const index = entries.findIndex((entry) => entry.id === normalized.id);
    if (index >= 0) entries[index] = normalized;
    else entries.push(normalized);
  } else {
    entries.push({ ...normalized, id: crypto.randomUUID() });
  }
  writeEntries(entries);
  return normalized;
}

export function deleteTimeEntry(id) {
  writeEntries(readEntries().filter((entry) => entry.id !== id));
}

function readEntries() {
  const raw = localStorage.getItem(TIME_ENTRIES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(TIME_ENTRIES_KEY);
    return [];
  }
}

function writeEntries(entries) {
  localStorage.setItem(TIME_ENTRIES_KEY, JSON.stringify(entries));
}

function normalizeEntry(payload) {
  return {
    id: payload.id || "",
    task_id: payload.task_id,
    date: payload.date,
    start_time: payload.start_time,
    end_time: payload.end_time,
    notes: payload.notes?.trim() || "",
  };
}
