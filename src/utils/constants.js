export const TASK_STATUSES = ["To do", "Doing", "Draft", "Undone", "Unfinished", "Need Fix", "Waiting", "Done", "Warning"];
export const PR_STATUSES = ["Not Finished", "Need PR", "PR Hecho", "Imputed", "Deployed"];
export const TASK_PR_STATUSES = ["Not Finished", "Imputed"];
export const TICKET_TYPES = ["Bug", "Feature", "Task"];
export const PRIORITIES = ["Trivial", "Menor", "Prioritaria", "Crítica", "Bloqueante"];
export const DAY_STATUSES = ["Laboral", "Vacaciones", "Festivos", "Ausencia"];

export const TASK_COLORS = {
  "To do": {
    Trivial: "#ffd8ce",
    Menor: "#ffcccc",
    Prioritaria: "#ffb9b9",
    Crítica: "#ffa6a6",
    Bloqueante: "#ff6d6d",
  },
  Doing: "#ffbf00",
  Draft: "#999999",
  Undone: "#fff5ce",
  Unfinished: "#f6f9d4",
  "Need Fix": "#b4c7dc",
  Waiting: "#ffdbb6",
  Done: "#ccffcc",
  Warning: "#bbbbbb",
};

export const PR_BORDER_COLORS = {
  "Need PR": "#cc0000",
  "PR Hecho": "#ffbf00",
  Imputed: "#b4c7dc",
  Deployed: "#5eb91e",
};
