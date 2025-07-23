import React, { useState } from 'react';
import { 
  Newspaper, 
  Plus, 
  Heart, 
  MessageCircle, 
  Share2, 
  Image,
  Video,
  Smile,
  Send,
  Filter,
  TrendingUp
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const NewsPortal: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'Artikel' as 'Artikel' | 'Video' | 'Meme' | 'Pengumuman'
  });

  const { newsPosts, addNewsPost, likePost, addComment } = useData();
  const { user, updatePoints, addBadge } = useAuth();

  // Only admin can access this page
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Akses Terbatas
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Hanya admin yang dapat mengakses portal berita
          </p>
        </div>
      </div>
    );
  }

  const postTypes = ['Artikel', 'Video', 'Meme', 'Pengumuman'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    addNewsPost({
      title: formData.title,
      content: formData.content,
      type: formData.type,
      authorId: user?.id || '',
      authorName: user?.name || ''
    });

    // Reward points for posting
    updatePoints(15);
    
    // Check for badge achievement
    const userPosts = newsPosts.filter(p => p.authorId === user?.id);
    if (userPosts.length >= 5) {
      addBadge('Kontributor Aktif');
    }

    setFormData({
      title: '',
      content: '',
      type: 'Artikel'
    });
    setShowForm(false);
  };

  const handleLike = (postId: string) => {
    likePost(postId);
    updatePoints(1); // Small reward for engagement
  };

  const handleComment = (postId: string) => {
    const content = commentInputs[postId];
    if (content?.trim()) {
      addComment(postId, content, user?.id || '', user?.name || '');
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      updatePoints(2); // Reward for commenting
    }
  };

  const filteredPosts = newsPosts.filter(post => {
    if (filterType === 'all') return true;
    return post.type === filterType;
  });

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'Video':
        return <Video size={16} className="text-red-500" />;
      case 'Meme':
        return <Smile size={16} className="text-yellow-500" />;
      case 'Pengumuman':
        return <TrendingUp size={16} className="text-blue-500" />;
      default:
        return <Newspaper size={16} className="text-gray-500" />;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'Video':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Meme':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Pengumuman':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center">
              <Newspaper className="mr-3" size={32} />
              Portal Berita & Hiburan
            </h1>
            <p className="text-lg opacity-90 mb-2">
              Tempat berbagi berita, prestasi, dan momen seru sekolah
            </p>
            <p className="text-sm opacity-75">
              Share konten positif, dapet poin, dan jadi bagian dari komunitas sekolah yang keren!
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-xl flex items-center space-x-2 transition-all backdrop-blur-sm"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Buat Post</span>
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Feed Terbaru
        </h2>
        <div className="flex items-center space-x-3">
          <Filter className="text-gray-600 dark:text-gray-400" size={20} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Semua Konten</option>
            {postTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {filteredPosts.map((post) => (
          <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {post.authorName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {post.authorName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {post.createdAt.toLocaleDateString('id-ID')} • 
                    {post.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getPostTypeColor(post.type)}`}>
                {getPostTypeIcon(post.type)}
                <span>{post.type}</span>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {post.title}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* Post Actions */}
            <div className="flex items-center justify-between py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Heart size={20} className="fill-current" />
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors">
                  <MessageCircle size={20} />
                  <span>{post.comments.length}</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors">
                  <Share2 size={20} />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            {post.comments.length > 0 && (
              <div className="mt-4 space-y-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">
                          {comment.authorName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {comment.createdAt.toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Input */}
            <div className="mt-4 flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tulis komentar..."
                />
                <button
                  onClick={() => handleComment(post.id)}
                  className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Post Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Buat Post Baru
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
                  Jenis Konten
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  {postTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Judul
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Judul yang menarik..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Konten
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={5}
                  placeholder="Ceritakan berita atau momen seru di sekolah..."
                  required
                />
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all transform hover:scale-105"
                >
                  Posting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsPortal;