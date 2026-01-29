import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Info } from 'lucide-react';
import ChessGame from '../games/chess/ChessGame';

const ChessPage: React.FC = () => {
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-[90rem] mx-auto">
        <div className="flex flex-col gap-6">
           <div className="flex items-center gap-4">
              <Link to="/" className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl font-bold bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Cờ Vua
              </h1>
           </div>

           <div className="bg-slate-900/50 p-1 rounded-3xl shadow-2xl shadow-indigo-500/10 border border-slate-800 backdrop-blur-sm">
              <ChessGame />
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChessPage;
