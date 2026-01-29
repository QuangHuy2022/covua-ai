import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Crown, Shield, Swords } from 'lucide-react';

const TutorialPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors">
            <ArrowLeft className="mr-2" size={20} />
            Quay lại trang chủ
          </Link>
        </div>

        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Hướng Dẫn Người Mới</h1>
          <p className="text-xl text-slate-400">Làm quen với các trò chơi và tính năng trên CoVuaAI</p>
        </header>

        <div className="grid gap-12">
          {/* Cờ Vua */}
          <section className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                <Crown size={32} />
              </div>
              <h2 className="text-3xl font-bold text-white">Cờ Vua</h2>
            </div>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">Mục tiêu:</strong> Chiếu hết Vua của đối phương.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-indigo-300">Tốt:</strong> Đi thẳng 1 ô (hoặc 2 ô ở nước đầu), ăn chéo.</li>
                <li><strong className="text-indigo-300">Xe:</strong> Đi ngang hoặc dọc không giới hạn.</li>
                <li><strong className="text-indigo-300">Mã:</strong> Đi hình chữ L, có thể nhảy qua quân khác.</li>
                <li><strong className="text-indigo-300">Tượng:</strong> Đi chéo không giới hạn.</li>
                <li><strong className="text-indigo-300">Hậu:</strong> Kết hợp sức mạnh của Xe và Tượng.</li>
                <li><strong className="text-indigo-300">Vua:</strong> Đi 1 ô theo mọi hướng.</li>
              </ul>
            </div>
          </section>

          {/* Cờ Tướng */}
          <section className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500/20 rounded-xl text-red-400">
                <Swords size={32} />
              </div>
              <h2 className="text-3xl font-bold text-white">Cờ Tướng</h2>
            </div>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">Mục tiêu:</strong> Bắt Tướng (Soái) của đối phương.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-red-300">Tướng:</strong> Đi từng ô một trong Cung, không được ra ngoài.</li>
                <li><strong className="text-red-300">Sĩ:</strong> Đi chéo từng ô một trong Cung.</li>
                <li><strong className="text-red-300">Tượng:</strong> Đi chéo 2 ô (không qua sông).</li>
                <li><strong className="text-red-300">Xe:</strong> Đi ngang dọc tự do.</li>
                <li><strong className="text-red-300">Pháo:</strong> Đi như Xe, nhưng muốn ăn quân phải nhảy qua 1 quân khác (ngòi).</li>
                <li><strong className="text-red-300">Mã:</strong> Đi chữ L (bị cản nếu có quân nằm ngay cạnh).</li>
                <li><strong className="text-red-300">Tốt:</strong> Đi thẳng 1 ô. Qua sông được đi ngang.</li>
              </ul>
            </div>
          </section>

          {/* Cờ Vây */}
          <section className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                <Shield size={32} />
              </div>
              <h2 className="text-3xl font-bold text-white">Cờ Vây</h2>
            </div>
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">Mục tiêu:</strong> Chiếm được nhiều đất hơn đối thủ.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Người chơi lần lượt đặt quân Đen và Trắng vào các giao điểm trống.</li>
                <li>Quân cờ bị bao vây hoàn toàn (không còn "khí") sẽ bị bắt.</li>
                <li>Không được đi nước lặp lại trạng thái cũ ngay lập tức (Luật Ko).</li>
                <li>Ván cờ kết thúc khi cả 2 bên cùng bỏ lượt (Pass).</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
