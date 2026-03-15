const STORAGE_KEY = "gamepass.balance";

const balanceValueEl = document.getElementById("balanceValue");
const balanceIndicatorEl = document.getElementById("balanceIndicator");

const workInput = document.getElementById("workInput");
const gameInput = document.getElementById("gameInput");

const workBtn = document.getElementById("workBtn");
const gameBtn = document.getElementById("gameBtn");
const resetBtn = document.getElementById("resetBtn");

/**
 * Gets the current balance from localStorage.
 * Defaults to 0 if not set or invalid.
 */
function getBalance() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Persists the balance to localStorage.
 */
function setBalance(value) {
  localStorage.setItem(STORAGE_KEY, String(value));
  updateUI(value);
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
 * Applies working time (adds gaming minutes).
 */
function logWork() {
  const minutes = Number(workInput.value);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    workInput.focus();
    return;
  }

  const current = getBalance();
  setBalance(current + minutes);
  workInput.value = "";
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

  const current = getBalance();
  setBalance(current - minutes);
  gameInput.value = "";
}

/**
 * Resets the balance back to zero.
 */
function resetBalance() {
  setBalance(0);
}

workBtn.addEventListener("click", logWork);
gameBtn.addEventListener("click", logGaming);
resetBtn.addEventListener("click", resetBalance);

// Initialize UI
updateUI(getBalance());
