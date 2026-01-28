export type Stone = 'b' | 'w';
export type Board = (Stone | null)[][];

export const BOARD_SIZE = 13;

export const getGroup = (boardState: Board, r: number, c: number): { stones: {r: number, c: number}[], liberties: number } => {
    const color = boardState[r][c];
    if (!color) return { stones: [], liberties: 0 };

    const stones: {r: number, c: number}[] = [];
    const queue = [{r, c}];
    const visited = new Set<string>();
    const libertiesSet = new Set<string>();
    
    visited.add(`${r},${c}`);

    while (queue.length > 0) {
      const {r: currR, c: currC} = queue.shift()!;
      stones.push({r: currR, c: currC});

      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dr, dc] of dirs) {
        const nr = currR + dr;
        const nc = currC + dc;
        
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          const neighbor = boardState[nr][nc];
          if (neighbor === null) {
            libertiesSet.add(`${nr},${nc}`);
          } else if (neighbor === color && !visited.has(`${nr},${nc}`)) {
            visited.add(`${nr},${nc}`);
            queue.push({r: nr, c: nc});
          }
        }
      }
    }

    return { stones, liberties: libertiesSet.size };
};

export const tryMakeMove = (board: Board, r: number, c: number, turn: Stone, previousBoard?: Board): { 
    success: boolean; 
    newBoard: Board | null; 
    captured: number; 
    error?: string 
} => {
    if (board[r][c]) return { success: false, newBoard: null, captured: 0, error: 'Occupied' };

    // Create copy
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = turn;

    // Check captures of opponent
    const opponent = turn === 'b' ? 'w' : 'b';
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    let capturedCount = 0;
    const stonesToRemove: {r: number, c: number}[] = [];

    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        if (newBoard[nr][nc] === opponent) {
          const group = getGroup(newBoard, nr, nc);
          if (group.liberties === 0) {
            group.stones.forEach(s => {
                 if (!stonesToRemove.some(rem => rem.r === s.r && rem.c === s.c)) {
                     stonesToRemove.push(s);
                 }
            });
          }
        }
      }
    }

    // Remove captured stones
    stonesToRemove.forEach(s => {
      newBoard[s.r][s.c] = null;
    });
    capturedCount = stonesToRemove.length;

    // Check suicide
    if (capturedCount === 0) {
        const group = getGroup(newBoard, r, c);
        if (group.liberties === 0) {
            return { success: false, newBoard: null, captured: 0, error: 'Suicide' };
        }
    }

    // Ko Rule Check
    if (previousBoard) {
        const isKo = newBoard.every((row, r) => row.every((cell, c) => cell === previousBoard[r][c]));
        if (isKo) {
            return { success: false, newBoard: null, captured: 0, error: 'Ko' };
        }
    }

    return { success: true, newBoard, captured: capturedCount };
};
