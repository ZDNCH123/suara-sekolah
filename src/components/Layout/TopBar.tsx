import React, { useState } from 'react';
import { Bell, Sun, Moon, LogOut, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const TopBar: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotification();

  const [showPopup, setShowPopup] = useState(false);

  const handleBellClick = () => {
    setShowPopup(!showPopup);
    if (!showPopup) {
      markAllAsRead();
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4 relative">
      <div className="flex items-center justify-between">
        <div className="lg:hidden"></div>

        <div className="hidden lg:block">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifikasi */}
          <button
            onClick={handleBellClick}
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1">
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </div>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Notification Popup */}
      {showPopup && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPopup(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-4 top-16 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifikasi
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                    {unreadCount} baru
                  </span>
                )}
                <button
                  onClick={() => setShowPopup(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Belum ada notifikasi
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.slice(0, 10).map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !notif.is_read ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <p className="text-sm text-gray-900 dark:text-white mb-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(notif.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={markAllAsRead}
                  className="w-full text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  Tandai semua sudah dibaca
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
};

export default TopBar;
