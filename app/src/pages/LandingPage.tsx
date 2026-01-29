import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Grid3X3, CircleDot, ChevronRight, Play } from 'lucide-react';

const games = [
  {
    id: 'chess',
    name: 'Cờ Vua',
    description: 'Chiến thuật kinh điển phương Tây. Chơi với AI thông minh (3 cấp độ) hoặc đấu với bạn bè.',
    icon: <Gamepad2 className="w-16 h-16 mb-6 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />,
    path: '/chess',
    color: 'from-indigo-500/20 to-blue-500/20 hover:from-indigo-500/30 hover:to-blue-500/30',
    borderColor: 'border-indigo-500/30 hover:border-indigo-500/50',
    bgImage: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.1), transparent)'
  },
  {
    id: 'xiangqi',
    name: 'Cờ Tướng',
    description: 'Trí tuệ phương Đông. Thử thách bản thân với AI (3 cấp độ) hoặc so tài cùng đối thủ trên bàn cờ.',
    icon: <Grid3X3 className="w-16 h-16 mb-6 text-red-400 group-hover:scale-110 transition-transform duration-300" />,
    path: '/xiangqi',
    color: 'from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30',
    borderColor: 'border-red-500/30 hover:border-red-500/50',
    bgImage: 'radial-gradient(circle at top right, rgba(239, 68, 68, 0.1), transparent)'
  },
  {
    id: 'go',
    name: 'Cờ Vây',
    description: 'Nghệ thuật vây bắt. Đối đầu với máy (3 cấp độ) hoặc người chơi khác trên bàn cờ 13x13.',
    icon: <CircleDot className="w-16 h-16 mb-6 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />,
    path: '/go',
    color: 'from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500/50',
    bgImage: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.1), transparent)'
  },
];

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <header className="text-center mb-20 animate-fade-in">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-sm font-medium">
            ✨ Trải nghiệm Board Game Đỉnh Cao
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
            Chọn <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-violet-400">Thử Thách</span> <br className="hidden md:block" />
            Của Bạn Ngay Hôm Nay
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Rèn luyện tư duy chiến thuật với bộ sưu tập các trò chơi cờ kinh điển.
            Hỗ trợ chế độ chơi với Máy (AI) và chơi 2 Người.
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <Link 
              key={game.id} 
              to={game.path}
              className={`group relative p-8 rounded-3xl border ${game.borderColor} bg-slate-900/50 backdrop-blur-sm transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl overflow-hidden`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-linear-to-br ${game.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="absolute inset-0" style={{ background: game.bgImage }} />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="grow">
                   {game.icon}
                   <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-indigo-200 transition-colors">{game.name}</h2>
                   <p className="text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">{game.description}</p>
                </div>
                
                <div className="mt-8 flex items-center text-indigo-400 font-bold group-hover:text-white transition-colors">
                  Chơi ngay <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-20 text-center">
             <Link to="/tutorial" className="inline-flex px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-indigo-50 transition-colors shadow-lg shadow-white/10 items-center mx-auto gap-3">
                <Play className="fill-slate-900" size={20} />
                Hướng dẫn người mới
             </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
