import { getValidMovesForPiece, type Piece, type Move, type PieceColor, type PieceType } from './XiangqiLogic';

export type Difficulty = 'easy' | 'medium' | 'hard';

const PIECE_VALUES: Record<PieceType, number> = {
  k: 10000,
  r: 90,
  c: 45,
  n: 40,
  b: 20,
  a: 20,
  p: 10,
};

const evaluateBoard = (board: (Piece | null)[][]): number => {
  let score = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = board[r][c];
      if (piece) {
        let value = PIECE_VALUES[piece.type];
        // Bonus for pawns crossing river
        if (piece.type === 'p') {
             if (piece.color === 'r' && r <= 4) value += 10;
             if (piece.color === 'b' && r >= 5) value += 10;
        }
        score += piece.color === 'r' ? value : -value;
      }
    }
  }
  return score;
};

const getAllMoves = (board: (Piece | null)[][], turn: PieceColor): Move[] => {
    const moves: Move[] = [];
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 9; c++) {
            const piece = board[r][c];
            if (piece && piece.color === turn) {
                const validDestinations = getValidMovesForPiece(piece, r, c, board);
                validDestinations.forEach(dest => {
                    moves.push({
                        from: { row: r, col: c },
                        to: dest,
                        captured: board[dest.row][dest.col]
                    });
                });
            }
        }
    }
    return moves;
};

// Simulate move
const makeMove = (board: (Piece | null)[][], move: Move) => {
    const newBoard = board.map(row => [...row]);
    newBoard[move.to.row][move.to.col] = newBoard[move.from.row][move.from.col];
    newBoard[move.from.row][move.from.col] = null;
    return newBoard;
};

const minimax = (
    board: (Piece | null)[][], 
    depth: number, 
    alpha: number, 
    beta: number, 
    isMaximizingPlayer: boolean, // True if Red (AI plays Black usually, but let's handle generic)
    turn: PieceColor
): number => {
    if (depth === 0) {
        return evaluateBoard(board);
    }

    // Check for King capture (Game Over condition approximation)
    // Actually standard minimax checks game over. 
    // Optimization: If King missing, return Infinity.
    let redKing = false;
    let blackKing = false;
    for(let r=0; r<10; r++) for(let c=0; c<9; c++) {
        const p = board[r][c];
        if (p?.type === 'k') {
            if (p.color === 'r') redKing = true;
            else blackKing = true;
        }
    }
    if (!redKing) return -100000;
    if (!blackKing) return 100000;

    const moves = getAllMoves(board, turn);
    
    // Simple ordering: captures first
    moves.sort((a, b) => {
        const scoreA = a.captured ? PIECE_VALUES[a.captured.type] : 0;
        const scoreB = b.captured ? PIECE_VALUES[b.captured.type] : 0;
        return scoreB - scoreA;
    });

    if (isMaximizingPlayer) { // Red
        let maxEval = -Infinity;
        for (const move of moves) {
            const nextBoard = makeMove(board, move);
            const evalValue = minimax(nextBoard, depth - 1, alpha, beta, false, 'b');
            maxEval = Math.max(maxEval, evalValue);
            alpha = Math.max(alpha, evalValue);
            if (beta <= alpha) break;
        }
        return maxEval === -Infinity ? -100000 : maxEval; // No moves = loss?
    } else { // Black
        let minEval = Infinity;
        for (const move of moves) {
            const nextBoard = makeMove(board, move);
            const evalValue = minimax(nextBoard, depth - 1, alpha, beta, true, 'r');
            minEval = Math.min(minEval, evalValue);
            beta = Math.min(beta, evalValue);
            if (beta <= alpha) break;
        }
        return minEval === Infinity ? 100000 : minEval;
    }
};

export const getBestMove = (board: (Piece | null)[][], turn: PieceColor, difficulty: Difficulty): Move | null => {
    const moves = getAllMoves(board, turn);
    if (moves.length === 0) return null;

    if (difficulty === 'easy') {
        // Random move with slight preference for captures
        const captures = moves.filter(m => m.captured);
        if (captures.length > 0 && Math.random() > 0.3) {
            return captures[Math.floor(Math.random() * captures.length)];
        }
        return moves[Math.floor(Math.random() * moves.length)];
    }

    const depth = difficulty === 'medium' ? 2 : 3;
    let bestMove = null;
    let bestValue = turn === 'r' ? -Infinity : Infinity;

    // Optimization: Order moves
    moves.sort((a, b) => {
        const scoreA = a.captured ? PIECE_VALUES[a.captured.type] : 0;
        const scoreB = b.captured ? PIECE_VALUES[b.captured.type] : 0;
        return scoreB - scoreA;
    });

    for (const move of moves) {
        const nextBoard = makeMove(board, move);
        // If Red (Max) is playing, we want to Maximize, so next is Min (Black)
        // If Black (Min) is playing, we want to Minimize, so next is Max (Red)
        const value = minimax(nextBoard, depth - 1, -Infinity, Infinity, turn === 'b', turn === 'r' ? 'b' : 'r');
        
        if (turn === 'r') {
            if (value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
        } else {
            if (value < bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }
    }

    return bestMove || moves[0];
};
