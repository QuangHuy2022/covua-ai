I will fix the "stuck on waiting for connection" issue by adding a connection timeout and ensuring the game screen only appears *after* a successful connection.

### 1. Update `PeerConnector.ts`
- **Add Timeout**: Modify the `connect` method to include a 15-second timeout. If the connection isn't established by then, it will fail with a "Connection timeout" error instead of hanging indefinitely.

### 2. Update Game Logic (`ChessGame.tsx`, `XiangqiGame.tsx`, `GoGame.tsx`)
- **Fix UI Transition**: Currently, the game switches to the board screen *immediately* after you click "Join", before the connection is actually made. I will change this so it waits for the connection to succeed first.
- **Add Loading State**:
    - Add an `isConnecting` state to show a "Đang kết nối..." (Connecting...) indicator on the button.
    - Disable the button while connecting to prevent double-clicks.
- **Error Handling**: If the connection fails (e.g., timeout or invalid ID), show an alert to the user and stay on the setup screen so they can try again.

### Steps:
1.  Modify `app/src/online/PeerConnector.ts` to implement the connection timeout.
2.  Update `ChessGame.tsx`, `XiangqiGame.tsx`, and `GoGame.tsx` to handle the `isConnecting` state and defer the screen switch.
