import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, Plus, Search, X, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    chats, 
    messages, 
    sendMessage, 
    markChatAsRead, 
    createPrivateChat, 
    createGroupChat,
    loadAllUsers 
  } = useData();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedChatId]);

  useEffect(() => {
    if (showNewChatModal || showGroupModal) {
      loadUsers();
    }
  }, [showNewChatModal, showGroupModal]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUsers = async () => {
    const users = await loadAllUsers();
    setAvailableUsers(users);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChatId || !user) return;

    await sendMessage(selectedChatId, messageInput, user.id, user.name);
    setMessageInput('');
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
    markChatAsRead(chatId);
  };

  const handleCreatePrivateChat = async (userId: string, userName: string) => {
    if (!user) return;
    
    const chatId = await createPrivateChat(user.id, userId, userName);
    if (chatId) {
      setSelectedChatId(chatId);
      setShowNewChatModal(false);
    }
  };

  const handleCreateGroupChat = async () => {
    if (!user || !groupName.trim() || selectedUsers.length === 0) return;

    const chatId = await createGroupChat(groupName, user.id, selectedUsers);
    if (chatId) {
      setSelectedChatId(chatId);
      setShowGroupModal(false);
      setGroupName('');
      setSelectedUsers([]);
    }
  };

  const selectedChat = chats.find(chat => chat.id === selectedChatId);
  const chatMessages = messages.filter(msg => msg.chatId === selectedChatId);

  const filteredUsers = availableUsers.filter(u => 
    u.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.display_id.toLowerCase().includes(searchUsers.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center">
              <MessageCircle className="mr-3" size={32} />
              Chat & Komunikasi
            </h1>
            <p className="text-lg opacity-90">
              Terhubung dengan teman dan guru menggunakan ID
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNewChatModal(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-xl flex items-center space-x-2 transition-all backdrop-blur-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Chat Baru</span>
            </button>
            <button
              onClick={() => setShowGroupModal(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-xl flex items-center space-x-2 transition-all backdrop-blur-sm"
            >
              <Users size={16} />
              <span className="hidden sm:inline">Grup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold text-gray-900 dark:text-white">Chats</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageCircle className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Belum ada chat. Mulai chat baru!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleChatSelect(chat.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        selectedChatId === chat.id ? 'bg-purple-50 dark:bg-purple-900 border-r-4 border-purple-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          {chat.type === 'group' ? (
                            <Users className="text-white" size={16} />
                          ) : (
                            <span className="text-white font-semibold text-sm">
                              {chat.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {chat.name}
                            </h3>
                            {chat.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                          {chat.lastMessage && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {chat.lastMessage.senderName}: {chat.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                      {selectedChat.type === 'group' ? (
                        <Users className="text-white" size={16} />
                      ) : (
                        <span className="text-white font-semibold text-sm">
                          {selectedChat.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {selectedChat.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedChat.type === 'group' ? 'Grup Chat' : 'Chat Pribadi'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 dark:text-gray-400">
                        Belum ada pesan. Mulai percakapan!
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                          message.senderId === user?.id ? 'flex-row-reverse space-x-reverse' : ''
                        }`}>
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-xs">
                              {message.senderName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className={`rounded-2xl p-3 ${
                            message.senderId === user?.id
                              ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                            {selectedChat.type === 'group' && message.senderId !== user?.id && (
                              <p className={`text-xs font-medium mb-1 ${
                                message.senderId === user?.id ? 'text-purple-100' : 'text-purple-600 dark:text-purple-400'
                              }`}>
                                {message.senderName}
                              </p>
                            )}
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.senderId === user?.id ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {message.createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Ketik pesan..."
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                      className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="mx-auto text-gray-400 mb-4" size={64} />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Pilih Chat
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Pilih chat dari daftar atau buat chat baru
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Private Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Chat Baru
              </h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Cari berdasarkan nama atau ID..."
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleCreatePrivateChat(u.id, u.name)}
                  className="w-full flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {u.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {u.role} • ID: {u.display_id}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Group Chat Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Buat Grup Chat
              </h3>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setGroupName('');
                  setSelectedUsers([]);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                placeholder="Nama grup..."
              />
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="Cari anggota..."
                />
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Anggota terpilih ({selectedUsers.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(userId => {
                    const user = availableUsers.find(u => u.id === userId);
                    return user ? (
                      <span key={userId} className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-lg text-xs flex items-center space-x-1">
                        <span>{user.name}</span>
                        <button
                          onClick={() => setSelectedUsers(prev => prev.filter(id => id !== userId))}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    if (selectedUsers.includes(u.id)) {
                      setSelectedUsers(prev => prev.filter(id => id !== u.id));
                    } else {
                      setSelectedUsers(prev => [...prev, u.id]);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    selectedUsers.includes(u.id)
                      ? 'bg-purple-100 dark:bg-purple-900 border-2 border-purple-500'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {u.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {u.role} • ID: {u.display_id}
                    </p>
                  </div>
                  {selectedUsers.includes(u.id) && (
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleCreateGroupChat}
              disabled={!groupName.trim() || selectedUsers.length === 0}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buat Grup ({selectedUsers.length} anggota)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;