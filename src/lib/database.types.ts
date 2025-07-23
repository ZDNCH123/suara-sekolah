export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nik_nis: string
          display_id: string
          name: string
          role: 'siswa' | 'guru' | 'osis' | 'admin'
          password_hash: string
          kelas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nik_nis: string
          display_id?: string
          name: string
          role: 'siswa' | 'guru' | 'osis' | 'admin'
          password_hash: string
          kelas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nik_nis?: string
          display_id?: string
          name?: string
          role?: 'siswa' | 'guru' | 'osis' | 'admin'
          password_hash?: string
          kelas?: string | null
          created_at?: string
        }
      }
      pengaduan: {
        Row: {
          id: string
          user_id: string | null
          jenis_pengaduan: string
          isi_pengaduan: string
          bukti_url: string | null
          status: 'diterima' | 'diproses' | 'selesai'
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          jenis_pengaduan: string
          isi_pengaduan: string
          bukti_url?: string | null
          status?: 'diterima' | 'diproses' | 'selesai'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          jenis_pengaduan?: string
          isi_pengaduan?: string
          bukti_url?: string | null
          status?: 'diterima' | 'diproses' | 'selesai'
          created_at?: string
        }
      }
      berita: {
        Row: {
          id: string
          judul: string
          isi: string
          kategori: 'event' | 'pengumuman' | 'prestasi' | 'meme'
          author_id: string
          gambar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          judul: string
          isi: string
          kategori: 'event' | 'pengumuman' | 'prestasi' | 'meme'
          author_id: string
          gambar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          judul?: string
          isi?: string
          kategori?: 'event' | 'pengumuman' | 'prestasi' | 'meme'
          author_id?: string
          gambar_url?: string | null
          created_at?: string
        }
      }
      chat_ai_log: {
        Row: {
          id: string
          user_id: string
          prompt: string
          response: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          response: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string
          response?: string
          created_at?: string
        }
      }
      chat_message: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string | null
          group_id: string | null
          message: string
          attachment_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id?: string | null
          group_id?: string | null
          message: string
          attachment_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string | null
          group_id?: string | null
          message?: string
          attachment_url?: string | null
          created_at?: string
        }
      }
      chat_group: {
        Row: {
          id: string
          group_name: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          group_name: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          group_name?: string
          created_by?: string
          created_at?: string
        }
      }
      leaderboard: {
        Row: {
          user_id: string
          total_berita: number
          total_pengaduan: number
          points: number
        }
        Insert: {
          user_id: string
          total_berita?: number
          total_pengaduan?: number
          points?: number
        }
        Update: {
          user_id?: string
          total_berita?: number
          total_pengaduan?: number
          points?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}