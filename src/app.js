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
 * Exports the transaction history to a CSV file for download.
 */
function exportBalance() {
  const state = loadState();
  const history = state.history;

  if (history.length === 0) {
    alert("No transactions to export.");
    return;
  }

  // CSV header
  let csv = "Timestamp,Type,Minutes,TaskId,BalanceAfter\n";

  // Add rows
  history.forEach((entry) => {
    const row = [
      entry.timestamp,
      entry.type,
      entry.minutes,
      entry.taskId || "",
      entry.balanceAfter,
    ];
    csv += row.map((field) => `"${field}"`).join(",") + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `gamepass-logs-${Date.now()}.csv`;
  anchor.click();

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Imports state (balance + history) from a JSON file or adds history from a CSV file.
 */
function importBalance(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const content = reader.result;
    const isCsv = file.name.endsWith('.csv') || content.trim().startsWith('Timestamp,Type,Minutes,TaskId,BalanceAfter');

    if (isCsv) {
      // Parse CSV and add to history
      const lines = content.trim().split('\n');
      if (lines.length < 2) {
        alert("Invalid CSV file.");
        return;
      }

      const state = loadState();
      const header = lines[0].split(',');
      if (header.length !== 5 || header[0] !== 'Timestamp' || header[1] !== 'Type' || header[2] !== 'Minutes' || header[3] !== 'TaskId' || header[4] !== 'BalanceAfter') {
        alert("Invalid CSV format. Expected columns: Timestamp,Type,Minutes,TaskId,BalanceAfter");
        return;
      }

      let balance = state.balance;
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(',').map(cell => cell.replace(/^"|"$/g, ''));
        if (cells.length !== 5) continue;

        const [timestamp, type, minutesStr, taskId, balanceAfterStr] = cells;
        const minutes = Number(minutesStr);
        const balanceAfter = Number(balanceAfterStr);

        if (!Number.isFinite(minutes) || !Number.isFinite(balanceAfter)) continue;

        // Adjust balance
        if (type === 'work') {
          balance += minutes;
        } else if (type === 'gaming') {
          balance -= minutes;
        }

        // Add entry
        const entry = {
          id: `${timestamp}-${Math.random().toString(16).slice(2)}`,
          type,
          minutes,
          timestamp,
          balanceAfter: balance,
          ...(taskId && { taskId }),
        };
        state.history.push(entry);
      }

      saveState(state);
    } else {
      // Parse JSON
      try {
        const value = JSON.parse(content);
        if (
          !value ||
          typeof value !== "object" ||
          typeof value.balance !== "number" ||
          !Number.isFinite(value.balance) ||
          !Array.isArray(value.history)
        ) {
          throw new Error("Invalid state file");
        }

        saveState({
          balance: value.balance,
          history: value.history,
        });
      } catch (err) {
        alert("Failed to load state from file. Make sure it is a valid GamePass JSON export or CSV.");
      }
    }
  };
  reader.readAsText(file);
}
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
