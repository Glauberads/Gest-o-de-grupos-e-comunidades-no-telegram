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
      organization_payments: {
        Row: {
          activation_source: string;
          amount_cents: number;
          asaas_customer_id: string | null;
          asaas_payment_id: string | null;
          billing_type: string;
          created_at: string;
          due_date: string | null;
          external_reference: string | null;
          id: string;
          invoice_url: string | null;
          organization_id: string;
          organization_subscription_id: string;
          notes: string | null;
          paid_at: string | null;
          pix_payload: string | null;
          pix_qr_code_image: string | null;
          platform_plan_id: string;
          raw_payload: Json;
          status: string;
          updated_at: string;
        };
        Insert: {
          activation_source?: string;
          amount_cents: number;
          asaas_customer_id?: string | null;
          asaas_payment_id?: string | null;
          billing_type?: string;
          due_date?: string | null;
          external_reference?: string | null;
          invoice_url?: string | null;
          organization_id: string;
          organization_subscription_id: string;
          notes?: string | null;
          paid_at?: string | null;
          pix_payload?: string | null;
          pix_qr_code_image?: string | null;
          platform_plan_id: string;
          raw_payload?: Json;
          status?: string;
        };
        Update: {
          activation_source?: string;
          amount_cents?: number;
          asaas_customer_id?: string | null;
          asaas_payment_id?: string | null;
          billing_type?: string;
          due_date?: string | null;
          external_reference?: string | null;
          id?: string;
          invoice_url?: string | null;
          organization_id?: string;
          organization_subscription_id?: string;
          notes?: string | null;
          paid_at?: string | null;
          pix_payload?: string | null;
          pix_qr_code_image?: string | null;
          platform_plan_id?: string;
          raw_payload?: Json;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_subscriptions: {
        Row: {
          activation_source: string;
          active_until: string | null;
          asaas_subscription_id: string | null;
          cancelled_at: string | null;
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          grace_period_ends_at: string | null;
          id: string;
          lifetime: boolean;
          metadata: Json;
          notes: string | null;
          organization_id: string;
          platform_plan_id: string;
          started_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          activation_source?: string;
          active_until?: string | null;
          asaas_subscription_id?: string | null;
          cancelled_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          grace_period_ends_at?: string | null;
          lifetime?: boolean;
          metadata?: Json;
          notes?: string | null;
          organization_id: string;
          platform_plan_id: string;
          started_at?: string | null;
          status?: string;
        };
        Update: {
          activation_source?: string;
          active_until?: string | null;
          asaas_subscription_id?: string | null;
          cancelled_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          grace_period_ends_at?: string | null;
          id?: string;
          lifetime?: boolean;
          metadata?: Json;
          notes?: string | null;
          organization_id?: string;
          platform_plan_id?: string;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
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
      platform_plans: {
        Row: {
          archived_at: string | null;
          billing_interval: string;
          code: string;
          created_at: string;
          description: string | null;
          features: Json;
          has_advanced_reports: boolean;
          has_ai_moderation: boolean;
          has_priority_support: boolean;
          id: string;
          is_featured: boolean;
          max_automations: number;
          max_communities: number;
          max_telegram_groups: number;
          name: string;
          price_cents: number;
          slug: string;
          sort_order: number;
          status: string;
          trial_days: number;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          billing_interval?: string;
          code: string;
          description?: string | null;
          features?: Json;
          has_advanced_reports?: boolean;
          has_ai_moderation?: boolean;
          has_priority_support?: boolean;
          is_featured?: boolean;
          max_automations?: number;
          max_communities?: number;
          max_telegram_groups?: number;
          name: string;
          price_cents: number;
          slug: string;
          sort_order?: number;
          status?: string;
          trial_days?: number;
        };
        Update: {
          archived_at?: string | null;
          billing_interval?: string;
          code?: string;
          description?: string | null;
          features?: Json;
          has_advanced_reports?: boolean;
          has_ai_moderation?: boolean;
          has_priority_support?: boolean;
          id?: string;
          is_featured?: boolean;
          max_automations?: number;
          max_communities?: number;
          max_telegram_groups?: number;
          name?: string;
          price_cents?: number;
          slug?: string;
          sort_order?: number;
          status?: string;
          trial_days?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          action: string;
          admin_user_id: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          new_value: Json | null;
          old_value: Json | null;
        };
        Insert: {
          action: string;
          admin_user_id: string;
          entity_id: string;
          entity_type: string;
          new_value?: Json | null;
          old_value?: Json | null;
        };
        Update: {
          action?: string;
          admin_user_id?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          new_value?: Json | null;
          old_value?: Json | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_email: string | null;
          actor_id: string | null;
          actor_type: string;
          category: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          ip_address: string | null;
          message: string;
          metadata: Json;
          organization_id: string | null;
          request_id: string | null;
          severity: string;
          status: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          actor_email?: string | null;
          actor_id?: string | null;
          actor_type: string;
          category: string;
          entity_id?: string | null;
          entity_type?: string | null;
          ip_address?: string | null;
          message: string;
          metadata?: Json;
          organization_id?: string | null;
          request_id?: string | null;
          severity?: string;
          status?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          actor_email?: string | null;
          actor_id?: string | null;
          actor_type?: string;
          category?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip_address?: string | null;
          message?: string;
          metadata?: Json;
          organization_id?: string | null;
          request_id?: string | null;
          severity?: string;
          status?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      subscription_audit_logs: {
        Row: {
          action: string;
          admin_user_id: string;
          created_at: string;
          id: string;
          new_status: string | null;
          notes: string | null;
          old_status: string | null;
          organization_id: string;
        };
        Insert: {
          action: string;
          admin_user_id: string;
          new_status?: string | null;
          notes?: string | null;
          old_status?: string | null;
          organization_id: string;
        };
        Update: {
          action?: string;
          admin_user_id?: string;
          created_at?: string;
          id?: string;
          new_status?: string | null;
          notes?: string | null;
          old_status?: string | null;
          organization_id?: string;
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
      telegram_bots: {
        Row: {
          created_at: string;
          encrypted_token: string;
          id: string;
          is_active: boolean;
          last_validated_at: string | null;
          name: string | null;
          organization_id: string;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          encrypted_token: string;
          is_active?: boolean;
          last_validated_at?: string | null;
          name?: string | null;
          organization_id: string;
          username?: string | null;
        };
        Update: {
          encrypted_token?: string;
          id?: string;
          is_active?: boolean;
          last_validated_at?: string | null;
          name?: string | null;
          organization_id?: string;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      telegram_groups: {
        Row: {
          auto_approve_enabled: boolean;
          chat_type: string;
          community_id: string | null;
          created_at: string;
          id: string;
          organization_id: string;
          telegram_bot_id: string | null;
          telegram_chat_id: string;
          title: string | null;
          updated_at: string;
          welcome_message: string | null;
        };
        Insert: {
          auto_approve_enabled?: boolean;
          chat_type?: string;
          community_id?: string | null;
          organization_id: string;
          telegram_bot_id?: string | null;
          telegram_chat_id: string;
          title?: string | null;
          welcome_message?: string | null;
        };
        Update: {
          auto_approve_enabled?: boolean;
          chat_type?: string;
          community_id?: string | null;
          id?: string;
          organization_id?: string;
          telegram_bot_id?: string | null;
          telegram_chat_id?: string;
          title?: string | null;
          updated_at?: string;
          welcome_message?: string | null;
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
