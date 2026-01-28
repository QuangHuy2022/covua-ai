import { Chess } from 'chess.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

const PIECE_VALUES: Record<string, number> = {
    p: 10,
    n: 30,
    b: 30,
    r: 50,
    q: 90,
    k: 900,
};

const evaluateBoard = (game: Chess): number => {
    const board = game.board();
    let totalEvaluation = 0;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                const value = PIECE_VALUES[piece.type] || 0;
                totalEvaluation += piece.color === 'w' ? value : -value;
            }
        }
    }
    return totalEvaluation;
};

const minimax = (
    game: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizingPlayer: boolean
): number => {
    if (depth === 0 || game.isGameOver()) {
        return evaluateBoard(game);
    }

    const moves = game.moves();

    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of moves) {
            game.move(move);
            const evalValue = minimax(game, depth - 1, alpha, beta, false);
            game.undo();
            maxEval = Math.max(maxEval, evalValue);
            alpha = Math.max(alpha, evalValue);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            game.move(move);
            const evalValue = minimax(game, depth - 1, alpha, beta, true);
            game.undo();
            minEval = Math.min(minEval, evalValue);
            beta = Math.min(beta, evalValue);
            if (beta <= alpha) break;
        }
        return minEval;
    }
};

export const getBestMove = (game: Chess, difficulty: Difficulty): string | null => {
    const moves = game.moves();
    if (moves.length === 0) return null;

    // Easy: Random move
    if (difficulty === 'easy') {
        const randomIndex = Math.floor(Math.random() * moves.length);
        return moves[randomIndex];
    }

    // Medium/Hard: Minimax
    // AI is usually Black in this context (if user plays White), but we should support both.
    // However, the evaluation function returns + for White, - for Black.
    // If AI is White, it wants to Maximize. If AI is Black, it wants to Minimize.
    
    const isWhiteTurn = game.turn() === 'w';
    const depth = difficulty === 'medium' ? 2 : 3;

    let bestMove: string | null = null;
    let bestValue = isWhiteTurn ? -Infinity : Infinity;

    // Shuffle moves to add some variety if scores are equal
    const shuffledMoves = moves.sort(() => Math.random() - 0.5);

    for (const move of shuffledMoves) {
        game.move(move);
        const boardValue = minimax(
            game,
            depth - 1,
            isWhiteTurn ? -Infinity : -Infinity, // Alpha (Note: Alpha should start at -Infinity)
            isWhiteTurn ? Infinity : Infinity,   // Beta (Note: Beta should start at Infinity)
            !isWhiteTurn // Next is minimizing if current is maximizing
        );
        game.undo();

        if (isWhiteTurn) {
            if (boardValue > bestValue) {
                bestValue = boardValue;
                bestMove = move;
            }
        } else {
            if (boardValue < bestValue) {
                bestValue = boardValue;
                bestMove = move;
            }
        }
    }

    return bestMove || moves[0];
};
