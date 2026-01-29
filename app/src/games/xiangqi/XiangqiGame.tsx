import React, { useState, useEffect } from 'react';
import { RefreshCw, RotateCcw, Cpu, Users, Copy, Check } from 'lucide-react';
import { initialBoard, getValidMovesForPiece, type Piece, type Position, type Move, type PieceColor, type PieceType } from './XiangqiLogic';
import { getBestMove, type Difficulty } from './XiangqiAI';
import PeerConnector from '../../online/PeerConnector';

const getPieceLabel = (type: PieceType, color: PieceColor) => {
  if (color === 'r') {
    switch (type) {
      case 'k': return '帥'; // Shuài
      case 'a': return '仕'; // Shì
      case 'b': return '相'; // Xiàng
      case 'n': return '傌'; // Mà
      case 'r': return '俥'; // Jū
      case 'c': return '炮'; // Pào
      case 'p': return '兵'; // Bīng
    }
  } else {
    switch (type) {
      case 'k': return '將'; // Jiàng
      case 'a': return '士'; // Shì
      case 'b': return '象'; // Xiàng
      case 'n': return '馬'; // Mǎ
      case 'r': return '車'; // Jū
      case 'c': return '砲'; // Pào
      case 'p': return '卒'; // Zú
    }
  }
};

