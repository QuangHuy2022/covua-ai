import React, { useState } from 'react';
import { Gamepad2, Grid3X3, CircleDot, ArrowLeft, BookOpen, Users, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const TutorialPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chess' | 'xiangqi' | 'go'>('chess');

  const games = [
    {
      id: 'chess',
      name: 'Cờ Vua',
      icon: <Gamepad2 className="w-6 h-6" />,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/50'
    },
    {
      id: 'xiangqi',
      name: 'Cờ Tướng',
      icon: <Grid3X3 className="w-6 h-6" />,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/50'
    },
    {
      id: 'go',
      name: 'Cờ Vây',
      icon: <CircleDot className="w-6 h-6" />,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/50'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center gap-4">
        <Link to="/" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <BookOpen className="text-cyan-400" />
          Hướng Dẫn Người Mới
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 mb-8">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => setActiveTab(game.id as any)}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl border transition-all ${
              activeTab === game.id
                ? `${game.bgColor} ${game.borderColor} ${game.color} shadow-lg scale-105`
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {game.icon}
            <span className="font-bold text-lg">{game.name}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-slate-700 p-8 shadow-2xl">
        {activeTab === 'chess' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-indigo-500/20 rounded-2xl hidden md:block">
                <Gamepad2 className="w-16 h-16 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Luật Chơi Cờ Vua Cơ Bản</h2>
                <p className="text-slate-300 leading-relaxed mb-6">
                  Cờ vua là trò chơi chiến thuật giữa hai người, mỗi bên có 16 quân cờ. 
                  Mục tiêu tối thượng là "Chiếu bí" (Checkmate) Vua của đối phương - khiến Vua bị tấn công và không còn đường thoát.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
                      <Users size={20} /> Các Quân Cờ
                    </h3>
                    <ul className="space-y-2 text-slate-400">
                      <li>• <strong className="text-white">Tốt:</strong> Đi thẳng, ăn chéo. Nước đầu đi 2 ô.</li>
                      <li>• <strong className="text-white">Mã:</strong> Đi hình chữ L, có thể nhảy qua quân khác.</li>
                      <li>• <strong className="text-white">Tượng:</strong> Đi chéo không giới hạn.</li>
                      <li>• <strong className="text-white">Xe:</strong> Đi ngang dọc không giới hạn.</li>
                      <li>• <strong className="text-white">Hậu:</strong> Kết hợp Xe và Tượng (ngang, dọc, chéo).</li>
                      <li>• <strong className="text-white">Vua:</strong> Đi 1 ô mọi hướng. Quan trọng nhất!</li>
                    </ul>
                  </div>
                  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
                      <Trophy size={20} /> Luật Đặc Biệt
                    </h3>
                    <ul className="space-y-2 text-slate-400">
                      <li>• <strong className="text-white">Nhập thành:</strong> Nước đi đặc biệt bảo vệ Vua và đưa Xe ra trận.</li>
                      <li>• <strong className="text-white">Phong cấp:</strong> Tốt đi đến cuối bàn cờ được hóa thành Hậu, Xe...</li>
                      <li>• <strong className="text-white">Bắt tốt qua đường:</strong> Nước bắt tốt đặc biệt khi tốt đối phương đi 2 ô.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'xiangqi' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-red-500/20 rounded-2xl hidden md:block">
                <Grid3X3 className="w-16 h-16 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Luật Chơi Cờ Tướng Cơ Bản</h2>
                <p className="text-slate-300 leading-relaxed mb-6">
                  Cờ tướng mô phỏng trận chiến giữa hai quân đội với mục tiêu bắt Tướng (Soái) của đối phương.
                  Bàn cờ có Sông (Hà) chia đôi và Cung Tướng (Cửu Cung) ở mỗi bên.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-red-300 mb-3 flex items-center gap-2">
                      <Users size={20} /> Các Quân Cờ
                    </h3>
                    <ul className="space-y-2 text-slate-400">
                      <li>• <strong className="text-white">Tốt (Binh):</strong> Đi thẳng 1 ô. Qua sông được đi ngang. Không đi lùi.</li>
                      <li>• <strong className="text-white">Mã:</strong> Đi chữ L (2x1). Bị cản nếu có quân nằm cạnh (Cản mã).</li>
                      <li>• <strong className="text-white">Tượng:</strong> Đi chéo 2 ô (Điền). Không được qua sông.</li>
                      <li>• <strong className="text-white">Sĩ:</strong> Đi chéo 1 ô. Chỉ ở trong Cung.</li>
                      <li>• <strong className="text-white">Tướng:</strong> Đi ngang/dọc 1 ô. Chỉ ở trong Cung.</li>
                      <li>• <strong className="text-white">Pháo:</strong> Đi như Xe, nhưng muốn ăn phải nhảy qua 1 quân (Ngòi).</li>
                    </ul>
                  </div>
                  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-red-300 mb-3 flex items-center gap-2">
                      <Trophy size={20} /> Luật Đặc Biệt
                    </h3>
                    <ul className="space-y-2 text-slate-400">
                      <li>• <strong className="text-white">Lộ mặt tướng:</strong> Hai tướng không được nhìn thấy nhau trên cùng cột dọc (không có quân chắn).</li>
                      <li>• <strong className="text-white">Cản mã:</strong> Nếu có quân đứng ngay cạnh Mã về hướng di chuyển, Mã không thể nhảy.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'go' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-emerald-500/20 rounded-2xl hidden md:block">
                <CircleDot className="w-16 h-16 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Luật Chơi Cờ Vây Cơ Bản</h2>
                <p className="text-slate-300 leading-relaxed mb-6">
                  Cờ vây là cuộc chiến giành lãnh thổ. Mục tiêu là bao vây được nhiều đất hơn đối thủ.
                  Luật chơi rất đơn giản nhưng biến hóa vô cùng phức tạp.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2">
                      <Users size={20} /> Khái Niệm Chính
                    </h3>
                    <ul className="space-y-2 text-slate-400">
                      <li>• <strong className="text-white">Khí:</strong> Các giao điểm trống nằm cạnh quân cờ (ngang/dọc).</li>
                      <li>• <strong className="text-white">Bắt quân:</strong> Khi một quân hoặc nhóm quân bị vây kín hết "Khí", chúng bị bắt và nhấc ra khỏi bàn cờ.</li>
                      <li>• <strong className="text-white">Đất:</strong> Vùng trống được quân mình vây kín hoàn toàn.</li>
                    </ul>
                  </div>
                  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2">
                      <Trophy size={20} /> Luật Đặc Biệt
                    </h3>
                    <ul className="space-y-2 text-slate-400">
                      <li>• <strong className="text-white">Ko (Kiếp):</strong> Không được lặp lại trạng thái bàn cờ cũ ngay lập tức (ăn qua ăn lại vô tận).</li>
                      <li>• <strong className="text-white">Tự sát:</strong> Không được đặt quân vào nơi không còn khí (trừ khi để ăn quân đối phương).</li>
                      <li>• <strong className="text-white">Komi:</strong> Điểm cộng cho quân Trắng (người đi sau) để cân bằng lợi thế đi trước.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorialPage;
