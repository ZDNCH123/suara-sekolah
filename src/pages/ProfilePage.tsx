import React, { useState } from 'react';
import { 
  User, 
  Award, 
  Settings, 
  Bell, 
  Shield, 
  Camera,
  Edit3,
  Save,
  X,
  Key,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const ProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [editData, setEditData] = useState({
    name: '',
    kelas: ''
  });

  const { user, logout } = useAuth();

  const handleEditStart = () => {
    setEditData({
      name: user?.name || '',
      kelas: user?.kelas || ''
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditData({ name: '', kelas: '' });
  };

  const handleEditSave = () => {
    // Update user profile in Supabase
    updateUserProfile();
    setIsEditing(false);
  };

  const updateUserProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editData.name,
          kelas: editData.kelas
        })
        .eq('id', user.id);

      if (error) throw error;

      alert('Profil berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Gagal memperbarui profil');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Password baru dan konfirmasi tidak cocok');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password baru minimal 6 karakter');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      alert('Password berhasil diubah!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Gagal mengubah password');
    }
  };

  const badges = [
    { name: 'Kontributor Aktif', icon: '🌟', description: 'Aktif posting konten' },
    { name: 'Reporter Hebat', icon: '📢', description: 'Sering melaporkan masalah' },
    { name: 'Sahabat Konselor AI', icon: '🤖', description: 'Sering chat dengan AI' },
    { name: 'Guru Inspiratif', icon: '🎓', description: 'Mentor terbaik' },
    { name: 'Super Admin', icon: '👑', description: 'Administrator platform' },
    { name: 'Guardian', icon: '🛡️', description: 'Menjaga keamanan platform' }
  ];

  const userBadges = badges.filter(badge => user?.badges.includes(badge.name));
  const availableBadges = badges.filter(badge => !user?.badges.includes(badge.name));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center">
              <User className="mr-3" size={32} />
              Profil Saya
            </h1>
            <p className="text-lg opacity-90 mb-2">
              Kelola informasi dan preferensi akun kamu
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <User size={64} className="opacity-80" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Informasi Dasar
              </h2>
              {!isEditing ? (
                <button
                  onClick={handleEditStart}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Edit3 size={16} />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleEditSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save size={16} />
                    <span>Simpan</span>
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X size={16} />
                    <span>Batal</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Camera size={16} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {user?.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 capitalize mb-1">
                  {user?.role} • {user?.kelas}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  ID: {user?.displayId}
                </p>
                <div className="flex items-center space-x-4">
                  <span className="text-yellow-500 font-medium">⭐ {user?.points} Points</span>
                  <span className="text-purple-500 font-medium">🏆 {user?.badges.length} Badges</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nama Lengkap
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {user?.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  NIK/NIS
                </label>
                <p className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                  {user?.nikNis}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kelas
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.kelas}
                    onChange={(e) => setEditData(prev => ({ ...prev, kelas: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                ) : (
                  <p className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {user?.kelas}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Pengaturan
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bell className="text-purple-600" size={20} />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Notifikasi Push
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Terima notifikasi untuk update terbaru
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="text-purple-600" size={20} />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Mode Privasi
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sembunyikan aktivitas dari pengguna lain
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Achievements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Award className="mr-2" size={20} />
              Badges Saya
            </h2>
            
            {userBadges.length > 0 ? (
              <div className="space-y-3 mb-6">
                {userBadges.map((badge, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-lg border border-purple-200 dark:border-purple-700">
                    <span className="text-2xl">{badge.icon}</span>
                    <div>
                      <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                        {badge.name}
                      </h3>
                      <p className="text-sm text-purple-600 dark:text-purple-300">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                Belum ada badge. Yuk, lebih aktif untuk mendapatkan badge!
              </p>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                Badge yang Bisa Didapat
              </h3>
              <div className="space-y-2">
                {availableBadges.slice(0, 3).map((badge, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg opacity-60">
                    <span className="text-lg grayscale">{badge.icon}</span>
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {badge.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors"
              >
                <Key size={20} />
                <span>Ubah Password</span>
              </button>
              <button className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">
                <Bell size={20} />
                <span>Pengaturan Notifikasi</span>
              </button>
              <button
                onClick={logout}
                className="w-full flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Ubah Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Masukkan password baru..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Konfirmasi password baru..."
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={!passwordData.newPassword || !passwordData.confirmPassword}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ubah Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;