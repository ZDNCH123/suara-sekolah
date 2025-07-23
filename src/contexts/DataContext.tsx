import React, { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

export interface Complaint {
  id: string;
  type: string;
  content: string;
  isAnonymous: boolean;
  status: 'Diterima' | 'Diproses' | 'Selesai';
  createdAt: Date;
  authorId?: string;
  imageFile?: File | null;
  bukti_url?: string;
}

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  type: 'Artikel' | 'Video' | 'Meme' | 'Pengumuman';
  authorId: string;
  authorName: string;
  createdAt: Date;
  likes: number;
  comments: Comment[];
  media?: string[];
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
  chatId: string;
}

export interface Chat {
  id: string;
  name: string;
  type: 'private' | 'group';
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface Schedule {
  id: string;
  kelas: string;
  mata_pelajaran: string;
  guru: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan?: string;
}

interface DataContextType {
  complaints: Complaint[];
  newsPosts: NewsPost[];
  chats: Chat[];
  messages: ChatMessage[];
  schedules: Schedule[];
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt' | 'bukti_url'>) => void;
  updateComplaintStatus: (id: string, status: Complaint['status']) => void;
  addNewsPost: (post: Omit<NewsPost, 'id' | 'createdAt' | 'likes' | 'comments'>) => void;
  likePost: (postId: string) => void;
  addComment: (postId: string, content: string, authorId: string, authorName: string) => void;
  sendMessage: (chatId: string, content: string, senderId: string, senderName: string) => void;
  markChatAsRead: (chatId: string) => void;
  createPrivateChat: (userId1: string, userId2: string, userName2: string) => Promise<string | null>;
  createGroupChat: (groupName: string, creatorId: string, memberIds: string[]) => Promise<string | null>;
  loadAllUsers: () => Promise<any[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const { user } = useAuth();

  // Load data when user changes
  React.useEffect(() => {
    if (user) {
      loadComplaints();
      loadNewsPosts();
      loadChats();
      loadMessages();
      loadSchedules();
      
      // Set up real-time subscriptions
      setupRealtimeSubscriptions();
    }
  }, [user]);

  const setupRealtimeSubscriptions = () => {

    // Subscribe to pengaduan changes
    const pengaduanChannel = supabase
      .channel('pengaduan-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pengaduan'
      }, () => {
        loadComplaints();
      })
      .subscribe();

    // Subscribe to berita changes
    const beritaChannel = supabase
      .channel('berita-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'berita'
      }, () => {
        loadNewsPosts();
      })
      .subscribe();

    // Subscribe to chat messages
    const chatChannel = supabase
      .channel('chat-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_message'
      }, () => {
        loadMessages();
        loadChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(pengaduanChannel);
      supabase.removeChannel(beritaChannel);
      supabase.removeChannel(chatChannel);
    };
  };

  const loadComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('pengaduan')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedComplaints: Complaint[] = data?.map(item => ({
        id: item.id,
        type: item.jenis_pengaduan,
        content: item.isi_pengaduan,
        isAnonymous: !item.user_id,
        status: item.status === 'diterima' ? 'Diterima' : 
               item.status === 'diproses' ? 'Diproses' : 'Selesai',
        createdAt: new Date(item.created_at),
        authorId: item.user_id || undefined,
        bukti_url: item.bukti_url
      })) || [];

