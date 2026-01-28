import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Gamepad2, Menu, X, Github } from 'lucide-react';

const MainLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Trang chủ' },
    { path: '/chess', label: 'Cờ Vua' },
    { path: '/xiangqi', label: 'Cờ Tướng' },
    { path: '/go', label: 'Cờ Vây' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              BoardGame
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'bg-slate-800 text-white shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 animate-fade-in">
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-base font-medium ${
                    location.pathname === link.path
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow relative">
         {/* Background Decoration */}
         <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[100px]" />
         </div>
         
         <div className="relative z-10">
            <Outlet />
         </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Gamepad2 className="w-6 h-6 text-indigo-500" />
                <span className="font-bold text-lg text-slate-200">BoardGame Arena</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Nền tảng chơi cờ trực tuyến hiện đại với giao diện tối ưu cho trải nghiệm người dùng tốt nhất.
                Thách thức trí tuệ của bạn với AI hoặc bạn bè.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-200 mb-6">Trò chơi</h3>
              <ul className="space-y-3 text-sm text-slate-500">
                {navLinks.slice(1).map(link => (
                    <li key={link.path}>
                        <Link to={link.path} className="hover:text-indigo-400 transition-colors flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                            {link.label}
                        </Link>
                    </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-slate-200 mb-6">Kết nối</h3>
              <div className="flex gap-4">
                <a href="#" className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                    <Github size={20} />
                </a>
                {/* Add more social icons if needed */}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-900 mt-12 pt-8 text-center text-slate-600 text-sm">
            © {new Date().getFullYear()} BoardGame Arena. Created by Trae AI.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
