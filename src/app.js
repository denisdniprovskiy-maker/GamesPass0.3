const STORAGE_KEY = "gamepass.storage";

const balanceValueEl = document.getElementById("balanceValue");
const balanceIndicatorEl = document.getElementById("balanceIndicator");

const workInput = document.getElementById("workInput");
const gameInput = document.getElementById("gameInput");

const workBtn = document.getElementById("workBtn");
const gameBtn = document.getElementById("gameBtn");
const resetBtn = document.getElementById("resetBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importInput = document.getElementById("importInput");
const taskIdInput = document.getElementById("taskIdInput");
const showLogBtn = document.getElementById("showLogBtn");
const logSection = document.getElementById("logSection");
const logContent = document.getElementById("logContent");

function createInitialState() {
  return {
    balance: 0,
    history: [],
  };
}

/**
 * Loads store from localStorage.
 * Supports legacy numeric storage for backwards-compatibility.
 */
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialState();

  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.balance === "number" &&
      Number.isFinite(parsed.balance) &&
      Array.isArray(parsed.history)
    ) {
      return parsed;
    }

    // Legacy format: just a number stored as a string
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) {
      return {
        balance: numeric,
        history: [],
      };
    }
  } catch {
    // fall through to reset
  }

  return createInitialState();
}

/**
 * Persists the full store to localStorage.
 */
function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateUI(state.balance);
}

/**
 * Updates the UI based on the current balance.
 */
function updateUI(balance) {
  balanceValueEl.textContent = balance.toFixed(0);

  const isNegative = balance < 0;
  balanceIndicatorEl.classList.toggle("negative", isNegative);
  balanceIndicatorEl.classList.toggle("positive", !isNegative);
}

/**
 * Adds a new entry to the transaction history.
 */
function isUuid(value) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

function addHistoryEntry(state, type, minutes, meta = {}) {
  const now = new Date().toISOString();
  const entry = {
    id: `${now}-${Math.random().toString(16).slice(2)}`,
    type,
    minutes,
    timestamp: now,
    balanceAfter: state.balance,
    ...meta,
  };

  state.history.push(entry);
}

/**
 * Applies working time (adds gaming minutes).
 */
function logWork() {
  const minutes = Number(workInput.value);
  const taskId = taskIdInput.value.trim();

  if (!Number.isFinite(minutes) || minutes <= 0) {
    workInput.focus();
    return;
  }

  if (!taskId || !isUuid(taskId)) {
    alert("Please enter a valid Task ID (UUID) before logging working time.");
    taskIdInput.focus();
    return;
  }

  const state = loadState();
  state.balance += minutes;
  addHistoryEntry(state, "work", minutes, { taskId });
  saveState(state);

  workInput.value = "";
  taskIdInput.value = "";
}

/**
 * Applies gaming time (subtracts minutes from the balance).
 */
function logGaming() {
  const minutes = Number(gameInput.value);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    gameInput.focus();
    return;
  }

  const state = loadState();
  state.balance -= minutes;
  addHistoryEntry(state, "gaming", minutes);
  saveState(state);

  gameInput.value = "";
}

/**
 * Resets the balance and history back to initial state.
 */
function resetBalance() {
  saveState(createInitialState());
}

/**
 * Exports the current state (balance + history) to a JSON file for download.
 */
function exportBalance() {
  const state = loadState();
  const payload = {
    ...state,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `gamepass-balance-${Date.now()}.json`;
  anchor.click();

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Displays the transaction log in the UI.
 */
function showLog() {
  const state = loadState();
  const history = state.history;

  if (history.length === 0) {
    logContent.innerHTML = "<p>No transactions yet.</p>";
  } else {
    const list = history
      .map((entry) => {
        const date = new Date(entry.timestamp).toLocaleString();
        const typeLabel = entry.type === "work" ? "Worked" : "Gamed";
        const taskInfo = entry.taskId ? ` (Task: ${entry.taskId})` : "";
        return `<li>${date}: ${typeLabel} ${entry.minutes} min${taskInfo} → Balance: ${entry.balanceAfter} min</li>`;
      })
      .join("");
    logContent.innerHTML = `<ul>${list}</ul>`;
  }

  logSection.style.display = logSection.style.display === "none" ? "block" : "none";
}

workBtn.addEventListener("click", logWork);
gameBtn.addEventListener("click", logGaming);
resetBtn.addEventListener("click", resetBalance);
exportBtn.addEventListener("click", exportBalance);
importBtn.addEventListener("click", () => importInput.click());
importInput.addEventListener("change", () => {
  if (importInput.files && importInput.files[0]) {
    importBalance(importInput.files[0]);
    importInput.value = "";
  }
});
showLogBtn.addEventListener("click", showLog);

// Initialize UI
updateUI(getBalance());
