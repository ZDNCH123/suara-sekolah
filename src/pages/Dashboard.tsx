import React from 'react';
import { 
  MessageSquare, 
  Newspaper, 
  MessageCircle, 
  Users,
  Award,
  Calendar,
  Bot
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNotification } from '../contexts/NotificationContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { complaints, newsPosts, chats, schedules } = useData();
  const { notifications } = useNotification();

  const quickStats = [
    {
      title: 'Total Pengaduan',
      value: complaints.length,
      icon: MessageSquare,
      color: 'from-pink-500 to-rose-500'
    },
    {
      title: 'Berita Terbaru',
      value: newsPosts.length,
      icon: Newspaper,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      title: 'Chat Aktif',
      value: chats.length,
      icon: MessageCircle,
      color: 'from-cyan-500 to-blue-500'
    },
    {
      title: 'Poin Saya',
      value: user?.points || 0,
      icon: Award,
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  // Get today's schedule
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
  const todaySchedule = schedules.filter(schedule => 
    schedule.hari === today && schedule.kelas === user?.kelas
  ).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));

  // Get current time to highlight current class
  const currentTime = new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });

  // Recent activity from notifications
  const recentActivity = notifications.slice(0, 5).map(notif => ({
    id: notif.id,
    type: 'notification',
    title: notif.message,
    time: new Date(notif.created_at).toLocaleDateString('id-ID'),
    status: notif.is_read ? 'read' : 'unread'
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Hey {user?.name}! 👋
            </h1>
            <p className="text-lg opacity-90">
              Welcome to SuaraSekolah.id - {new Date().toLocaleDateString('id-ID', { weekday: 'long' })}
            </p>
            <p className="text-sm opacity-75 mt-2">
              Biar semua suara sekolah didengar! Mari berkontribusi positif hari ini.
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Users size={64} className="opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stat.value}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {stat.title}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Notifikasi Terbaru
            </h2>
          </div>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${
                  activity.status === 'unread' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                    : 'bg-gray-50 dark:bg-gray-700'
                }`}>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-medium">
                      {activity.title}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {activity.time}
                    </p>
                  </div>
                  {activity.status === 'unread' && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500 dark:text-gray-400">Belum ada notifikasi</p>
            </div>
          )}
        </div>

        {/* Quick Actions & Profile */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {user?.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm capitalize mb-2">
                {user?.role} • {user?.kelas}
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm">
                <span className="text-yellow-500">⭐ {user?.points} Points</span>
                <span className="text-purple-500">🏆 {user?.badges.length} Badges</span>
              </div>
            </div>
            
            {user?.badges && user.badges.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Badges Terbaru
                </h4>
                {user.badges.slice(0, 2).map((badge, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-purple-50 dark:bg-purple-900 rounded-lg">
                    <Award className="text-purple-600 dark:text-purple-400" size={16} />
                    <span className="text-purple-700 dark:text-purple-300 text-sm">
                      {badge}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.href = '/speak-up'}
                className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all transform hover:scale-105"
              >
                <MessageSquare size={20} />
                <span>Buat Pengaduan</span>
              </button>
              {user?.role === 'admin' && (
                <button 
                  onClick={() => window.location.href = '/news'}
                  className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all transform hover:scale-105"
                >
                  <Newspaper size={20} />
                  <span>Posting Berita</span>
                </button>
              )}
              <button 
                onClick={() => window.location.href = '/chat'}
                className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all transform hover:scale-105"
              >
                <Bot size={20} />
                <span>Chat AI Konselor</span>
              </button>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="text-gray-600 dark:text-gray-400" size={20} />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Jadwal Hari Ini ({today})
              </h3>
            </div>
            {todaySchedule.length > 0 ? (
              <div className="space-y-3">
                {todaySchedule.map((schedule) => {
                  const isCurrentClass = currentTime >= schedule.jam_mulai && currentTime <= schedule.jam_selesai;
                  return (
                    <div 
                      key={schedule.id} 
                      className={`p-3 rounded-lg border ${
                        isCurrentClass 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium ${
                          isCurrentClass 
                            ? 'text-green-700 dark:text-green-300' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {schedule.mata_pelajaran}
                        </span>
                        <span className={`text-xs ${
                          isCurrentClass 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {schedule.jam_mulai} - {schedule.jam_selesai}
                        </span>
                      </div>
                      <div className={`text-sm ${
                        isCurrentClass 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {schedule.guru} • {schedule.ruangan}
                        {isCurrentClass && <span className="ml-2 font-medium">(Sedang Berlangsung)</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <Calendar className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tidak ada jadwal untuk hari ini
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;