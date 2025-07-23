import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  FileText, 
  MessageSquare, 
  Settings, 
  TrendingUp,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  UserPlus,
  Shield,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  name: string;
  nik_nis: string;
  display_id: string;
  role: 'siswa' | 'guru' | 'osis' | 'admin';
  kelas?: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { complaints, updateComplaintStatus } = useData();
  
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showComplaintDetail, setShowComplaintDetail] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalComplaints: 0,
    totalNews: 0,
    pendingComplaints: 0
  });

  const [newUserData, setNewUserData] = useState({
    name: '',
    nikNis: '',
    role: 'siswa' as 'siswa' | 'guru' | 'osis' | 'admin',
    kelas: '',
    password: ''
  });

  // Check admin access
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Akses Terbatas
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Hanya admin yang dapat mengakses panel ini
          </p>
        </div>
      </div>
    );
  }

  // Load data
  useEffect(() => {
    loadUsers();
    loadStats();
    
    // Set up real-time subscriptions
    const usersChannel = supabase
      .channel('admin-users-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, () => {
        loadUsers();
        loadStats();
      })
      .subscribe();

    const complaintsChannel = supabase
      .channel('admin-complaints-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pengaduan'
      }, () => {
        loadStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(complaintsChannel);
    };
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [usersResult, complaintsResult, newsResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('pengaduan').select('id, status', { count: 'exact' }),
        supabase.from('berita').select('id', { count: 'exact' })
      ]);

      const pendingCount = complaintsResult.data?.filter(c => c.status === 'diterima').length || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalComplaints: complaintsResult.count || 0,
        totalNews: newsResult.count || 0,
        pendingComplaints: pendingCount
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Generate display ID
      const generateDisplayId = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
      };

      let displayId = generateDisplayId();
      
      // Check if display_id already exists
      let { data: existingUser } = await supabase
        .from('users')
        .select('display_id')
        .eq('display_id', displayId)
        .maybeSingle();

      while (existingUser) {
        displayId = generateDisplayId();
        const { data } = await supabase
          .from('users')
          .select('display_id')
          .eq('display_id', displayId)
          .maybeSingle();
        existingUser = data;
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: `${newUserData.nikNis}@suarasekolah.id`,
        password: newUserData.password,
        user_metadata: {
          full_name: newUserData.name,
          nik_nis: newUserData.nikNis,
          role: newUserData.role,
          kelas: newUserData.kelas
        }
      });

      if (authError) throw authError;

      // Insert into users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          nik_nis: newUserData.nikNis,
          display_id: displayId,
          name: newUserData.name,
          role: newUserData.role,
          password_hash: 'handled_by_supabase_auth',
          kelas: newUserData.kelas || null
        });

      if (insertError) throw insertError;

      // Create leaderboard entry
      await supabase.from('leaderboard').insert({
        user_id: authData.user.id,
        total_berita: 0,
        total_pengaduan: 0,
        points: 0
      });

      alert('User berhasil ditambahkan!');
      setShowAddUser(false);
      setNewUserData({
        name: '',
        nikNis: '',
        role: 'siswa',
        kelas: '',
        password: ''
      });
      loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Gagal menambahkan user');
    }
  };

  const handleStatusUpdate = async (complaintId: string, newStatus: 'diterima' | 'diproses' | 'selesai') => {
    try {
      const { error } = await supabase
        .from('pengaduan')
        .update({ status: newStatus })
        .eq('id', complaintId);

      if (error) throw error;

      const statusMap = {
        'diterima': 'Diterima' as const,
        'diproses': 'Diproses' as const,
        'selesai': 'Selesai' as const
      };

      updateComplaintStatus(complaintId, statusMap[newStatus]);
      alert('Status laporan berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Gagal memperbarui status');
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = filterStatus === 'all' || complaint.status === filterStatus;
    const matchesSearch = complaint.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Diterima':
        return <Clock className="text-yellow-500" size={16} />;
      case 'Diproses':
        return <AlertCircle className="text-blue-500" size={16} />;
      case 'Selesai':
        return <CheckCircle className="text-green-500" size={16} />;
      default:
        return <Clock className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Diterima':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Diproses':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Selesai':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center">
              <BarChart3 className="mr-3" size={32} />
              Admin Dashboard
            </h1>
            <p className="text-lg opacity-90">
              Kelola dan pantau aktivitas platform secara real-time
            </p>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-xl flex items-center space-x-2 transition-all backdrop-blur-sm"
          >
            <UserPlus size={20} />
            <span className="hidden sm:inline">Tambah User</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
            </div>
            <Users className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Berita</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalNews}</p>
            </div>
            <FileText className="text-green-500" size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pengaduan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalComplaints}</p>
            </div>
            <MessageSquare className="text-orange-500" size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingComplaints}</p>
            </div>
            <TrendingUp className="text-purple-500" size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Complaints Management */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Kelola Laporan
            </h2>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Cari laporan..."
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Semua Status</option>
                <option value="Diterima">Diterima</option>
                <option value="Diproses">Diproses</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredComplaints.map((complaint) => (
              <div key={complaint.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <FileText className="text-white" size={16} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs font-medium">
                          {complaint.type}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 ${getStatusColor(complaint.status)}`}>
                          {getStatusIcon(complaint.status)}
                          <span>{complaint.status}</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {complaint.createdAt.toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowComplaintDetail(complaint.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-900 dark:text-white text-sm mb-3 line-clamp-2">
                  {complaint.content}
                </p>

                {complaint.status !== 'Selesai' && (
                  <div className="flex items-center space-x-2">
                    {complaint.status === 'Diterima' && (
                      <button
                        onClick={() => handleStatusUpdate(complaint.id, 'diproses')}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Proses
                      </button>
                    )}
                    {complaint.status === 'Diproses' && (
                      <button
                        onClick={() => handleStatusUpdate(complaint.id, 'selesai')}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Selesaikan
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Daftar User
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {users.slice(0, 10).map((user) => (
              <div key={user.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {user.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {user.role} • {user.display_id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Tambah User Baru
              </h3>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  NIK/NIS
                </label>
                <input
                  type="text"
                  value={newUserData.nikNis}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, nikNis: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="siswa">Siswa</option>
                  <option value="guru">Guru</option>
                  <option value="osis">OSIS</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kelas (Opsional)
                </label>
                <input
                  type="text"
                  value={newUserData.kelas}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, kelas: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Contoh: XII RPL 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-105"
                >
                  Tambah User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Detail Modal */}
      {showComplaintDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {(() => {
              const complaint = complaints.find(c => c.id === showComplaintDetail);
              if (!complaint) return null;

              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Detail Laporan
                    </h3>
                    <button
                      onClick={() => setShowComplaintDetail(null)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-lg text-sm font-medium">
                        {complaint.type}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center space-x-1 ${getStatusColor(complaint.status)}`}>
                        {getStatusIcon(complaint.status)}
                        <span>{complaint.status}</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Isi Laporan:</h4>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {complaint.content}
                      </p>
                    </div>

                    {complaint.bukti_url && (
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Bukti Gambar:</h4>
                        <img 
                          src={complaint.bukti_url} 
                          alt="Bukti laporan"
                          className="w-full max-w-md rounded-lg border border-gray-200 dark:border-gray-700"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTDEwMCAxMDBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIxMDAiIHk9IjEwNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOUNBM0FGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5HYW1iYXIgdGlkYWsgZGl0ZW11a2FuPC90ZXh0Pgo8L3N2Zz4K';
                          }}
                        />
                      </div>
                    )}

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>ID Laporan: #{complaint.id}</p>
                      <p>Tanggal: {complaint.createdAt.toLocaleDateString('id-ID')}</p>
                      <p>Status: {complaint.isAnonymous ? 'Anonim' : 'Terdaftar'}</p>
                    </div>

                    {complaint.status !== 'Selesai' && (
                      <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {complaint.status === 'Diterima' && (
                          <button
                            onClick={() => {
                              handleStatusUpdate(complaint.id, 'diproses');
                              setShowComplaintDetail(null);
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            Proses Laporan
                          </button>
                        )}
                        {complaint.status === 'Diproses' && (
                          <button
                            onClick={() => {
                              handleStatusUpdate(complaint.id, 'selesai');
                              setShowComplaintDetail(null);
                            }}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            Selesaikan Laporan
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;