export type PieceType = 'k' | 'a' | 'b' | 'n' | 'r' | 'c' | 'p'; 
export type PieceColor = 'r' | 'b'; 

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  captured?: Piece | null;
}

export const initialBoard: (Piece | null)[][] = [
  [{ type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, { type: 'a', color: 'b' }, { type: 'k', color: 'b' }, { type: 'a', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' }],
  [null, null, null, null, null, null, null, null, null],
  [null, { type: 'c', color: 'b' }, null, null, null, null, null, { type: 'c', color: 'b' }, null],
  [{ type: 'p', color: 'b' }, null, { type: 'p', color: 'b' }, null, { type: 'p', color: 'b' }, null, { type: 'p', color: 'b' }, null, { type: 'p', color: 'b' }],
  [null, null, null, null, null, null, null, null, null], 
  [null, null, null, null, null, null, null, null, null], 
  [{ type: 'p', color: 'r' }, null, { type: 'p', color: 'r' }, null, { type: 'p', color: 'r' }, null, { type: 'p', color: 'r' }, null, { type: 'p', color: 'r' }],
  [null, { type: 'c', color: 'r' }, null, null, null, null, null, { type: 'c', color: 'r' }, null],
  [null, null, null, null, null, null, null, null, null],
  [{ type: 'r', color: 'r' }, { type: 'n', color: 'r' }, { type: 'b', color: 'r' }, { type: 'a', color: 'r' }, { type: 'k', color: 'r' }, { type: 'a', color: 'r' }, { type: 'b', color: 'r' }, { type: 'n', color: 'r' }, { type: 'r', color: 'r' }],
];

export const isValidPos = (r: number, c: number) => r >= 0 && r < 10 && c >= 0 && c < 9;

export const getValidMovesForPiece = (piece: Piece, r: number, c: number, currentBoard: (Piece | null)[][]): Position[] => {
    const moves: Position[] = [];
    const isRed = piece.color === 'r';

    // Helper to add move if valid
    const checkMove = (nr: number, nc: number) => {
      if (!isValidPos(nr, nc)) return false;
      const target = currentBoard[nr][nc];
      if (target && target.color === piece.color) return false; // Blocked by own piece
      moves.push({ row: nr, col: nc });
      return target === null; // Return true if empty, false if capture
    };

    switch (piece.type) {
      case 'r': // Rook
        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
          let nr = r + dr;
          let nc = c + dc;
          while (isValidPos(nr, nc)) {
            const target = currentBoard[nr][nc];
            if (target) {
              if (target.color !== piece.color) moves.push({ row: nr, col: nc });
              break;
            }
            moves.push({ row: nr, col: nc });
            nr += dr;
            nc += dc;
          }
        });
        break;
      case 'n': // Horse
        [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]].forEach(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;
            // Hobbling leg check
            const legR = r + (Math.abs(dr) === 2 ? Math.sign(dr) : 0);
            const legC = c + (Math.abs(dc) === 2 ? Math.sign(dc) : 0);
            if (isValidPos(legR, legC) && !currentBoard[legR][legC]) {
               checkMove(nr, nc);
            }
        });
        break;
      case 'c': // Cannon
         [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(([dr, dc]) => {
          let nr = r + dr;
          let nc = c + dc;
          let jumped = false;
          while (isValidPos(nr, nc)) {
            const target = currentBoard[nr][nc];
            if (!jumped) {
              if (target) {
                jumped = true;
              } else {
                moves.push({ row: nr, col: nc });
              }
            } else {
              if (target) {
                if (target.color !== piece.color) moves.push({ row: nr, col: nc });
                break;
              }
            }
            nr += dr;
            nc += dc;
          }
        });
        break;
      case 'p': // Pawn
        const forward = isRed ? -1 : 1;
        checkMove(r + forward, c);
        // If crossed river
        const crossedRiver = isRed ? r <= 4 : r >= 5;
        if (crossedRiver) {
            checkMove(r, c - 1);
            checkMove(r, c + 1);
        }
        break;
      case 'k': // King
      case 'a': // Advisor
        const isKing = piece.type === 'k';
        const drs = isKing ? [[0, 1], [0, -1], [1, 0], [-1, 0]] : [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        drs.forEach(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;
            // Palace check
            if (nc < 3 || nc > 5) return;
            if (isRed) {
                if (nr < 7 || nr > 9) return;
            } else {
                if (nr < 0 || nr > 2) return;
            }
            checkMove(nr, nc);
        });
        
        // Flying General Rule
        if (isKing) {
            const forward = isRed ? -1 : 1;
            let nr = r + forward;
            while(isValidPos(nr, c)) {
                const target = currentBoard[nr][c];
                if (target) {
                    if (target.type === 'k' && target.color !== piece.color) {
                        moves.push({ row: nr, col: c });
                    }
                    break;
                }
                nr += forward;
            }
        }
        break;
      case 'b': // Elephant
        [[2, 2], [2, -2], [-2, 2], [-2, -2]].forEach(([dr, dc]) => {
            const nr = r + dr;
            const nc = c + dc;
            // River check
            if (isRed && nr < 5) return;
            if (!isRed && nr > 4) return;
            // Eye check
            const eyeR = r + dr / 2;
            const eyeC = c + dc / 2;
            if (isValidPos(eyeR, eyeC) && !currentBoard[eyeR][eyeC]) {
                checkMove(nr, nc);
            }
        });
        break;
    }
    return moves;
  };