const XiangqiGame: React.FC = () => {
  const [board, setBoard] = useState<(Piece | null)[][]>(initialBoard);
  const [turn, setTurn] = useState<PieceColor>('r');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);

  // New State for Game Mode
  const [gameMode, setGameMode] = useState<'pvp' | 'pvc' | 'online'>('pvc');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medium');
  const [showSetup, setShowSetup] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [connector] = useState(new PeerConnector());
  const [myId, setMyId] = useState<string>('');
  const [remoteId, setRemoteId] = useState<string>('');
  const [myColor, setMyColor] = useState<PieceColor>('r');
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  // Refs for stable access in callbacks
  const boardRef = React.useRef(board);
  const turnRef = React.useRef(turn);
  const moveHistoryRef = React.useRef(moveHistory);
  const myColorRef = React.useRef(myColor);
  const gameModeRef = React.useRef(gameMode);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { turnRef.current = turn; }, [turn]);
  useEffect(() => { moveHistoryRef.current = moveHistory; }, [moveHistory]);
  useEffect(() => { myColorRef.current = myColor; }, [myColor]);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);

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
      if (myColorRef.current === 'b') { // Only guest sends start
          connector.send({ type: 'start' });
      }
    });

    connector.onData((payload: any) => {
      if (payload?.type === 'move') {
        try {
          const move = payload.move;
          const currentBoard = boardRef.current;
          // We need to re-evaluate captured based on our local board state to ensure consistency
          const capturedPiece = currentBoard[move.to.row][move.to.col];
          const localMove: Move = {
              from: move.from,
              to: move.to,
              captured: capturedPiece
          };
          executeMove(localMove, false); // false = don't send back
        } catch {}
      } else if (payload?.type === 'start') {
        setConnected(true);
        setGameMode('online');
        setShowSetup(false);
      } else if (payload?.type === 'undo') {
        if (moveHistoryRef.current.length > 0) {
           const last = moveHistoryRef.current[moveHistoryRef.current.length - 1];
           const newBoard = boardRef.current.map(row => [...row]);
           
           newBoard[last.from.row][last.from.col] = newBoard[last.to.row][last.to.col];
           newBoard[last.to.row][last.to.col] = last.captured || null;
           
           setBoard(newBoard);
           setMoveHistory(prev => prev.slice(0, -1));
           setLastMove(moveHistoryRef.current.length > 1 ? moveHistoryRef.current[moveHistoryRef.current.length - 2] : null);
           setTurn(prev => prev === 'r' ? 'b' : 'r');
           setSelectedPos(null);
           setValidMoves([]);
        }
      }
    });
  }, [connector]);

  // AI Turn Effect
  useEffect(() => {
    // Assuming AI plays Black ('b')
    if (gameMode === 'pvc' && turn === 'b' && !winner && !showSetup) {
        setIsAiThinking(true);
        const timer = setTimeout(() => {
            try {
                // Clone board to avoid any side effects
                const boardCopy = board.map(row => [...row]);
                const bestMove = getBestMove(boardCopy, 'b', aiDifficulty);
                if (bestMove) {
                    executeMove(bestMove);
                } else {
                    // No moves available for AI? Checkmate or Stalemate logic should handle this,
                    // but for now let's assume if no moves, AI loses or passes.
                    // In Xiangqi, no legal moves is a loss.
                    setWinner('Đỏ thắng!');
                }
            } catch (error: unknown) {
                console.error("AI Error:", error);
                // Fallback: If AI fails, pass turn back to player so game doesn't freeze
                setTurn('r');
            }
            setIsAiThinking(false);
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [board, turn, gameMode, aiDifficulty, showSetup, winner]);

  const executeMove = (move: Move, sendToPeer = true) => {
    const newBoard = board.map(row => [...row]);
    const movingPiece = newBoard[move.from.row][move.from.col];
    // const targetPiece = newBoard[move.to.row][move.to.col]; // Already in move.captured if generated by AI, but for click handler we need to check

    if (!movingPiece) return;

    newBoard[move.to.row][move.to.col] = movingPiece;
    newBoard[move.from.row][move.from.col] = null;

    setMoveHistory(prev => [...prev, move]);
    setLastMove(move);
    setBoard(newBoard);

    if (sendToPeer && gameMode === 'online') {
        // Sent in setTurn callback to ensure nextTurn is correct
    }

    // Check win (capture king)
    if (move.captured?.type === 'k') {
        const currentTurn = turnRef.current;
        setWinner(currentTurn === 'r' ? 'Đỏ thắng!' : 'Đen thắng!');
    } else {
        // Ensure turn switches correctly
        let nextTurn: PieceColor = 'r';
        setTurn(prev => {
            const next = prev === 'r' ? 'b' : 'r';
            nextTurn = next;
            turnRef.current = next; // Update ref immediately for safety
            return next;
        });
        
        if (sendToPeer && gameMode === 'online') {
            // Send nextTurn to ensure sync
             connector.send({ type: 'move', move, nextTurn: nextTurn });
        }
    }

    setSelectedPos(null);
    setValidMoves([]);
  };

  const handleSquareClick = (r: number, c: number) => {
    if (winner || showSetup || (gameMode === 'pvc' && turn === 'b')) return;
    if (gameMode === 'online' && turn !== myColor) return;

    const clickedPiece = board[r][c];
    const isSameColor = clickedPiece?.color === turn;

    if (selectedPos) {
      if (selectedPos.row === r && selectedPos.col === c) {
        setSelectedPos(null);
        setValidMoves([]);
        return;
      }

      const isMove = validMoves.some(m => m.row === r && m.col === c);
      if (isMove) {
        // Construct move object
        const targetPiece = board[r][c];
        const move: Move = {
            from: selectedPos,
            to: { row: r, col: c },
            captured: targetPiece
        };
        executeMove(move);
      } else if (isSameColor) {
        setSelectedPos({ row: r, col: c });
        if (clickedPiece) {
             setValidMoves(getValidMovesForPiece(clickedPiece, r, c, board));
        }
      } else {
        setSelectedPos(null);
        setValidMoves([]);
      }
    } else if (isSameColor) {
      setSelectedPos({ row: r, col: c });
      if (clickedPiece) {
        setValidMoves(getValidMovesForPiece(clickedPiece, r, c, board));
      }
    }
  };

  const startNewGame = (mode: 'pvp' | 'pvc' | 'online', difficulty?: Difficulty) => {
    setBoard(initialBoard);
    setTurn('r');
    setWinner(null);
    setSelectedPos(null);
    setValidMoves([]);
    setLastMove(null);
    setMoveHistory([]);
    setGameMode(mode);
    if (difficulty) setAiDifficulty(difficulty);
    setShowSetup(mode === 'online');
  };

  const createOnlineRoom = () => {
    startNewGame('online');
    connector.create().then((id) => {
        setMyId(id);
    }).catch((err: unknown) => console.error(err));
    setMyColor('r');
    setShowSetup(false);
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
    setMyColor('b');
    startNewGame('online');
    connector.connect(remoteId);
    setShowSetup(false);
  };

  const resetGame = () => {
    setShowSetup(true);
  };

  const undoMove = () => {
    if (moveHistory.length === 0 || winner) return;

    if (gameMode === 'online') return; // Disable undo in online mode
    
    // In PvC, undo 2 moves (AI and Player)
    if (gameMode === 'pvc') {
        if (moveHistory.length < 2) return; // Can't undo if AI hasn't moved yet or only 1 move made? (Actually AI is Black, Player Red. So if Player moved (1), AI moved (2). Undo 2.)
        // If it's Player's turn (Red), it means AI just moved. So undo 2.
        // If it's AI's turn (Black), it means Player just moved. But AI is thinking? 
        // We block undo while AI is thinking.
        if (isAiThinking) return;

        // Undo 2 moves
        let currentHistory = [...moveHistory];
        let currentBoard = board.map(row => [...row]);
        
        // Undo AI move
        const aiMove = currentHistory.pop();
        if (aiMove) {
            currentBoard[aiMove.from.row][aiMove.from.col] = currentBoard[aiMove.to.row][aiMove.to.col];
            currentBoard[aiMove.to.row][aiMove.to.col] = aiMove.captured || null;
        }

        // Undo Player move
        const playerMove = currentHistory.pop();
        if (playerMove) {
            currentBoard[playerMove.from.row][playerMove.from.col] = currentBoard[playerMove.to.row][playerMove.to.col];
            currentBoard[playerMove.to.row][playerMove.to.col] = playerMove.captured || null;
        }

        setBoard(currentBoard);
        setMoveHistory(currentHistory);
        setLastMove(currentHistory.length > 0 ? currentHistory[currentHistory.length - 1] : null);
        // Turn remains Red
        setTurn('r');
        setSelectedPos(null);
        setValidMoves([]);

    } else {
        // PvP: Undo 1 move
        const last = moveHistory[moveHistory.length - 1];
        const newBoard = board.map(row => [...row]);
        
        // Revert move
        newBoard[last.from.row][last.from.col] = newBoard[last.to.row][last.to.col];
        newBoard[last.to.row][last.to.col] = last.captured || null;
        
        setBoard(newBoard);
        setMoveHistory(prev => prev.slice(0, -1));
        setLastMove(moveHistory.length > 1 ? moveHistory[moveHistory.length - 2] : null);
        setTurn(prev => prev === 'r' ? 'b' : 'r');
        setSelectedPos(null);
        setValidMoves([]);
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

      {/* Game Header */}
      <div className="flex justify-between items-center w-full bg-slate-800/50 p-4 rounded-xl backdrop-blur-sm border border-slate-700/50">
        <div className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold transition-all duration-300 ${turn === 'r' ? 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-slate-500'}`}>
          <div className={`w-3 h-3 rounded-full ${turn === 'r' ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
          {gameMode === 'pvc' ? 'BẠN (ĐỎ)' : gameMode === 'online' ? (myColor === 'r' ? 'BẠN (ĐỎ)' : 'ĐỐI THỦ (ĐỎ)') : 'QUÂN ĐỎ'}
        </div>
        
        <div className="flex flex-col items-center">
            <div className="text-2xl font-black text-slate-700 font-mono">VS</div>
            {gameMode === 'online' && (
              <div className="flex flex-col items-center">
                  <div className={`text-xs mt-1 font-bold ${connected ? 'text-emerald-500' : 'text-yellow-500'}`}>
                    {connected ? 'ĐÃ KẾT NỐI' : 'CHỜ KẾT NỐI...'}
                  </div>
                  {myId && !connected && (
                      <div className="flex items-center gap-2 mt-1 bg-slate-200 px-2 py-1 rounded text-xs font-mono text-slate-700 border border-slate-300">
                          ID: {myId}
                          <button onClick={handleCopyId} title="Sao chép">
                              {copied ? <Check size={12} className="text-emerald-500"/> : <Copy size={12}/>}
                          </button>
                      </div>
                  )}
              </div>
            )}
        </div>
        
        <div className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold transition-all duration-300 ${turn === 'b' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'text-slate-500'}`}>
           {gameMode === 'pvc' && isAiThinking ? (
             <div className="flex items-center gap-2">
                 <span className="animate-pulse">ĐANG NGHĨ...</span>
             </div>
           ) : (
             <span>{
               gameMode === 'pvc'
                 ? `MÁY (${aiDifficulty === 'easy' ? 'DỄ' : aiDifficulty === 'medium' ? 'VỪA' : 'KHÓ'})`
                 : gameMode === 'online'
                   ? (myColor === 'b' ? 'BẠN (ĐEN)' : 'ĐỐI THỦ (ĐEN)')
                   : 'QUÂN ĐEN'
             }</span>
           )}
           <div className={`w-3 h-3 rounded-full ${turn === 'b' ? 'bg-cyan-500 animate-pulse' : 'bg-slate-600'}`} />
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative p-1 sm:p-2 rounded-xl bg-slate-900 shadow-2xl border border-slate-800">
        {gameMode === 'online' && !connected && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-xl">
                <div className="text-center p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
                    <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h3 className="text-xl font-bold text-white mb-2">Đang chờ đối thủ...</h3>
                    <div className="flex items-center justify-center gap-3 bg-slate-900 p-3 rounded-lg border border-slate-700">
                        <span className="text-slate-400 text-sm">Mã phòng:</span>
                        <span className="text-cyan-400 font-mono font-bold text-xl tracking-wider">{myId}</span>
                        <button 
                            onClick={handleCopyId}
                            className="p-1.5 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors"
                        >
                            {copied ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}
                        </button>
                    </div>
                    <p className="text-slate-500 text-sm mt-4">Chia sẻ mã này cho bạn bè để bắt đầu</p>
                </div>
            </div>
        )}
        {/* Board Background & Grid */}
        <div className="relative bg-[#1e293b] p-8 rounded border border-slate-700 shadow-inner select-none">
            
            {/* SVG Board Rendering for crisp lines */}
            <svg viewBox="0 0 900 1000" className="absolute inset-0 w-full h-full pointer-events-none z-0 p-8">
                <defs>
                    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#334155" strokeWidth="2"/>
                    </pattern>
                </defs>
                
                {/* Border */}
                <rect x="50" y="50" width="800" height="900" fill="none" stroke="#475569" strokeWidth="4" />
                
                {/* Horizontal Lines */}
                {Array.from({ length: 10 }).map((_, i) => (
                    <line key={`h-${i}`} x1="50" y1={50 + i * 100} x2="850" y2={50 + i * 100} stroke="#475569" strokeWidth="2" />
                ))}

                {/* Vertical Lines (Split by river) */}
                {Array.from({ length: 9 }).map((_, i) => (
                    <React.Fragment key={`v-${i}`}>
                        <line x1={50 + i * 100} y1="50" x2={50 + i * 100} y2="450" stroke="#475569" strokeWidth="2" />
                        <line x1={50 + i * 100} y1="550" x2={50 + i * 100} y2="950" stroke="#475569" strokeWidth="2" />
                    </React.Fragment>
                ))}
                
                {/* Outer Vertical Lines connect across river */}
                <line x1="50" y1="450" x2="50" y2="550" stroke="#475569" strokeWidth="2" />
                <line x1="850" y1="450" x2="850" y2="550" stroke="#475569" strokeWidth="2" />

                {/* Palace Diagonals */}
                <line x1="350" y1="50" x2="550" y2="250" stroke="#475569" strokeWidth="2" />
                <line x1="550" y1="50" x2="350" y2="250" stroke="#475569" strokeWidth="2" />
                
                <line x1="350" y1="750" x2="550" y2="950" stroke="#475569" strokeWidth="2" />
                <line x1="550" y1="750" x2="350" y2="950" stroke="#475569" strokeWidth="2" />
                
                {/* River Text */}
                <text x="250" y="515" fill="#64748b" fontSize="40" fontFamily="serif" textAnchor="middle" dominantBaseline="middle">SỞ HÀ</text>
                <text x="650" y="515" fill="#64748b" fontSize="40" fontFamily="serif" textAnchor="middle" dominantBaseline="middle">HÁN GIỚI</text>
            </svg>

            {/* Pieces Grid */}
            <div className="grid grid-cols-9 gap-0 relative z-10" style={{ width: 'fit-content' }}>
            {Array.from({ length: 10 }).map((_, rIndex) => {
                const r = myColor === 'b' ? 9 - rIndex : rIndex;
                const row = board[r];
                return Array.from({ length: 9 }).map((_, cIndex) => {
                const c = myColor === 'b' ? 8 - cIndex : cIndex;
                const piece = row[c];
                const isSelected = selectedPos?.row === r && selectedPos?.col === c;
                const isValid = validMoves.some(m => m.row === r && m.col === c);
                const isLastMoveFrom = lastMove?.from.row === r && lastMove?.from.col === c;
                const isLastMoveTo = lastMove?.to.row === r && lastMove?.to.col === c;
                
                return (
                    <div 
                    key={`${r}-${c}`}
                    className="w-9 h-9 sm:w-14 sm:h-14 flex items-center justify-center relative cursor-pointer"
                    onClick={() => handleSquareClick(r, c)}
                    >
                        {/* Highlights */}
                        {(isLastMoveFrom || isLastMoveTo) && <div className="absolute inset-1 bg-yellow-500/20 rounded-full animate-pulse"></div>}
                        {isSelected && <div className="absolute inset-0 bg-white/20 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)]"></div>}
                        {isValid && (
                            <div className={`absolute w-4 h-4 rounded-full z-20 ${piece ? 'bg-red-500 ring-2 ring-white animate-bounce' : 'bg-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.6)]'}`}></div>
                        )}

                        {/* Piece */}
                        {piece && (
                            <div className={`
                                relative z-10 w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 
                                flex items-center justify-center shadow-lg font-bold text-lg sm:text-2xl select-none transition-transform hover:scale-110
                                ${piece.color === 'r' 
                                    ? 'bg-slate-900 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' 
                                    : 'bg-slate-900 border-cyan-500 text-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]'}
                            `}>
                                <div className="absolute inset-0 rounded-full bg-linear-to-br from-white/10 to-transparent pointer-events-none"></div>
                                {getPieceLabel(piece.type, piece.color)}
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
          disabled={moveHistory.length === 0 || (gameMode === 'pvc' && isAiThinking)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
        >
          <RotateCcw size={20} />
          Đi lại
        </button>
        <button
          onClick={resetGame}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:shadow-indigo-500/30"
        >
          <RefreshCw size={20} />
          Ván mới
        </button>
      </div>

      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl text-center border border-slate-700 transform scale-100 animate-in zoom-in-95 duration-300">
                <h2 className="text-4xl font-bold text-white mb-6 bg-linear-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    {winner}
                </h2>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={resetGame}
                        className="px-8 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        Chơi lại
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default XiangqiGame;
