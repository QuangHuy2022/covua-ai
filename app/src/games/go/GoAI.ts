import { type Board, type Stone, BOARD_SIZE, tryMakeMove } from './GoLogic';

export type Difficulty = 'easy' | 'medium' | 'hard';

interface Move {
    r: number;
    c: number;
}

const getLegalMoves = (board: Board, turn: Stone, previousBoard?: Board): Move[] => {
    const moves: Move[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (!board[r][c]) {
                const result = tryMakeMove(board, r, c, turn, previousBoard);
                if (result.success) {
                    moves.push({ r, c });
                }
            }
        }
    }
    return moves;
};

// Heuristic Evaluation
const evaluateBoard = (board: Board, turn: Stone, capturedMyself: number, capturedOpponent: number): number => {
    let score = (capturedMyself - capturedOpponent) * 10;
    
    // Count stones and liberties
    let myStones = 0;
    let oppStones = 0;
    let myLiberties = 0;
    let oppLiberties = 0;

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === turn) {
                myStones++;
                // Liberties (approximate, re-calculating group liberties is expensive for full board loop, 
                // but getGroup is efficient enough if we skip visited)
                // Simplified: just check empty neighbors for each stone
                const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                for (const [dr, dc] of dirs) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !board[nr][nc]) {
                        myLiberties++;
                    }
                }
            } else if (board[r][c]) {
                oppStones++;
                const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                for (const [dr, dc] of dirs) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !board[nr][nc]) {
                        oppLiberties++;
                    }
                }
            }
        }
    }

    score += myStones - oppStones;
    score += (myLiberties - oppLiberties) * 0.5;

    return score;
};

// Strategic candidate selection to reduce branching factor
const getCandidateMoves = (board: Board, turn: Stone, previousBoard?: Board): Move[] => {
    const allMoves = getLegalMoves(board, turn, previousBoard);
    if (allMoves.length === 0) return [];

    // Filter moves:
    // 1. Neighbors of existing stones (local play)
    // 2. Star points if board is empty-ish
    // 3. Random sample
    
    const importantPoints = new Set<string>();

    // Add star points
    const stars = [3, 9, 6];
    stars.forEach(r => stars.forEach(c => {
        if (!board[r][c]) importantPoints.add(`${r},${c}`);
    }));

    // Add neighbors of all stones
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c]) {
                // Add 2-step radius neighbors
                for (let dr = -2; dr <= 2; dr++) {
                    for (let dc = -2; dc <= 2; dc++) {
                         const nr = r + dr;
                         const nc = c + dc;
                         if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && !board[nr][nc]) {
                             importantPoints.add(`${nr},${nc}`);
                         }
                    }
                }
            }
        }
    }

    // Filter allMoves to keep only important ones + some randoms
    const interestingMoves = allMoves.filter(m => importantPoints.has(`${m.r},${m.c}`));
    
    // If board is empty, interestingMoves might be just stars. 
    // If board has stones, interestingMoves are local battles.
    
    // Combine with some random moves to ensure exploration
    const randomMoves = allMoves.filter(m => !importantPoints.has(`${m.r},${m.c}`));
    // Shuffle randoms
    for (let i = randomMoves.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [randomMoves[i], randomMoves[j]] = [randomMoves[j], randomMoves[i]];
    }

    // Return candidates: all interesting + up to 5 randoms
    return [...interestingMoves, ...randomMoves.slice(0, 5)];
};

export const getBestMove = (board: Board, turn: Stone, difficulty: Difficulty, previousBoard?: Board): Move | null => {
    const moves = getLegalMoves(board, turn, previousBoard);
    if (moves.length === 0) return null;

    if (difficulty === 'easy') {
        // Pure random
        return moves[Math.floor(Math.random() * moves.length)];
    }

    // Medium/Hard: Use heuristic
    // For Medium: Greedy depth 1
    // For Hard: Depth 2 (minimax)
    
    const candidates = getCandidateMoves(board, turn, previousBoard);
    if (candidates.length === 0) return moves[0]; // Fallback

    let bestMove = candidates[0];
    let bestScore = -Infinity;

    for (const move of candidates) {
        // Simulate move
        const res = tryMakeMove(board, move.r, move.c, turn, previousBoard);
        if (!res.success || !res.newBoard) continue;

        let score = 0;
        
        if (difficulty === 'medium') {
            score = evaluateBoard(res.newBoard, turn, res.captured, 0);
        } else {
            // Hard: Minimax Depth 1 (Look at opponent's best response)
            // We want to MAXIMIZE (My Score - Opponent Score)
            // Opponent wants to MINIMIZE this (or Maximize their own).
            // Let's simplified Minimax:
            // Score = Eval(MyMove) - Max(Eval(OpponentMove))
            
            const opponent = turn === 'b' ? 'w' : 'b';
            const oppCandidates = getCandidateMoves(res.newBoard, opponent, board);
            
            let maxOppScore = -Infinity;
            // Limit opponent candidates for performance
            const limitedOppCandidates = oppCandidates.slice(0, 5); 
            
            if (limitedOppCandidates.length === 0) {
                // Opponent has no moves? Huge advantage or game over.
                maxOppScore = -1000; 
            } else {
                for (const oppMove of limitedOppCandidates) {
                    const resOpp = tryMakeMove(res.newBoard, oppMove.r, oppMove.c, opponent, board); // History is now current board
                    if (resOpp.success && resOpp.newBoard) {
                        // Evaluate from MY perspective (Turn)
                        // But evaluateBoard returns score for 'turn'.
                        // We want score for 'turn' - score for 'opponent'
                        // Actually evaluateBoard(newBoard, turn) gives score relative to 'turn'.
                        // But after opponent moves, we evaluate board state.
                        const s = evaluateBoard(resOpp.newBoard, turn, res.captured, resOpp.captured);
                        if (s > maxOppScore) maxOppScore = s; // Opponent picks their best board state (which is bad for me?)
                        // Wait. Minimax:
                        // Value = Max_m ( Min_o ( Eval(State_mo) ) )
                        // Here we are inside the loop for 'm'. We want to find Min_o ( Eval ).
                        // The 's' above is calculated from 'turn' perspective.
                        // Opponent wants to Minimize 's'.
                        // So we find the MINIMUM score the opponent can force me into.
                        // Wait, maxOppScore variable name is confusing.
                        // Let's call it bestResponseScore.
                        // Opponent chooses move to Minimize evaluateBoard(..., turn).
                    }
                }
            }
            // Actually, let's fix the logic:
            // I make a move. Board state S1.
            // Opponent makes a move. Board state S2.
            // Value of S1 = Min ( Evaluate(S2, turn) ) over all opponent moves.
            // Because opponent tries to minimize my advantage.
            
            let minScoreAfterOpponent = Infinity;
            if (limitedOppCandidates.length === 0) {
                 minScoreAfterOpponent = evaluateBoard(res.newBoard, turn, res.captured, 0);
            } else {
                for (const oppMove of limitedOppCandidates) {
                     const resOpp = tryMakeMove(res.newBoard, oppMove.r, oppMove.c, opponent, board);
                     if (resOpp.success && resOpp.newBoard) {
                         const s = evaluateBoard(resOpp.newBoard, turn, res.captured, resOpp.captured);
                         if (s < minScoreAfterOpponent) minScoreAfterOpponent = s;
                     }
                }
            }
            score = minScoreAfterOpponent === Infinity ? -1000 : minScoreAfterOpponent;
        }

        // Add some noise to break ties
        score += Math.random() * 0.5;

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
};
