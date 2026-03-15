# GamePass Time Tracker

A small web-based app that lets users log working time and gaming time, and see a gaming time balance.

## 🧾 User Story

- As a GamePass application user, I want to log my working time and gaming time and check the balance of working time and gaming time.

## ✅ Acceptance Criteria Implemented

- The app displays a **gaming time balance** and an **accumulator indicator**.
- When you log working time, the system **adds gaming time** to the balance.
- When you log gaming time, the system **decreases gaming time balance**.
- The system allows logging gaming time even if the balance is zero; it will display a **negative balance** and the accumulator becomes **red**.

## 🚀 How to Run

1. Open `index.html` in your browser.

> Tip: For best results, run a local file server (e.g., `npx serve` or the "Live Server" VS Code extension), so the app can persist data using `localStorage`.

## 🔧 Files

- `index.html` — main app layout.
- `src/app.js` — core logic and state management.
- `src/styles.css` — styling.

## ♻️ Persistence

The app stores the balance in `localStorage`, so your balance persists across browser refreshes.
