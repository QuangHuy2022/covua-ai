import React, { useState, useEffect } from 'react';
import { Chess, type Square } from 'chess.js';
import { RefreshCw, RotateCcw, Cpu, Users, Copy, Check } from 'lucide-react';
import { getBestMove, type Difficulty } from './ChessAI';
import PeerConnector from '../../online/PeerConnector';

const Piece: React.FC<{ type: string; color: 'w' | 'b' }> = ({ type, color }) => {
  const isWhite = color === 'w';
  // Use SVG paths directly for better scaling and customization
  const pieces: Record<string, React.ReactNode> = {
    p: (
      <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-lg">
        <path
          d="M 22.5,9 C 26,9 28.5,10.5 28.5,14 C 28.5,16 27.5,17.5 26,18.5 L 26,25 L 30,25 C 30,28 30,30 30,30 L 15,30 C 15,30 15,28 15,25 L 19,25 L 19,18.5 C 17.5,17.5 16.5,16 16.5,14 C 16.5,10.5 19,9 22.5,9 z"
          className={isWhite ? "fill-[#f0d9b5] stroke-[#4b4847]" : "fill-[#4b4847] stroke-[#f0d9b5]"}
          strokeWidth="1.5"
        />
      </svg>
    ),
    n: (
      <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-lg">
        <path
          d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18 C 23,18 24.5,16 26,17 C 27.5,18 27.5,16 27.5,16 C 27.5,16 25,14.5 24.5,15 C 24,15.5 24.5,16 24.5,16 C 24.5,16 26,14 27,13 C 28,12 28,10.5 28,10.5 C 28,10.5 25.5,10.5 24,11 C 22.5,11.5 22.5,12 22.5,12 C 22.5,12 21,11 20.5,10.5 C 20,10 21,9.5 21,9.5 C 21,9.5 20,8.5 19,9 C 18,9.5 18,11 18,11 C 18,11 15,11 15,13.5 C 15,15.5 16.5,16.5 16.5,16.5 L 17,21 L 12.5,30 L 14,30 L 19,20.5 L 22,10 z"
          className={isWhite ? "fill-[#f0d9b5] stroke-[#4b4847]" : "fill-[#4b4847] stroke-[#f0d9b5]"}
          strokeWidth="1.5"
        />
      </svg>
    ),
    b: (
      <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-lg">
        <g className={isWhite ? "fill-[#f0d9b5] stroke-[#4b4847]" : "fill-[#4b4847] stroke-[#f0d9b5]"} strokeWidth="1.5">
          <path d="M 9,36 C 12.5,35 15,34.5 19,34.5 L 25,34.5 C 29,34.5 31.5,35 35,36 L 35,36 L 35,38 L 9,38 L 9,36 z" />
          <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 29,31.5 30,29.5 30,28.5 C 30,27.5 27.5,26 27.5,26 L 17.5,26 C 17.5,26 15,27.5 15,28.5 C 15,29.5 16,31.5 15,32 z" />
          <path d="M 25,8 A 2.5,2.5 0 1,1 19.99,8 A 2.5,2.5 0 1,1 25,8 z" />
          <path d="M 17.5,26 L 27.5,26 L 27.5,23 C 27.5,23 28.5,22.5 28,21 C 27.5,19.5 27.5,17 26,16 C 26,16 27,15 28,14.5 C 28,14.5 25.5,12.5 22.5,12.5 C 19.5,12.5 17,14.5 17,14.5 C 18,15 19,16 19,16 C 17.5,17 17.5,19.5 17,21 C 16.5,22.5 17.5,23 17.5,23 L 17.5,26 z" />
        </g>
      </svg>
    ),
    r: (
      <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-lg">
        <g className={isWhite ? "fill-[#f0d9b5] stroke-[#4b4847]" : "fill-[#4b4847] stroke-[#f0d9b5]"} strokeWidth="1.5">
          <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
          <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
          <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
          <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
          <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
          <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
          <path d="M 11,14 L 34,14" />
        </g>
      </svg>
    ),
    q: (
      <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-lg">
        <g className={isWhite ? "fill-[#f0d9b5] stroke-[#4b4847]" : "fill-[#4b4847] stroke-[#f0d9b5]"} strokeWidth="1.5">
          <path d="M 8,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 31,11 L 25.5,24.5 L 22.5,9.5 L 19.5,24.5 L 14,10.5 L 14,25 L 7,14 L 8,26 z" />
          <path d="M 8,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 L 17.5,39.5 L 27.5,39.5 L 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 37,26" />
          <path d="M 11.5,30 C 15,29 30,29 33.5,30" />
          <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" />
        </g>
      </svg>
    ),
    k: (
      <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-lg">
        <g className={isWhite ? "fill-[#f0d9b5] stroke-[#4b4847]" : "fill-[#4b4847] stroke-[#f0d9b5]"} strokeWidth="1.5">
          <path d="M 22.5,11.63 L 22.5,6" />
          <path d="M 20,8 L 25,8" />
          <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
          <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,30 11.5,30 L 11.5,37 z" />
          <path d="M 11.5,30 C 17,27 27,27 32.5,30" />
          <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" />
          <path d="M 11.5,37 C 17,34 27,34 32.5,37" />
        </g>
      </svg>
    ),
  };
  return <div className="w-full h-full p-1 transform transition-transform duration-200 hover:scale-105">{pieces[type.toLowerCase()]}</div>;
};

