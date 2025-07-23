import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Heart, Lightbulb, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const AIConselor: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Halo! Aku AI Konselor SuaraSekolah 🤖✨ Aku di sini buat ngedengerin kamu dan ngasih saran yang helpful. Mau curhat apa hari ini?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, updatePoints } = useAuth();

  const suggestedPrompts = [
    'Gimana cara ngatasin rasa malas belajar?',
    'Aku lagi stress karena tugas, harus gimana?',
    'Kenapa sekolah itu penting sih?',
    'Tips buat lebih percaya diri di kelas',
    'Cara mengatasi masalah dengan teman'
  ];

  const aiResponses = {
    'malas belajar': 'Wah, malas belajar itu normal banget kok! 😅 Coba deh bikin jadwal belajar yang fun, kasih reward kecil buat diri sendiri setelah belajar, atau cari study buddy yang bisa bikin semangat. Yang penting jangan terlalu keras sama diri sendiri ya!',
    'stress': 'Hey, stress itu wajar banget di masa sekolah! 💪 Coba ambil napas dalam-dalam, break sejenak dari tugas, atau ngobrol sama teman/keluarga. Ingat, kamu lebih kuat dari yang kamu kira. One step at a time ya! 🌟',
    'sekolah penting': 'Sekolah itu kayak training ground buat hidup! 🚀 Selain dapet ilmu, kamu juga belajar cara bersosialisasi, problem solving, dan discover passion kamu. Plus, networking dengan teman-teman bisa jadi valuable banget di masa depan!',
    'percaya diri': 'Confidence itu bisa dilatih! 💫 Mulai dari hal kecil: berpartisipasi di kelas, ngobrol sama teman baru, atau join kegiatan yang kamu suka. Remember, everyone started somewhere. Kamu punya unique value yang ga dimiliki orang lain!',
    'masalah teman': 'Friendship drama memang tricky! 🤝 Yang penting komunikasi yang jujur tapi tetap respek. Kalau ada misunderstanding, coba clear things up face to face. Dan ingat, ga semua orang harus jadi bestie - yang penting mutual respect!',
    'default': 'That\'s interesting! 🤔 Cerita lebih detail dong, biar aku bisa kasih saran yang lebih specific. Aku di sini buat dengerin dan bantu kamu find the best solution! ✨'
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('malas') || lowerMessage.includes('belajar')) {
      return aiResponses['malas belajar'];
    } else if (lowerMessage.includes('stress') || lowerMessage.includes('tugas') || lowerMessage.includes('tekanan')) {
      return aiResponses['stress'];
    } else if (lowerMessage.includes('sekolah') && lowerMessage.includes('penting')) {
      return aiResponses['sekolah penting'];
    } else if (lowerMessage.includes('percaya diri') || lowerMessage.includes('confidence') || lowerMessage.includes('minder')) {
      return aiResponses['percaya diri'];
    } else if (lowerMessage.includes('teman') || lowerMessage.includes('friend') || lowerMessage.includes('masalah sosial')) {
      return aiResponses['masalah teman'];
    } else {
      return aiResponses['default'];
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Reward points for using AI counselor
    updatePoints(3);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(inputMessage),
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handlePromptClick = (prompt: string) => {
    setInputMessage(prompt);
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center">
              <Bot className="mr-3" size={32} />
              AI Konselor Virtual
            </h1>
            <p className="text-lg opacity-90 mb-2">
              Your friendly AI buddy yang siap dengerin dan ngasih saran!
            </p>
            <p className="text-sm opacity-75">
              Chat aman, judgment-free zone. Curhat sepuasnya! 🤗
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles size={64} className="opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.isUser 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                    : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                }`}>
                  {message.isUser ? (
                    <span className="text-white font-semibold text-sm">
                      {user?.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <Bot className="text-white" size={20} />
                  )}
                </div>
                <div className={`rounded-2xl p-4 ${
                  message.isUser
                    ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.isUser ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-xs lg:max-w-md">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="text-white" size={20} />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {messages.length === 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              💡 Coba tanya ini:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt)}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ketik pesan kamu di sini..."
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <Heart className="text-red-500" size={16} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Safe Space</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Semua yang kamu share di sini aman dan private
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <Lightbulb className="text-yellow-500" size={16} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Smart Tips</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            AI yang dilatih khusus untuk masalah siswa
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="text-green-500" size={16} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">24/7 Available</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Kapan aja butuh, AI Konselor siap membantu
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIConselor;