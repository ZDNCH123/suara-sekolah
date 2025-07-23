import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  Newspaper, 
  MessageCircle, 
  User,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Speak Up Corner', href: '/speak-up', icon: MessageSquare },
    { name: 'Portal Berita', href: '/news', icon: Newspaper },
    { name: 'Chat Internal', href: '/chat', icon: MessageCircle },
    { name: 'Profil', href: '/profile', icon: User },
  ];

  if (user?.role === 'admin' || user?.role === 'guru') {
    navigation.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
  }

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-40 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <img 
                src="https://i.ibb.co/Z6RcBhY/logo-smkn2-bekasi.png" 
                alt="SMKN 2 Bekasi Logo" 
                className="w-10 h-10 rounded-lg object-contain bg-white p-1"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzc5NTVGNyIvPgo8dGV4dCB4PSIyMCIgeT0iMjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TPC90ZXh0Pgo8L3N2Zz4K';
                }}
              />
              <div>
                <h1 className="text-lg font-bold text-white">SMKN 2 Bekasi</h1>
                <p className="text-xs text-gray-400">SuaraSekolah.id</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <p>Jl. Lap. Bola Rw. Butun</p>
              <p>Ciketing Udik, Bantar Gebang</p>
              <p>Kota Bekasi, Jawa Barat 17153</p>
            </div>
          </div>

          {/* User info */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{user?.name}</p>
                <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
                <p className="text-gray-500 text-xs">ID: {user?.displayId}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-yellow-400">⭐ {user?.points} pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} className="flex-shrink-0" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              SMKN 2 Kota Bekasi 🚀
            </p>
            <p className="text-xs text-gray-400 text-center mt-1">
              Maju Bersama Teknologi
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;