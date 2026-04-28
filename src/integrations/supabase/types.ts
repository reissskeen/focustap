export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      course_notes: {
        Row: {
          content_json: Json | null
          course_id: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_json?: Json | null
          course_id: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_json?: Json | null
          course_id?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_waitlist: {
        Row: {
          course_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_waitlist_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          course_code: string | null
          created_at: string
          end_time: string | null
          id: string
          institution_id: string | null
          instructor_name: string | null
          lms_course_id: string | null
          meeting_days: string[] | null
          name: string
          room: string | null
          seat_layout: Json | null
          section: string | null
          semester_end: string | null
          semester_start: string | null
          start_time: string | null
          teacher_user_id: string
        }
        Insert: {
          course_code?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          institution_id?: string | null
          instructor_name?: string | null
          lms_course_id?: string | null
          meeting_days?: string[] | null
          name: string
          room?: string | null
          seat_layout?: Json | null
          section?: string | null
          semester_end?: string | null
          semester_start?: string | null
          start_time?: string | null
          teacher_user_id: string
        }
        Update: {
          course_code?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          institution_id?: string | null
          instructor_name?: string | null
          lms_course_id?: string | null
          meeting_days?: string[] | null
          name?: string
          room?: string | null
          seat_layout?: Json | null
          section?: string | null
          semester_end?: string | null
          semester_start?: string | null
          start_time?: string | null
          teacher_user_id?: string
        }
        Relationships: []
      }
      demo_seats: {
        Row: {
          created_at: string
          focus_seconds: number
          id: string
          joined_at: string
          last_ping: string | null
          seat_label: string
          session_id: string
          student_name: string | null
        }
        Insert: {
          created_at?: string
          focus_seconds?: number
          id?: string
          joined_at?: string
          last_ping?: string | null
          seat_label: string
          session_id: string
          student_name?: string | null
        }
        Update: {
          created_at?: string
          focus_seconds?: number
          id?: string
          joined_at?: string
          last_ping?: string | null
          seat_label?: string
          session_id?: string
          student_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_seats_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_assumptions: {
        Row: {
          data: Json
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          data: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      focus_events: {
        Row: {
          created_at: string
          duration_ms: number | null
          event_type: string
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          event_type: string
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          event_type?: string
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      note_docs: {
        Row: {
          content_json: Json | null
          created_at: string
          id: string
          session_id: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_json?: Json | null
          created_at?: string
          id?: string
          session_id: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_json?: Json | null
          created_at?: string
          id?: string
          session_id?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_docs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          consent_given_at: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          institution_id: string | null
          institution_role: string | null
          lms_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_given_at?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          institution_id?: string | null
          institution_role?: string | null
          lms_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_given_at?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          institution_id?: string | null
          institution_role?: string | null
          lms_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          name: string
          room_tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          room_tag: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          room_tag?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          course_id: string
          created_at: string
          created_by: string
          end_time: string | null
          id: string
          late_join_cutoff: string | null
          room_id: string | null
          start_time: string
          status: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by: string
          end_time?: string | null
          id?: string
          late_join_cutoff?: string | null
          room_id?: string | null
          start_time?: string
          status?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string
          end_time?: string | null
          id?: string
          late_join_cutoff?: string | null
          room_id?: string | null
          start_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      student_sessions: {
        Row: {
          focus_score: number | null
          focus_seconds: number
          id: string
          joined_at: string
          last_heartbeat: string | null
          note_save_count: number
          seat_label: string | null
          session_id: string
          submitted_at: string | null
          suspended_at: string | null
          user_id: string
        }
        Insert: {
          focus_score?: number | null
          focus_seconds?: number
          id?: string
          joined_at?: string
          last_heartbeat?: string | null
          note_save_count?: number
          seat_label?: string | null
          session_id: string
          submitted_at?: string | null
          suspended_at?: string | null
          user_id: string
        }
        Update: {
          focus_score?: number | null
          focus_seconds?: number
          id?: string
          joined_at?: string
          last_heartbeat?: string | null
          note_save_count?: number
          seat_label?: string | null
          session_id?: string
          submitted_at?: string | null
          suspended_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "teacher", "admin"],
    },
  },
} as const
