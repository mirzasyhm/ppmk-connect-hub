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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      broadcasts: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          image_url: string | null
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          image_url?: string | null
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string | null
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          admin_id: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_private: boolean | null
          member_count: number | null
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_private?: boolean | null
          member_count?: number | null
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_private?: boolean | null
          member_count?: number | null
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_events: {
        Row: {
          community_id: string
          created_at: string
          current_participants: number | null
          description: string
          end_date: string | null
          event_date: string
          id: string
          image_url: string | null
          location: string
          max_participants: number | null
          organizer_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          current_participants?: number | null
          description: string
          end_date?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          location: string
          max_participants?: number | null
          organizer_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          current_participants?: number | null
          description?: string
          end_date?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          location?: string
          max_participants?: number | null
          organizer_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_memberships: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          community_id: string
          content: string
          created_at: string
          id: string
          message_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          content: string
          created_at?: string
          id?: string
          message_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          community_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1: string
          participant_2: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1: string
          participant_2: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1?: string
          participant_2?: string
          updated_at?: string
        }
        Relationships: []
      }
      currency_exchanges: {
        Row: {
          created_at: string
          description: string | null
          exchange_rate: number | null
          have_amount: number
          have_currency: string
          id: string
          status: string
          updated_at: string
          user_id: string
          want_amount: number
          want_currency: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          exchange_rate?: number | null
          have_amount: number
          have_currency: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
          want_amount: number
          want_currency: string
        }
        Update: {
          created_at?: string
          description?: string | null
          exchange_rate?: number | null
          have_amount?: number
          have_currency?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
          want_amount?: number
          want_currency?: string
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          event_id: string
          id: string
          joined_at: string
          status: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          joined_at?: string
          status?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          joined_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string
          created_at: string
          current_participants: number | null
          description: string
          end_date: string | null
          event_date: string
          id: string
          image_url: string | null
          location: string
          max_participants: number | null
          organizer_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          current_participants?: number | null
          description: string
          end_date?: string | null
          event_date: string
          id?: string
          image_url?: string | null
          location: string
          max_participants?: number | null
          organizer_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_participants?: number | null
          description?: string
          end_date?: string | null
          event_date?: string
          id?: string
          image_url?: string | null
          location?: string
          max_participants?: number | null
          organizer_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      invited_credentials: {
        Row: {
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          password_hash: string
          role: Database["public"]["Enums"]["app_role"]
          used: boolean
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          password_hash: string
          role?: Database["public"]["Enums"]["app_role"]
          used?: boolean
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          password_hash?: string
          role?: Database["public"]["Enums"]["app_role"]
          used?: boolean
          used_at?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace: {
        Row: {
          category: string
          condition: string
          created_at: string
          currency: string
          description: string
          id: string
          image_url: string | null
          price: number
          seller_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          condition: string
          created_at?: string
          currency?: string
          description: string
          id?: string
          image_url?: string | null
          price: number
          seller_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          condition?: string
          created_at?: string
          currency?: string
          description?: string
          id?: string
          image_url?: string | null
          price?: number
          seller_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string
          read_at: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string
          read_at?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string
          read_at?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_korea: string | null
          address_malaysia: string | null
          allergy: string | null
          arc_number: string | null
          avatar_url: string | null
          bio: string | null
          blood_type: string | null
          born_place: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          identity_card_number: string | null
          marital_status: string | null
          medical_condition: string | null
          next_of_kin: string | null
          next_of_kin_contact_number: string | null
          next_of_kin_relationship: string | null
          passport_number: string | null
          race: string | null
          religion: string | null
          sponsorship: string | null
          sponsorship_address: string | null
          sponsorship_phone_number: string | null
          study_course: string | null
          study_end_date: string | null
          study_level: string | null
          study_start_date: string | null
          studying_place: string | null
          telephone_korea: string | null
          telephone_malaysia: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          address_korea?: string | null
          address_malaysia?: string | null
          allergy?: string | null
          arc_number?: string | null
          avatar_url?: string | null
          bio?: string | null
          blood_type?: string | null
          born_place?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          identity_card_number?: string | null
          marital_status?: string | null
          medical_condition?: string | null
          next_of_kin?: string | null
          next_of_kin_contact_number?: string | null
          next_of_kin_relationship?: string | null
          passport_number?: string | null
          race?: string | null
          religion?: string | null
          sponsorship?: string | null
          sponsorship_address?: string | null
          sponsorship_phone_number?: string | null
          study_course?: string | null
          study_end_date?: string | null
          study_level?: string | null
          study_start_date?: string | null
          studying_place?: string | null
          telephone_korea?: string | null
          telephone_malaysia?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          address_korea?: string | null
          address_malaysia?: string | null
          allergy?: string | null
          arc_number?: string | null
          avatar_url?: string | null
          bio?: string | null
          blood_type?: string | null
          born_place?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          identity_card_number?: string | null
          marital_status?: string | null
          medical_condition?: string | null
          next_of_kin?: string | null
          next_of_kin_contact_number?: string | null
          next_of_kin_relationship?: string | null
          passport_number?: string | null
          race?: string | null
          religion?: string | null
          sponsorship?: string | null
          sponsorship_address?: string | null
          sponsorship_phone_number?: string | null
          study_course?: string | null
          study_end_date?: string | null
          study_level?: string | null
          study_start_date?: string | null
          studying_place?: string | null
          telephone_korea?: string | null
          telephone_malaysia?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          status: string
          suggestion: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          status?: string
          suggestion?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          status?: string
          suggestion?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          broadcast_normal: boolean
          broadcast_urgent: boolean
          communities_general: boolean
          created_at: string
          events_new: boolean
          events_reminder_timing: string
          events_reminders: boolean
          id: string
          marketplace_currency: boolean
          marketplace_items: boolean
          messages_general: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          broadcast_normal?: boolean
          broadcast_urgent?: boolean
          communities_general?: boolean
          created_at?: string
          events_new?: boolean
          events_reminder_timing?: string
          events_reminders?: boolean
          id?: string
          marketplace_currency?: boolean
          marketplace_items?: boolean
          messages_general?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          broadcast_normal?: boolean
          broadcast_urgent?: boolean
          communities_general?: boolean
          created_at?: string
          events_new?: boolean
          events_reminder_timing?: string
          events_reminders?: boolean
          id?: string
          marketplace_currency?: boolean
          marketplace_items?: boolean
          messages_general?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "member" | "admin" | "superadmin"
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
      app_role: ["member", "admin", "superadmin"],
    },
  },
} as const
