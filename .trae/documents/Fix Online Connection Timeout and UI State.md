I will fix the "stuck on waiting for connection" issue by adding a timeout to the connection logic and preventing the UI from switching screens until the connection is successfully established.

**Plan:**

1.  **Update `app/src/online/PeerConnector.ts`**:
    *   Modify the `connect` method to include a 15-second timeout.
    *   If the connection isn't established within the timeout, the promise will be rejected, allowing the game to handle the error.

2.  **Update Game Components** (`ChessGame.tsx`, `XiangqiGame.tsx`, `GoGame.tsx`):
    *   Add a new state `isConnecting` to track the connection status.
    *   Update `joinOnlineRoom` to:
        *   Set `isConnecting` to `true` when starting.
        *   **Only** hide the setup modal (`setShowSetup(false)`) after the connection succeeds.
        *   Show an error alert and keep the setup modal open if the connection fails (or times out).
        *   Set `isConnecting` to `false` in a `finally` block.
    *   Update the "Join Room" button in the UI to show a "Connecting..." state and be disabled while connecting.

This ensures users won't be stuck on a "Waiting..." screen if the connection fails silently.