import React, { useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  FileText, 
  Camera, 
  Eye, 
  EyeOff,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const SpeakUpCorner: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    type: 'Fasilitas',
    content: '',
    isAnonymous: false,
    imageFile: null as File | null
  });

  const { complaints, addComplaint } = useData();
  const { user, updatePoints, addBadge } = useAuth();

  const complaintTypes = ['Fasilitas', 'Bullying', 'Guru', 'Kegiatan', 'Lainnya'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addComplaint({
      type: formData.type,
      content: formData.content,
      isAnonymous: formData.isAnonymous,
      status: 'Diterima',
      authorId: formData.isAnonymous ? undefined : user?.id,
      imageFile: formData.imageFile
    });

    // Reward points for reporting
    updatePoints(10);
    
    // Check for badge achievement
    const userComplaints = complaints.filter(c => c.authorId === user?.id);
    if (userComplaints.length >= 3) {
      addBadge('Reporter Hebat');
    }

    setFormData({
      type: 'Fasilitas',
      content: '',
      isAnonymous: false,
      imageFile: null
    });
    setShowForm(false);
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (filterStatus === 'all') return true;
    return complaint.status === filterStatus;
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
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center">
              <MessageSquare className="mr-3" size={32} />
              Speak Up Corner
            </h1>
            <p className="text-lg opacity-90 mb-2">
              Tempat aman untuk menyuarakan keluhanmu
            </p>
            <p className="text-sm opacity-75">
              Laporkan dengan aman, anonim atau terbuka. Suaramu penting untuk kemajuan sekolah!
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-xl flex items-center space-x-2 transition-all backdrop-blur-sm"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Buat Laporan</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {complaints.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Laporan
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {complaints.filter(c => c.status === 'Diterima').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Menunggu
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {complaints.filter(c => c.status === 'Diproses').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Diproses
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {complaints.filter(c => c.status === 'Selesai').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Selesai
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Daftar Laporan
        </h2>
        <div className="flex items-center space-x-3">
          <Filter className="text-gray-600 dark:text-gray-400" size={20} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Semua Status</option>
            <option value="Diterima">Diterima</option>
            <option value="Diproses">Diproses</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="grid gap-4">
        {filteredComplaints.map((complaint) => (
          <div key={complaint.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="text-white" size={20} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-lg text-xs font-medium">
                      {complaint.type}
                    </span>
                    {complaint.isAnonymous && (
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-lg text-xs font-medium flex items-center">
                        <EyeOff size={12} className="mr-1" />
                        Anonim
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {complaint.createdAt.toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(complaint.status)}`}>
                {getStatusIcon(complaint.status)}
                <span>{complaint.status}</span>
              </div>
            </div>
            
            <p className="text-gray-900 dark:text-white mb-4">
              {complaint.content}
            </p>
            
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                ID: #{complaint.id}
              </span>
              <span>
                Dilaporkan oleh: {complaint.isAnonymous ? 'Anonim' : 'Pengguna Terdaftar'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Complaint Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Buat Laporan Baru
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jenis Pengaduan
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  {complaintTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Isi Laporan *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={5}
                  placeholder="Jelaskan keluhan atau masalah yang ingin kamu laporkan..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bukti Gambar *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData(prev => ({ ...prev, imageFile: e.target.files?.[0] || null }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Upload gambar sebagai bukti pengaduan (JPG, PNG, max 5MB)
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="anonymous" className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                  <EyeOff size={16} className="mr-2" />
                  Kirim sebagai laporan anonim
                </label>
              </div>

              <div className="flex items-center space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  Kirim Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeakUpCorner;