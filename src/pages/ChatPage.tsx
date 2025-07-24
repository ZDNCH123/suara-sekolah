import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Halo! Saya adalah AI Konselor SMAN 1 Cibinong. Saya di sini untuk membantu Anda dengan berbagai masalah akademik, sosial, atau personal. Apa yang bisa saya bantu hari ini?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Log the conversation to database
      if (user) {
        await supabase.from('chat_ai_log').insert({
          user_id: user.id,
          prompt: inputMessage,
          response: 'Processing...'
        });
      }

      // Simulate AI response (replace with actual AI integration)
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: generateAIResponse(inputMessage),
          isUser: false,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);

        // Update the log with actual response
        if (user) {
          supabase.from('chat_ai_log')
            .update({ response: aiResponse.content })
            .eq('user_id', user.id)
            .eq('prompt', inputMessage);
        }
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const generateAIResponse = (prompt: string): string => {
    const responses = [
      'Terima kasih telah berbagi dengan saya. Saya memahami bahwa ini mungkin situasi yang menantang untuk Anda. Mari kita bahas lebih lanjut.',
      'Saya mendengar kekhawatiran Anda. Ini adalah hal yang wajar dirasakan oleh banyak siswa. Bagaimana perasaan Anda saat ini?',
      'Itu adalah langkah yang baik untuk mencari bantuan. Saya di sini untuk mendukung Anda. Apakah ada hal spesifik yang ingin Anda diskusikan?',
      'Saya memahami situasi Anda. Mari kita cari solusi bersama-sama. Apa yang menurut Anda bisa membantu dalam situasi ini?',
      'Terima kasih sudah mempercayai saya. Perasaan yang Anda alami sangat valid. Mari kita eksplorasi lebih dalam tentang hal ini.'
    ];

    // Simple keyword-based responses
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('stress') || lowerPrompt.includes('tertekan')) {
      return 'Saya memahami bahwa Anda sedang mengalami stress. Ini adalah respons normal terhadap tekanan. Mari kita bicarakan tentang strategi untuk mengelola stress ini. Apa yang biasanya membuat Anda merasa lebih tenang?';
    }
    
    if (lowerPrompt.includes('nilai') || lowerPrompt.includes('ujian')) {
      return 'Kekhawatiran tentang nilai dan ujian sangat umum dialami siswa. Ingatlah bahwa nilai bukan satu-satunya ukuran kemampuan Anda. Mari kita diskusikan strategi belajar yang efektif dan cara mengelola kecemasan ujian.';
    }
    
    if (lowerPrompt.includes('teman') || lowerPrompt.includes('sosial')) {
      return 'Hubungan sosial memang bisa menjadi tantangan. Setiap orang memiliki cara berbeda dalam berinteraksi. Mari kita bahas tentang cara membangun hubungan yang sehat dan mengatasi konflik dengan teman.';
    }
    
    if (lowerPrompt.includes('keluarga') || lowerPrompt.includes('orangtua')) {
      return 'Dinamika keluarga bisa kompleks, terutama di masa remaja. Komunikasi yang terbuka dan saling pengertian sangat penting. Bagaimana hubungan Anda dengan keluarga saat ini?';
    }

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">AI Konselor</h1>
            <p className="text-sm text-gray-500">SMAN 1 Cibinong</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.isUser
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-2">
                {!message.isUser && (
                  <Bot className="w-4 h-4 mt-1 text-blue-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.isUser ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {message.isUser && (
                  <User className="w-4 h-4 mt-1 text-blue-100 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-200">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-blue-500" />
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-500">AI sedang mengetik...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ketik pesan Anda di sini..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Tekan Enter untuk mengirim, Shift+Enter untuk baris baru
        </p>
      </div>
    </div>
  );
}