const ChessGame: React.FC = () => {
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{from: Square, to: Square} | null>(null);

  // New State for Game Mode
  const [gameMode, setGameMode] = useState<'pvp' | 'pvc' | 'online'>('pvc');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>('medium');
  const [showSetup, setShowSetup] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [connector] = useState(new PeerConnector());
  const [myId, setMyId] = useState<string>('');
  const [remoteId, setRemoteId] = useState<string>('');
  const [myColor, setMyColor] = useState<'w' | 'b'>('w');
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (myId) {
      navigator.clipboard.writeText(myId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    updateGameState();
    
    // Cleanup peer connection on unmount
    return () => {
      connector.destroy();
    };
  }, []);

  useEffect(() => {
    connector.onConnectionOpen(() => {
      setConnected(true);
      if (myColor === 'b') { // Only guest sends start
          connector.send({ type: 'start' });
      }
    });

    connector.onData((payload: any) => {
      if (payload?.type === 'move') {
        try {
          const moveResult = game.move(payload.move);
          if (moveResult) {
            setLastMove({ from: moveResult.from, to: moveResult.to });
            updateGameState();
          }
        } catch {}
      } else if (payload?.type === 'start') {
        setConnected(true);
        setShowSetup(false);
      }
    });
  }, [connector, game, myColor]);

  // AI Turn Effect
  useEffect(() => {
    if (gameMode === 'pvc' && game.turn() === 'b' && !game.isGameOver() && !winner && !showSetup) {
        setIsAiThinking(true);
        // Small delay for natural feel
        const timer = setTimeout(() => {
            const bestMove = getBestMove(game, aiDifficulty);
            if (bestMove) {
                try {
                    const moveResult = game.move(bestMove);
                    if (moveResult) {
                        setLastMove({ from: moveResult.from, to: moveResult.to });
                        updateGameState();
                    }
                } catch (e) {
                    console.error("AI Error:", e);
                }
            }
            setIsAiThinking(false);
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [game.fen(), gameMode, aiDifficulty, showSetup, winner]); // Depend on FEN to trigger on move

  const updateGameState = () => {
    setBoard(game.board());
    setHistory(game.history());
    if (game.isGameOver()) {
      if (game.isCheckmate()) {
        setWinner(game.turn() === 'w' ? 'Đen thắng!' : 'Trắng thắng!');
      } else if (game.isDraw()) {
        setWinner('Hòa!');
      } else {
        setWinner('Kết thúc!');
      }
    }
  };

  const handleSquareClick = (rowIndex: number, colIndex: number) => {
    if (game.isGameOver() || showSetup || (gameMode === 'pvc' && game.turn() === 'b')) return;
    if (gameMode === 'online' && game.turn() !== myColor) return;

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    const square = `${files[colIndex]}${ranks[rowIndex]}` as Square;

    // Logic 1: Try to move if a square is already selected
    if (selectedSquare) {
        // Attempt to move
        try {
            const move = game.move({
                from: selectedSquare,
                to: square,
                promotion: 'q', // Always promote to queen for simplicity for now
            });

            if (move) {
                setLastMove({ from: selectedSquare, to: square });
                updateGameState();
                setSelectedSquare(null);
                setPossibleMoves([]);
                if (gameMode === 'online') {
                  connector.send({ type: 'move', move: { from: selectedSquare, to: square, promotion: 'q' } });
                }
                return;
            }
        } catch (e) {
            // Illegal move, ignore
        }
    }

    // Logic 2: Select a piece
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
        // If clicking on same piece, toggle off
        if (selectedSquare === square) {
            setSelectedSquare(null);
            setPossibleMoves([]);
        } else {
            // Select new piece
            setSelectedSquare(square);
            const moves = game.moves({ square, verbose: true }).map((m) => m.to as Square);
            setPossibleMoves(moves);
        }
    } else {
        setSelectedSquare(null);
        setPossibleMoves([]);
    }
  };

  const startNewGame = (mode: 'pvp' | 'pvc' | 'online', difficulty?: Difficulty) => {
      const newGame = new Chess();
      setGame(newGame);
      setBoard(newGame.board());
      setWinner(null);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setHistory([]);
      setLastMove(null);
      setGameMode(mode);
      if (difficulty) setAiDifficulty(difficulty);
      setShowSetup(mode === 'online');
  };

  const resetGame = () => {
    setShowSetup(true);
  };

  const createOnlineRoom = () => {
    connector.create();
    const timer = setInterval(() => {
      if (connector.id) {
        setMyId(connector.id);
        clearInterval(timer);
      }
    }, 200);
    setMyColor('w');
  };

  const joinOnlineRoom = () => {
    if (!remoteId) return;
    connector.connect(remoteId);
    // Connection handling is done in onConnectionOpen
    setMyColor('b');
    setShowSetup(false);
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
                    <div className="text-left flex-grow">
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
                      onClick={() => { startNewGame('online'); createOnlineRoom(); }}
                      className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center gap-4 transition-all hover:scale-105 border border-slate-600 hover:border-cyan-500 group"
                    >
                      <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
                        <Users size={20} />
                      </div>
                      <div className="text-left flex-grow">
                        <div className="font-bold text-white">Tạo phòng</div>
                      </div>
                    </button>
                  ) : (
                    <div className="w-full p-3 bg-slate-700 rounded-xl flex items-center gap-4 border border-cyan-500/50 relative overflow-hidden">
                       <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none"></div>
                       <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                        <Users size={20} />
                      </div>
                      <div className="text-left flex-grow min-w-0">
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
                      onClick={() => { startNewGame('online'); joinOnlineRoom(); }}
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
        <div className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold transition-all ${game.turn() === 'w' ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
          <div className="w-3 h-3 rounded-full bg-white"></div>
          {gameMode === 'pvc' ? 'Bạn' : 'Trắng'}
        </div>
        
        <div className="flex flex-col items-center">
            <div className="text-2xl font-black text-slate-200">VS</div>
            <div className="text-xs text-slate-500 font-mono mt-1">TURN {Math.floor(history.length / 2) + 1}</div>
            {gameMode === 'online' && (
              <div className={`text-xs mt-1 ${connected ? 'text-emerald-400' : 'text-yellow-400'}`}>
                {connected ? 'Đã kết nối' : 'Đang chờ kết nối'}
              </div>
            )}
        </div>

        <div className={`flex items-center gap-3 px-6 py-3 rounded-lg font-bold transition-all ${game.turn() === 'b' ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
          {gameMode === 'pvc' && isAiThinking ? (
             <div className="flex items-center gap-2">
                 <span className="animate-pulse">Đang nghĩ...</span>
             </div>
          ) : (
             <span>{
               gameMode === 'pvc'
                 ? `Máy (${aiDifficulty === 'easy' ? 'Dễ' : aiDifficulty === 'medium' ? 'Vừa' : 'Khó'})`
                 : gameMode === 'online'
                   ? (myColor === 'w' ? 'Đối thủ' : 'Bạn')
                   : 'Đen'
             }</span>
          )}
          <div className="w-3 h-3 rounded-full bg-black border border-white"></div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 w-full items-start justify-center">
          {/* Chessboard */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
            <div className="relative grid grid-cols-8 border-[12px] border-slate-800 rounded-lg overflow-hidden shadow-2xl bg-slate-800">
            {board.map((row, rowIndex) =>
                row.map((piece, colIndex) => {
                const isDark = (rowIndex + colIndex) % 2 === 1;
                const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
                const square = `${files[colIndex]}${ranks[rowIndex]}` as Square;
                const isSelected = selectedSquare === square;
                const isPossibleMove = possibleMoves.includes(square);
                const isLastFrom = lastMove?.from === square;
                const isLastTo = lastMove?.to === square;
                const isCheck = piece?.type === 'k' && piece?.color === game.turn() && game.inCheck();

                return (
                    <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                        w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center cursor-pointer relative
                        ${isDark ? 'bg-[#779556]' : 'bg-[#ebecd0]'}
                        ${isSelected ? '!bg-[#baca44]' : ''}
                        ${(isLastFrom || isLastTo) ? '!bg-[#f5f682]' : ''}
                        transition-colors duration-0
                    `}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                    >
                    {/* Coordinates */}
                    {colIndex === 0 && (
                        <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${isDark ? 'text-[#ebecd0]' : 'text-[#779556]'} select-none`}>
                        {ranks[rowIndex]}
                        </span>
                    )}
                    {rowIndex === 7 && (
                        <span className={`absolute bottom-0 right-1 text-[10px] font-bold ${isDark ? 'text-[#ebecd0]' : 'text-[#779556]'} select-none`}>
                        {files[colIndex]}
                        </span>
                    )}

                    {/* Move Indicator */}
                    {isPossibleMove && (
                        <div className={`absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full z-10 ${piece ? 'border-[4px] border-slate-400/50 w-full h-full rounded-none !bg-transparent' : 'bg-black/10'}`} />
                    )}
                    
                    {/* Check Indicator */}
                    {isCheck && (
                         <div className="absolute inset-0 bg-red-500/50 rounded-full blur-md z-0 animate-pulse"></div>
                    )}

                    {piece && (
                        <div className="relative z-10 w-full h-full p-0.5">
                            <Piece type={piece.type} color={piece.color} />
                        </div>
                    )}
                    </div>
                );
                })
            )}
            </div>

            {winner && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-lg animate-fade-in">
                <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center transform scale-110">
                <h2 className="text-3xl font-bold text-white mb-2">{winner}</h2>
                <div className="text-slate-400 mb-6">Trò chơi kết thúc</div>
                <button
                    onClick={resetGame}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center mx-auto gap-2 font-bold shadow-lg shadow-indigo-500/30"
                >
                    <RefreshCw size={20} /> Chơi lại
                </button>
                </div>
            </div>
            )}
          </div>

          {/* Sidebar / History */}
          <div className="w-full lg:w-80 flex flex-col gap-4 h-[550px]">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex-grow overflow-hidden flex flex-col shadow-lg">
                  <h3 className="text-slate-200 font-bold mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
                      <RotateCcw size={18} /> Lịch sử nước đi
                  </h3>
                  <div className="overflow-y-auto flex-grow space-y-1 pr-2 custom-scrollbar">
                      {history.length === 0 && (
                          <div className="text-slate-500 text-center italic py-4">Chưa có nước đi nào</div>
                      )}
                      {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => (
                          <div key={i} className="flex text-sm">
                              <div className="w-8 text-slate-500 py-1">{i + 1}.</div>
                              <div className="w-16 py-1 font-mono text-slate-300 bg-slate-700/50 rounded px-2 mr-2">{history[2 * i]}</div>
                              <div className="w-16 py-1 font-mono text-slate-300 bg-slate-700/50 rounded px-2">{history[2 * i + 1]}</div>
                          </div>
                      ))}
                  </div>
              </div>
              
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-lg">
                   <div className="flex gap-2">
                       <button onClick={resetGame} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition flex justify-center items-center gap-2">
                           <RefreshCw size={18} /> Ván mới
                       </button>
                       {/* Undo button could be added here */}
                   </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ChessGame;
