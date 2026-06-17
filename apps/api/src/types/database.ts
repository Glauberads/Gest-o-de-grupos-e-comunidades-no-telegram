export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      communities: {
        Row: {
          auto_approve_enabled: boolean;
          created_at: string;
          description: string | null;
          expiry_warning_days: number;
          id: string;
          image_url: string | null;
          name: string;
          organization_id: string;
          public_slug: string;
          public_url: string | null;
          remove_after_overdue_days: number;
          status: string;
          updated_at: string;
          welcome_message: string | null;
        };
        Insert: {
          auto_approve_enabled?: boolean;
          description?: string | null;
          expiry_warning_days?: number;
          image_url?: string | null;
          name: string;
          organization_id: string;
          public_slug: string;
          public_url?: string | null;
          remove_after_overdue_days?: number;
          status?: string;
          welcome_message?: string | null;
        };
        Update: {
          auto_approve_enabled?: boolean;
          description?: string | null;
          expiry_warning_days?: number;
          id?: string;
          image_url?: string | null;
          name?: string;
          organization_id?: string;
          public_slug?: string;
          public_url?: string | null;
          remove_after_overdue_days?: number;
          status?: string;
          updated_at?: string;
          welcome_message?: string | null;
        };
        Relationships: [];
      };
      organization_users: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          organization_id: string;
          role?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          owner_user_id: string;
          slug: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          owner_user_id: string;
          slug: string;
          status?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_user_id?: string;
          slug?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          billing_interval: string;
          community_id: string;
          created_at: string;
          description: string | null;
          duration_days: number | null;
          id: string;
          is_recurring: boolean;
          name: string;
          organization_id: string;
          price_cents: number;
          status: string;
          updated_at: string;
        };
        Insert: {
          billing_interval: string;
          community_id: string;
          description?: string | null;
          duration_days?: number | null;
          is_recurring?: boolean;
          name: string;
          organization_id: string;
          price_cents: number;
          status?: string;
        };
        Update: {
          billing_interval?: string;
          community_id?: string;
          description?: string | null;
          duration_days?: number | null;
          id?: string;
          is_recurring?: boolean;
          name?: string;
          organization_id?: string;
          price_cents?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      telegram_chats: {
        Row: {
          bot_is_admin: boolean;
          can_invite_users: boolean;
          can_restrict_members: boolean;
          chat_type: string;
          community_id: string;
          created_at: string;
          id: string;
          organization_id: string;
          telegram_chat_id: string;
          title: string | null;
          updated_at: string;
          webhook_secret: string | null;
        };
        Insert: {
          bot_is_admin?: boolean;
          can_invite_users?: boolean;
          can_restrict_members?: boolean;
          chat_type?: string;
          community_id: string;
          organization_id: string;
          telegram_chat_id: string;
          title?: string | null;
          webhook_secret?: string | null;
        };
        Update: {
          bot_is_admin?: boolean;
          can_invite_users?: boolean;
          can_restrict_members?: boolean;
          chat_type?: string;
          community_id?: string;
          id?: string;
          organization_id?: string;
          telegram_chat_id?: string;
          title?: string | null;
          updated_at?: string;
          webhook_secret?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          password_hash: string;
          updated_at: string;
        };
        Insert: {
          email: string;
          full_name: string;
          id: string;
          password_hash: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          id?: string;
          password_hash?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
  };
};
