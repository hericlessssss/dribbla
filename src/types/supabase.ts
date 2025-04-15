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
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          role: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          role: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          role?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      championships: {
        Row: {
          id: string
          name: string
          category: string
          start_date: string
          end_date: string
          rules: string
          logo_url: string | null
          is_active: boolean | null
          organizer_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          start_date: string
          end_date: string
          rules: string
          logo_url?: string | null
          is_active?: boolean | null
          organizer_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          start_date?: string
          end_date?: string
          rules?: string
          logo_url?: string | null
          is_active?: boolean | null
          organizer_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          coach_name: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          championship_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          coach_name: string
          logo_url?: string | null
          primary_color: string
          secondary_color: string
          championship_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          coach_name?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          championship_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      players: {
        Row: {
          id: string
          name: string
          position: string
          birth_date: string
          jersey_number: number
          photo_url: string | null
          team_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          position: string
          birth_date: string
          jersey_number: number
          photo_url?: string | null
          team_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          position?: string
          birth_date?: string
          jersey_number?: number
          photo_url?: string | null
          team_id?: string | null
          created_at?: string | null
          updated_at?: string | null
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
  }
}