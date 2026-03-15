# Copilot Instructions for GamePass

This project is a simple web UI for tracking gaming time balance based on working time and gaming time logs. The key behavior is:

- Logging **working time** increases the gaming-time balance.
- Logging **gaming time** decreases the gaming-time balance.
- The balance can go negative; when negative, the accumulator is shown in **red**.

## Files of primary interest

- `index.html`
- `src/app.js`
- `src/styles.css`

If you add new functionality, make sure it still meets the acceptance criteria:
- Accumulator uses green when balance ≥ 0, red when balance < 0.
- Gaming time can be logged even if balance is zero.
- Balance persists across refreshes.