      setComplaints(formattedComplaints);
    } catch (error) {
      console.error('Error loading complaints:', error);
    }
  };

  const loadNewsPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('berita')
        .select(`
          *,
          users!berita_author_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts: NewsPost[] = data?.map(item => ({
        id: item.id,
        title: item.judul,
        content: item.isi,
        type: item.kategori === 'event' ? 'Artikel' :
              item.kategori === 'pengumuman' ? 'Pengumuman' :
              item.kategori === 'prestasi' ? 'Artikel' : 'Meme',
        authorId: item.author_id,
        authorName: item.users?.name || 'Unknown',
        createdAt: new Date(item.created_at),
        likes: 0, // TODO: Implement likes system
        comments: [], // TODO: Implement comments system
        media: item.gambar_url ? [item.gambar_url] : undefined
      })) || [];

      setNewsPosts(formattedPosts);
    } catch (error) {
      console.error('Error loading news posts:', error);
    }
  };

  const loadChats = async () => {
    try {
      if (!user) return;

      // Load group chats
      const { data, error } = await supabase
        .from('chat_group')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupChats: Chat[] = data?.map(item => ({
        id: item.id,
        name: item.group_name,
        type: 'group',
        participants: [item.created_by], // TODO: Implement proper participants
        unreadCount: 0 // TODO: Implement unread count
      })) || [];

      // Load private chats from messages
      const { data: messageData, error: messageError } = await supabase
        .from('chat_message')
        .select(`
          *,
          sender:users!chat_message_sender_id_fkey(id, name, display_id),
          receiver:users!chat_message_receiver_id_fkey(id, name, display_id)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .not('receiver_id', 'is', null)
        .order('created_at', { ascending: false });

      if (messageError) throw messageError;

      // Group messages by chat partner
      const privateChatMap = new Map<string, Chat>();
      
      messageData?.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const partnerName = msg.sender_id === user.id ? msg.receiver?.name : msg.sender?.name;
        
        if (!partnerId || !partnerName) return;
        
        const chatId = `private_${[user.id, partnerId].sort().join('_')}`;
        
        if (!privateChatMap.has(chatId)) {
          privateChatMap.set(chatId, {
            id: chatId,
            name: partnerName,
            type: 'private',
            participants: [user.id, partnerId],
            unreadCount: 0,
            lastMessage: {
              id: msg.id,
              senderId: msg.sender_id,
              senderName: msg.sender?.name || 'Unknown',
              content: msg.message,
              createdAt: new Date(msg.created_at),
              chatId: chatId
            }
          });
        }
      });

      const privateChats = Array.from(privateChatMap.values());
      setChats([...groupChats, ...privateChats]);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadMessages = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_message')
        .select(`
          *,
          sender:users!chat_message_sender_id_fkey(name),
          receiver:users!chat_message_receiver_id_fkey(name)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id},group_id.not.is.null`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: ChatMessage[] = data?.map(item => ({
        id: item.id,
        senderId: item.sender_id,
        senderName: item.sender?.name || 'Unknown',
        content: item.message,
        createdAt: new Date(item.created_at),
        chatId: item.group_id || `private_${[item.sender_id, item.receiver_id].sort().join('_')}`
      })) || [];

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('hari', { ascending: true })
        .order('jam_mulai', { ascending: true });

      if (error) throw error;

      const formattedSchedules: Schedule[] = data?.map(item => ({
        id: item.id,
        kelas: item.kelas,
        mata_pelajaran: item.mata_pelajaran,
        guru: item.guru,
        hari: item.hari,
        jam_mulai: item.jam_mulai,
        jam_selesai: item.jam_selesai,
        ruangan: item.ruangan
      })) || [];

      setSchedules(formattedSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role, kelas, display_id')
        .neq('id', user?.id); // Exclude current user

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  };

  const addComplaint = async (complaint: Omit<Complaint, 'id' | 'createdAt' | 'bukti_url'>) => {
    try {
      // For now, skip image upload and just save the complaint
      const bukti_url = complaint.imageFile ? 'placeholder-image-url' : null;

      const { data, error } = await supabase
        .from('pengaduan')
        .insert({
          user_id: complaint.isAnonymous ? null : user?.id,
          jenis_pengaduan: complaint.type,
          isi_pengaduan: complaint.content,
          bukti_url,
          status: 'diterima'
        })
        .select()
        .single();

      if (error) throw error;

      const newComplaint: Complaint = {
        id: data.id,
        type: data.jenis_pengaduan,
        content: data.isi_pengaduan,
        isAnonymous: !data.user_id,
        status: 'Diterima',
        createdAt: new Date(data.created_at),
        authorId: data.user_id || undefined,
        bukti_url: data.bukti_url
      };

      setComplaints(prev => [newComplaint, ...prev]);

      // Update leaderboard
      if (user && !complaint.isAnonymous) {
        await supabase.rpc('increment_pengaduan_count', { user_id: user.id });
      }

    } catch (error) {
      console.error('Error adding complaint:', error);
      throw error; // Re-throw to allow UI to handle the error
    }
  };

  const updateComplaintStatus = async (id: string, status: Complaint['status']) => {
    try {
      const dbStatus = status === 'Diterima' ? 'diterima' : 
                     status === 'Diproses' ? 'diproses' : 'selesai';

      const { error } = await supabase
        .from('pengaduan')
        .update({ status: dbStatus })
        .eq('id', id);

      if (error) throw error;

      setComplaints(prev => 
        prev.map(complaint => 
          complaint.id === id ? { ...complaint, status } : complaint
        )
      );
    } catch (error) {
      console.error('Error updating complaint status:', error);
    }
  };

  const addNewsPost = async (post: Omit<NewsPost, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
    if (!user) return;

    try {
      const kategori = post.type === 'Artikel' ? 'event' :
                     post.type === 'Pengumuman' ? 'pengumuman' :
                     post.type === 'Meme' ? 'meme' : 'event';

      const { data, error } = await supabase
        .from('berita')
        .insert({
          judul: post.title,
          isi: post.content,
          kategori,
          author_id: user.id,
          gambar_url: post.media?.[0] || null
        })
        .select()
        .single();

      if (error) throw error;

      const newPost: NewsPost = {
        id: data.id,
        title: data.judul,
        content: data.isi,
        type: post.type,
        authorId: data.author_id,
        authorName: user.name,
        createdAt: new Date(data.created_at),
        likes: 0,
        comments: [],
        media: data.gambar_url ? [data.gambar_url] : undefined
      };

      setNewsPosts(prev => [newPost, ...prev]);

      // Update leaderboard
      await supabase.rpc('increment_berita_count', { user_id: user.id });

    } catch (error) {
      console.error('Error adding news post:', error);
    }
  };

  const likePost = (postId: string) => {
    // TODO: Implement likes in database
    setNewsPosts(prev =>
      prev.map(post =>
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      )
    );
  };

  const addComment = (postId: string, content: string, authorId: string, authorName: string) => {
    // TODO: Implement comments in database
    const newComment: Comment = {
      id: Date.now().toString(),
      authorId,
      authorName,
      content,
      createdAt: new Date()
    };

    setNewsPosts(prev =>
      prev.map(post =>
        post.id === postId 
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
    );
  };

  const sendMessage = async (chatId: string, content: string, senderId: string, senderName: string) => {
    if (!user) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId,
      senderName,
      content,
      createdAt: new Date(),
      chatId
    };

    try {
      let insertData: any = {
        sender_id: senderId,
        message: content
      };

      if (chatId.startsWith('private_')) {
        // Extract receiver ID from private chat ID
        const participants = chatId.replace('private_', '').split('_');
        const receiverId = participants.find(id => id !== senderId);
        insertData.receiver_id = receiverId;
      } else {
        insertData.group_id = chatId;
      }

      await supabase
        .from('chat_message')
        .insert(insertData);
    } catch (error) {
      console.error('Error sending message:', error);
      return;
    }

    setMessages(prev => [...prev, newMessage]);
    
    // Update last message in chat
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? { 
              ...chat, 
              lastMessage: newMessage,
              unreadCount: senderId === user.id ? 0 : chat.unreadCount + 1
            }
          : chat
      )
    );
  };

  const markChatAsRead = (chatId: string) => {
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
  };

  const createPrivateChat = async (userId1: string, userId2: string, userName2: string): Promise<string | null> => {
    try {
      // Check if chat already exists
      const chatId = `private_${[userId1, userId2].sort().join('_')}`;
      const existingChatIndex = chats.findIndex(chat => 
        chat.id === chatId
      );

      if (existingChatIndex !== -1) {
        return chatId;
      }

      // Create new private chat by adding it to local state
      const newChat: Chat = {
        id: chatId,
        name: userName2,
        type: 'private',
        participants: [userId1, userId2],
        unreadCount: 0
      };

      setChats(prev => [newChat, ...prev]);
      return chatId;
    } catch (error) {
      console.error('Error creating private chat:', error);
      return null;
    }
  };

  const createGroupChat = async (groupName: string, creatorId: string, memberIds: string[]): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('chat_group')
        .insert({
          group_name: groupName,
          created_by: creatorId
        })
        .select()
        .single();

      if (error) throw error;

      const newChat: Chat = {
        id: data.id,
        name: groupName,
        type: 'group',
        participants: [creatorId, ...memberIds],
        unreadCount: 0
      };

      setChats(prev => [newChat, ...prev]);
      return data.id;
    } catch (error) {
      console.error('Error creating group chat:', error);
      return null;
    }
  };
  const value = {
    complaints,
    newsPosts,
    chats,
    messages,
    schedules,
    addComplaint,
    updateComplaintStatus,
    addNewsPost,
    likePost,
    addComment,
    sendMessage,
    markChatAsRead,
    createPrivateChat,
    createGroupChat,
    loadAllUsers
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};