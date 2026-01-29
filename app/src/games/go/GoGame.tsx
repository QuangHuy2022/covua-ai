import React, { useState, useEffect } from 'react';
import { RefreshCw, RotateCcw, SkipForward, Users, Cpu, Copy, Check } from 'lucide-react';
import { type Stone, type Board, BOARD_SIZE, tryMakeMove } from './GoLogic';
import { getBestMove, type Difficulty } from './GoAI';
import PeerConnector from '../../online/PeerConnector';

interface GameState {
    board: Board;
    turn: Stone;
    capturedBlack: number;
    capturedWhite: number;
    passes: number;
}

const GoGame: React.FC = () => {
  const [board, setBoard] = useState<Board>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
  );
  const [turn, setTurn] = useState<Stone>('b');
  const [capturedBlack, setCapturedBlack] = useState(0);
  const [capturedWhite, setCapturedWhite] = useState(0);
  const [history, setHistory] = useState<GameState[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [lastMove, setLastMove] = useState<{r: number, c: number} | null>(null);

  // New State for Game Mode
  const [gameMode, setGameMode] = useState<'pvp' | 'pvc' | 'online'>('pvc');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medium');
  const [showSetup, setShowSetup] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [connector] = useState(new PeerConnector());
  const [myId, setMyId] = useState<string>('');
  const [remoteId, setRemoteId] = useState<string>('');
  const [myColor, setMyColor] = useState<Stone>('b');
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rematchState, setRematchState] = useState<'idle' | 'sent' | 'received'>('idle');
  const [passes, setPasses] = useState(0);

  // Refs for stable access in callbacks
  const boardRef = React.useRef(board);
  const turnRef = React.useRef(turn);
  const historyRef = React.useRef(history);
  const myColorRef = React.useRef(myColor);
  const gameModeRef = React.useRef(gameMode);
  const capturedBlackRef = React.useRef(capturedBlack);
  const capturedWhiteRef = React.useRef(capturedWhite);
  const rematchStateRef = React.useRef(rematchState);
  const passesRef = React.useRef(passes);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { turnRef.current = turn; }, [turn]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { myColorRef.current = myColor; }, [myColor]);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);
  useEffect(() => { capturedBlackRef.current = capturedBlack; }, [capturedBlack]);
  useEffect(() => { capturedWhiteRef.current = capturedWhite; }, [capturedWhite]);
  useEffect(() => { rematchStateRef.current = rematchState; }, [rematchState]);
  useEffect(() => { passesRef.current = passes; }, [passes]);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (myId) {
      navigator.clipboard.writeText(myId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    // Cleanup peer connection on unmount
    return () => {
      connector.destroy();
    };
  }, []);

  useEffect(() => {
    connector.onConnectionOpen(() => {
      setConnected(true);
      if (myColorRef.current === 'b') { 
          connector.send({ type: 'start' });
      }
    });

    connector.onData((payload: any) => {
        if (payload?.type === 'move') {
            const { r, c } = payload.move;
            
            // If sender provided the full board state (Robust Sync), use it directly
            if (payload.board) {
                 executeMove(payload.board, payload.captured, {r, c}, false);
            } else {
                // Fallback: Calculate locally (Legacy or minimal payload)
                const currentBoard = boardRef.current;
                const currentTurn = turnRef.current;
                const currentHistory = historyRef.current;
                
                const prevBoard = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1].board : undefined;
                const result = tryMakeMove(currentBoard, r, c, currentTurn, prevBoard);
                
                if (result.success && result.newBoard) {
                    executeMove(result.newBoard, result.captured, {r, c}, false);
                }
            }
        } else if (payload?.type === 'pass') {
            passTurn(false);
            if (payload.nextTurn) {
                setTurn(payload.nextTurn);
                turnRef.current = payload.nextTurn;
            }
        } else if (payload?.type === 'start') {
            setConnected(true);
            setGameMode('online');
            setShowSetup(false);
        } else if (payload?.type === 'undo') {
            if (historyRef.current.length > 0) {
                const lastState = historyRef.current[historyRef.current.length - 1];
                setBoard(lastState.board);
                setTurn(lastState.turn);
                setCapturedBlack(lastState.capturedBlack);
                setCapturedWhite(lastState.capturedWhite);
                setHistory(prev => prev.slice(0, -1));
                setLastMove(null);
            }
        }
    });
  }, [connector]); // Only run once on mount (or when connector changes)

  // AI Turn Effect
  useEffect(() => {
    // AI plays White (Second)
    if (gameMode === 'pvc' && turn === 'w' && !gameOver && !showSetup) {
        setIsAiThinking(true);
        const timer = setTimeout(() => {
            try {
                // Pass previous board for Ko check
                const prevBoard = history.length > 0 ? history[history.length - 1].board : undefined;
                // Clone board for AI safety
                const boardCopy = board.map(row => [...row]);
                const bestMove = getBestMove(boardCopy, 'w', aiDifficulty, prevBoard);
                
                if (bestMove) {
                    const result = tryMakeMove(board, bestMove.r, bestMove.c, 'w', prevBoard);
                    if (result.success && result.newBoard) {
                        executeMove(result.newBoard, result.captured, bestMove);
                    } else {
                        // AI failed to find valid move? Pass.
                        passTurn();
                    }
                } else {
                    // Pass
                    passTurn();
                }
            } catch (error: unknown) {
                console.error("AI Error:", error);
                passTurn();
            }
            setIsAiThinking(false);
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [board, turn, gameMode, aiDifficulty, showSetup, gameOver]);

  const executeMove = (newBoard: Board, captured: number, moveLoc: {r: number, c: number}, sendToPeer = true) => {
    // Use refs for stable state access
    const currentBoard = boardRef.current;
    const currentTurn = turnRef.current;
    const currentCapturedBlack = capturedBlackRef.current;
    const currentCapturedWhite = capturedWhiteRef.current;
    const currentPasses = passesRef.current;

    // Save history
    setHistory(prev => [...prev, {
        board: currentBoard.map(row => [...row]),
        turn: currentTurn,
        capturedBlack: currentCapturedBlack,
        capturedWhite: currentCapturedWhite,
        passes: currentPasses
    }]);

    // Update State
    setBoard(newBoard);
    setLastMove(moveLoc);
    setPasses(0); // Reset passes on valid move
    
    if (currentTurn === 'b') {
        setCapturedWhite(prev => prev + captured);
        setTurn('w');
    } else {
        setCapturedBlack(prev => prev + captured);
        setTurn('b');
    }

    if (sendToPeer && gameModeRef.current === 'online') {
        // Send full board state for robust sync
        connector.send({ type: 'move', move: moveLoc, board: newBoard, captured });
    }
  };

  const handleIntersectionClick = (r: number, c: number) => {
    if (board[r][c] || gameOver || showSetup || (gameMode === 'pvc' && turn === 'w')) return;
    if (gameMode === 'online' && turn !== myColor) return;

    const prevBoard = history.length > 0 ? history[history.length - 1].board : undefined;
    const result = tryMakeMove(board, r, c, turn, prevBoard);

    if (!result.success) {
        if (result.error === 'Ko') alert("Lỗi Ko: Không được lặp lại trạng thái bàn cờ cũ ngay lập tức!");
        return;
    }

    if (result.newBoard) {
        executeMove(result.newBoard, result.captured, {r, c});
    }
  };

  const passTurn = (sendToPeer = true) => {
      if (gameOver) return;

      // Save history
      const currentTurn = turnRef.current;
      const currentPasses = passesRef.current;
      
      setHistory(prev => [...prev, {
        board: boardRef.current.map(row => [...row]),
        turn: currentTurn,
        capturedBlack: capturedBlackRef.current,
        capturedWhite: capturedWhiteRef.current,
        passes: currentPasses
      }]);

      const newPasses = currentPasses + 1;
      setPasses(newPasses);

      if (newPasses >= 2) {
          setGameOver(true);
      } else {
          setTurn(prev => prev === 'b' ? 'w' : 'b');
      }
      
      setLastMove(null);

      if (sendToPeer && gameModeRef.current === 'online') {
          connector.send({ type: 'pass' });
      }
  };

  const startNewGame = (mode: 'pvp' | 'pvc' | 'online', difficulty?: Difficulty) => {
    setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)));
    setTurn('b');
    setCapturedBlack(0);
    setCapturedWhite(0);
    setHistory([]);
    setGameOver(false);
    setLastMove(null);
    setGameMode(mode);
    setRematchState('idle'); // Reset rematch state
    if (difficulty) setAiDifficulty(difficulty);
    // Always hide setup when starting a new game
    setShowSetup(false);
  };

  const createOnlineRoom = () => {
    startNewGame('online');
    connector.create().then((id) => {
        setMyId(id);
        setMyColor('w'); // Wait, default for creator should be Black (first) or White?
        // In Go, Black goes first. Usually host is Black.
        // But in `createOnlineRoom` original code it set `setMyColor('w')`?
        // Let's check original code. 
        // Original: setMyColor('w');
        // Original join: setMyColor('b');
        // This means Host is White (Second), Joiner is Black (First)?
        // That's unusual but I will respect existing logic unless it's wrong.
        // In Xiangqi, host was Red (First).
        // Let's check logic:
        // Joiner sends 'start'. Host waits.
        // If Joiner is Black (First), Joiner moves first.
        // Seems consistent.
        setShowSetup(false);
    }).catch((err: unknown) => console.error(err));
  };

  const joinOnlineRoom = () => {
    if (!remoteId) return;
    
    // Validate ID format (6 alphanumeric characters)
    if (!/^[A-Z0-9]{6}$/.test(remoteId.toUpperCase())) {
      alert("Mã phòng phải gồm 6 ký tự (chữ hoặc số)!");
      return;
    }

    if (remoteId === connector.id) {
      alert("Không thể tự kết nối với chính mình!");
      return;
    }
    startNewGame('online');
    connector.connect(remoteId);
    setMyColor('b');
    setShowSetup(false);
  };

  const resetGame = () => {
    setShowSetup(true);
    setRematchState('idle');
  };

  const handleRematchRequest = () => {
      connector.send({ type: 'rematch_request' });
      setRematchState('sent');
  };

  const handleRematchAccept = () => {
      connector.send({ type: 'rematch_accept' });
      startNewGame('online');
      setMyColor(myColorRef.current);
      setConnected(true);
      setRematchState('idle');
  };

  const handleRematchDecline = () => {
      connector.send({ type: 'rematch_decline' });
      setRematchState('idle');
      // Maybe close modal?
  };

  const undoMove = () => {
    if (history.length === 0 || gameOver) return;
    
    if (gameMode === 'online') {
        const lastState = history[history.length - 1];
        setBoard(lastState.board);
        setTurn(lastState.turn);
        setCapturedBlack(lastState.capturedBlack);
        setCapturedWhite(lastState.capturedWhite);
        setHistory(prev => prev.slice(0, -1));
        setLastMove(null);
        connector.send({ type: 'undo' });
        return;
    }

    if (gameMode === 'pvc') {
        if (isAiThinking) return;
        if (history.length < 2) return;

        // Undo 2 states
        // Current State -> History[last] -> History[last-1]
        // Actually history stores state BEFORE move.
        // So to undo 2 moves (AI + Player), we need to go back 2 steps in history array.
        // history[len-1] is state before AI move.
        // history[len-2] is state before Player move.
        
        const targetState = history[history.length - 2];
        setBoard(targetState.board);
        setTurn(targetState.turn);
        setCapturedBlack(targetState.capturedBlack);
        setCapturedWhite(targetState.capturedWhite);
        setHistory(prev => prev.slice(0, -2));
        setLastMove(null); // Lose last move info

    } else {
        const lastState = history[history.length - 1];
        setBoard(lastState.board);
        setTurn(lastState.turn);
        setCapturedBlack(lastState.capturedBlack);
        setCapturedWhite(lastState.capturedWhite);
        setHistory(prev => prev.slice(0, -1));
        setLastMove(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto relative min-h-[600px]">
      
      {/* Setup Modal */}
      {showSetup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-md rounded-xl animate-fade-in">
          <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full text-center">
            <h2 className="text-3xl font-bold text-white mb-8">Cài đặt ván đấu</h2>
            
            <div className="space-y-4">
              <button 
                onClick={() => startNewGame('pvp')}
                className="w-full p-4 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-4 transition-all hover:scale-105 border border-slate-600 hover:border-indigo-500 group"
              >
                <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Users size={24} />
                </div>
                <div className="text-left">
                  <div className="font-bold text-white text-lg">Người vs Người</div>
                  <div className="text-slate-400 text-sm">Chơi cùng bạn bè trên cùng thiết bị</div>
                </div>
              </button>

              <div className="space-y-2">
                 <div className="text-left text-slate-400 text-sm font-semibold uppercase tracking-wider ml-1">Chơi với Máy</div>
                 {['easy', 'medium', 'hard'].map((level) => (
                   <button 
                    key={level}
                    onClick={() => startNewGame('pvc', level as Difficulty)}
                    className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-4 transition-all hover:scale-105 border border-slate-600 hover:border-emerald-500 group"
                  >
                    <div className={`p-2 rounded-lg transition-colors ${
                      level === 'easy' ? 'bg-green-500/20 text-green-400 group-hover:bg-green-500 group-hover:text-white' :
                      level === 'medium' ? 'bg-yellow-500/20 text-yellow-400 group-hover:bg-yellow-500 group-hover:text-white' :
                      'bg-red-500/20 text-red-400 group-hover:bg-red-500 group-hover:text-white'
                    }`}>
                      <Cpu size={20} />
                    </div>
                    <div className="text-left grow">
                      <div className="font-bold text-white capitalize">
                        {level === 'easy' ? 'Dễ' : level === 'medium' ? 'Trung bình' : 'Khó'}
                      </div>
                    </div>
                  </button>
                 ))}
              </div>
              <div className="space-y-3">
                <div className="text-left text-slate-400 text-sm font-semibold uppercase tracking-wider ml-1">Chơi Online</div>
                <div className="grid grid-cols-1 gap-2">
                  {!myId ? (
                    <button
                onClick={() => { createOnlineRoom(); }}
                className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-4 transition-all hover:scale-105 border border-slate-600 hover:border-cyan-500 group"
              >
                      <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                        <Users size={20} />
                      </div>
                      <div className="text-left grow">
                        <div className="font-bold text-white">Tạo phòng</div>
                      </div>
                    </button>
                  ) : (
                    <div className="w-full p-3 bg-slate-700 rounded-xl flex items-center gap-4 border border-cyan-500/50 relative overflow-hidden">
                       <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none"></div>
                       <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                        <Users size={20} />
                      </div>
                      <div className="text-left grow min-w-0">
                        <div className="font-bold text-white text-sm">ID Phòng của bạn</div>
                        <div className="text-cyan-300 font-mono text-xl font-bold tracking-wider">{myId}</div>
                      </div>
                      <button
                        onClick={handleCopyId}
                        className="p-2 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors"
                        title="Sao chép ID"
                      >
                        {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                      </button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={remoteId}
                      onChange={(e) => setRemoteId(e.target.value)}
                      placeholder="Nhập ID phòng"
                      className="flex-1 p-3 bg-slate-700 rounded-lg border border-slate-600 text-white placeholder-slate-400"
                    />
                    <button
                      onClick={() => { joinOnlineRoom(); }}
                      className="px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-bold"
                    >
                      Vào phòng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Info Header */}
      <div className="flex justify-between items-center w-full bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
        <div className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold transition-all ${turn === 'b' ? 'bg-slate-900 text-white ring-2 ring-slate-500' : 'bg-slate-700 text-slate-400'}`}>
          <div className="w-3 h-3 rounded-full bg-black border border-slate-600"></div>
          {gameMode === 'pvc' ? 'Bạn (Đen)' : gameMode === 'online' ? (myColor === 'b' ? 'Bạn (Đen)' : 'Đối thủ (Đen)') : 'Đen'}
        </div>
        
        <div className="flex flex-col items-center">
            <div className="text-2xl font-black text-slate-200">VS</div>
            <div className="text-xs text-slate-500 font-mono mt-1">Tù nhân: {capturedBlack} (Đ) - {capturedWhite} (T)</div>
            {gameMode === 'online' && (
              <div className={`text-xs mt-1 font-bold ${connected ? 'text-emerald-500' : 'text-yellow-500'}`}>
                {connected ? 'ĐÃ KẾT NỐI' : 'CHỜ KẾT NỐI...'}
              </div>
            )}
        </div>

        <div className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold transition-all ${turn === 'w' ? 'bg-slate-100 text-slate-900 ring-2 ring-slate-300' : 'bg-slate-700 text-slate-400'}`}>
          {gameMode === 'pvc' && isAiThinking ? (
             <div className="flex items-center gap-2">
                 <span className="animate-pulse">Đang nghĩ...</span>
             </div>
          ) : (
             <span>{
                gameMode === 'pvc' 
                  ? `Máy (${aiDifficulty === 'easy' ? 'Dễ' : aiDifficulty === 'medium' ? 'Vừa' : 'Khó'})` 
                  : gameMode === 'online'
                    ? (myColor === 'w' ? 'Bạn (Trắng)' : 'Đối thủ (Trắng)')
                    : 'Trắng'
             }</span>
          )}
          <div className="w-3 h-3 rounded-full bg-white border border-slate-300"></div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative p-1 sm:p-2 rounded-xl bg-slate-900 shadow-2xl border border-slate-800">
        <div className="relative bg-[#1e293b] p-4 sm:p-8 rounded border border-slate-700 shadow-inner">
            <div className="grid relative z-10" style={{ 
                gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                width: 'fit-content',
                gap: 0
            }}>
            {Array.from({ length: BOARD_SIZE }).map((_, rIndex) => {
                const r = myColor === 'w' ? BOARD_SIZE - 1 - rIndex : rIndex;
                const row = board[r];
                return Array.from({ length: BOARD_SIZE }).map((_, cIndex) => {
                const c = myColor === 'w' ? BOARD_SIZE - 1 - cIndex : cIndex;
                const stone = row[c];
                return (
                <div 
                    key={`${r}-${c}`}
                    className="w-7 h-7 sm:w-10 sm:h-10 relative flex items-center justify-center cursor-pointer"
                    onClick={() => handleIntersectionClick(r, c)}
                >
                    {/* Grid Lines */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className={`absolute top-1/2 w-full h-0.5 bg-slate-600 ${c===0 ? 'left-1/2' : ''} ${c===BOARD_SIZE-1 ? 'right-1/2 w-1/2' : ''}`} />
                        <div className={`absolute left-1/2 h-full w-0.5 bg-slate-600 ${r===0 ? 'top-1/2' : ''} ${r===BOARD_SIZE-1 ? 'bottom-1/2 h-1/2' : ''}`} />
                        
                        {/* Star points (Hoshi) - Adjusted for 13x13 (3, 9, 6 center) */}
                        {((r === 3 || r === 9 || r === 6) && (c === 3 || c === 9 || c === 6)) && (
                            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-[0_0_5px_rgba(255,255,255,0.5)]"></div>
                        )}
                    </div>

                    {/* Last Move Highlight */}
                    {lastMove?.r === r && lastMove?.c === c && (
                        <div className="absolute w-full h-full rounded-full border-2 border-red-500 animate-ping opacity-75 z-20"></div>
                    )}

                    {/* Hover effect for valid move */}
                    {!stone && !gameOver && !(gameMode === 'pvc' && turn === 'w') && (
                        <div className={`absolute w-5 h-5 rounded-full opacity-0 hover:opacity-40 transform transition-all duration-200 hover:scale-110
                            ${turn === 'b' ? 'bg-black shadow-[0_0_10px_black]' : 'bg-white shadow-[0_0_10px_white]'}
                        `} />
                    )}

                    {/* Stone */}
                    {stone && (
                        <div className={`
                            relative z-10 w-[90%] h-[90%] rounded-full shadow-lg transform transition-all duration-300
                            ${stone === 'b' 
                                ? 'bg-black border border-slate-700 shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.1)]' 
                                : 'bg-white border border-slate-300 shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.2),0_0_10px_rgba(255,255,255,0.3)]'}
                        `}>
                            {/* Reflection */}
                            <div className="absolute top-[15%] left-[15%] w-[25%] h-[25%] rounded-full bg-white/20 blur-[1px]"></div>
                        </div>
                    )}
                </div>
                );
                });
            })}
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
          <button
            onClick={undoMove}
            disabled={history.length === 0 || gameOver || (gameMode === 'pvc' && isAiThinking)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
          >
            <RotateCcw size={20} />
            Đi lại
          </button>
          <button
            onClick={() => passTurn()}
            disabled={gameOver || (gameMode === 'pvc' && isAiThinking)}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:shadow-orange-500/30"
          >
            <SkipForward size={20} />
            Bỏ lượt
          </button>
          <button
            onClick={resetGame}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:shadow-indigo-500/30"
          >
            <RefreshCw size={20} />
            Ván mới
          </button>
      </div>

      {gameMode === 'online' && myId && (
        <div className="mt-3 p-3 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-between w-full max-w-md">
          <div>
            <div className="text-slate-300 text-sm">ID Phòng</div>
            <div className="text-cyan-300 font-mono text-lg font-bold tracking-wider">{myId}</div>
          </div>
          <button
            onClick={handleCopyId}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Sao chép ID"
          >
            {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
          </button>
        </div>
      )}

      {gameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl text-center border border-slate-700 transform scale-100 animate-in zoom-in-95 duration-300">
                <h2 className="text-4xl font-bold text-white mb-6 bg-linear-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    {capturedBlack > capturedWhite ? 'Đen thắng!' : capturedWhite > capturedBlack ? 'Trắng thắng!' : 'Hòa!'}
                </h2>
                <div className="text-slate-300 mb-6">
                    <div>Đen bắt: {capturedBlack}</div>
                    <div>Trắng bắt: {capturedWhite}</div>
                </div>
                <div className="flex gap-4 justify-center">
                    {gameMode === 'online' ? (
                        rematchState === 'received' ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleRematchAccept}
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                                >
                                    Đồng ý tái đấu
                                </button>
                                <button
                                    onClick={handleRematchDecline}
                                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                                >
                                    Từ chối
                                </button>
                            </div>
                        ) : rematchState === 'sent' ? (
                            <button
                                disabled
                                className="px-8 py-3 bg-slate-600 text-slate-300 rounded-xl font-bold transition-all cursor-not-allowed"
                            >
                                Đang chờ đối thủ...
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleRematchRequest}
                                    className="px-8 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                                >
                                    Tái đấu
                                </button>
                                <button
                                    onClick={resetGame}
                                    className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                                >
                                    Thoát
                                </button>
                            </div>
                        )
                    ) : (
                        <button
                            onClick={resetGame}
                            className="px-8 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            Chơi lại
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default GoGame;
