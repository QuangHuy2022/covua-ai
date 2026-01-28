import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Info } from 'lucide-react';
import ChessGame from '../games/chess/ChessGame';

const ChessPage: React.FC = () => {
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          
          {/* Main Game Column */}
          <div className="w-full lg:w-3/4 flex flex-col gap-6">
             <div className="flex items-center gap-4 mb-2">
                <Link to="/" className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  Cờ Vua
                </h1>
             </div>

             <div className="bg-slate-900/50 p-1 rounded-3xl shadow-2xl shadow-indigo-500/10 border border-slate-800 backdrop-blur-sm">
                <ChessGame />
             </div>
          </div>
          
          {/* Sidebar Column */}
          <div className="w-full lg:w-1/4 space-y-6 lg:sticky lg:top-24">
            <div className="bg-slate-900/80 p-6 rounded-2xl shadow-lg border border-slate-800 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-4 text-indigo-400">
                <BookOpen className="w-5 h-5" />
                <h2 className="text-lg font-bold">Hướng dẫn</h2>
              </div>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>
                  <span>Trắng đi trước, Đen đi sau.</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>
                  <span>Chọn quân cờ để xem các nước đi hợp lệ (chấm xanh).</span>
                </li>
                <li className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></span>
                  <span>Mục tiêu là Chiếu hết Vua đối phương.</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/20 to-violet-900/20 p-6 rounded-2xl border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-3 text-indigo-300">
                <Info className="w-5 h-5" />
                <h3 className="font-bold">Mẹo chơi</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Kiểm soát khu vực trung tâm bàn cờ là chìa khóa để chiến thắng. Hãy phát triển các quân Mã và Tượng sớm!
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ChessPage;
