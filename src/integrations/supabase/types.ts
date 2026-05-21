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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          link: string | null
          send_email: boolean | null
          sender_id: string
          target_audience: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          link?: string | null
          send_email?: boolean | null
          sender_id: string
          target_audience: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          link?: string | null
          send_email?: boolean | null
          sender_id?: string
          target_audience?: string
          title?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          sort_order: number
          starts_at: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          starts_at?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          starts_at?: string | null
          title?: string | null
        }
        Relationships: []
      }
      business_claims: {
        Row: {
          admin_note: string | null
          business_id: string
          cnpj: string | null
          cpf: string | null
          created_at: string
          email: string
          entity_type: Database["public"]["Enums"]["claim_entity_type"]
          full_name: string
          id: string
          legal_name: string | null
          message: string | null
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["claim_status"]
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          admin_note?: string | null
          business_id: string
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          entity_type: Database["public"]["Enums"]["claim_entity_type"]
          full_name: string
          id?: string
          legal_name?: string | null
          message?: string | null
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          admin_note?: string | null
          business_id?: string
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          entity_type?: Database["public"]["Enums"]["claim_entity_type"]
          full_name?: string
          id?: string
          legal_name?: string | null
          message?: string | null
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      business_followers: {
        Row: {
          business_id: string
          created_at: string
          follower_business_id: string | null
          follower_user_id: string | null
          id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          follower_business_id?: string | null
          follower_user_id?: string | null
          id?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          follower_business_id?: string | null
          follower_user_id?: string | null
          id?: string
        }
        Relationships: []
      }
      business_posts: {
        Row: {
          business_id: string
          caption: string | null
          created_at: string
          id: string
          image_url: string
          updated_at: string
        }
        Insert: {
          business_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_subcategories: {
        Row: {
          business_id: string
          created_at: string
          subcategory_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          subcategory_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_subcategories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_subcategories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          }
        ]
      }
      businesses: {
        Row: {
          address: string | null
          blocked_until: string | null
          category_id: string | null
          city: string | null
          cnpj: string | null
          cover_url: string | null
          cpf: string | null
          created_at: string
          description: string | null
          email: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          facebook: string | null
          gallery: Json
          google_place_id: string | null
          hours: Json
          id: string
          instagram: string | null
          is_featured: boolean
          is_platform: boolean
          is_verified: boolean
          lat: number | null
          legal_name: string | null
          lng: number | null
          logo_url: string | null
          migration_cnpj: string | null
          migration_legal_name: string | null
          migration_requested_at: string | null
          migration_status: string | null
          name: string
          neighborhood: string | null
          owner_id: string | null
          phone: string | null
          plan_id: string | null
          short_description: string | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["business_status"]
          subcategory_id: string | null
          threads: string | null
          tiktok: string | null
          updated_at: string
          username: string | null
          views_count: number
          whatsapp: string | null
          whatsapp_clicks: number
          youtube: string | null
        }
        Insert: {
          address?: string | null
          blocked_until?: string | null
          category_id?: string | null
          city?: string | null
          cnpj?: string | null
          cover_url?: string | null
          cpf?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          facebook?: string | null
          gallery?: Json
          google_place_id?: string | null
          hours?: Json
          id?: string
          instagram?: string | null
          is_featured?: boolean
          is_platform?: boolean
          is_verified?: boolean
          lat?: number | null
          legal_name?: string | null
          lng?: number | null
          logo_url?: string | null
          migration_cnpj?: string | null
          migration_legal_name?: string | null
          migration_requested_at?: string | null
          migration_status?: string | null
          name: string
          neighborhood?: string | null
          owner_id?: string | null
          phone?: string | null
          plan_id?: string | null
          short_description?: string | null
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          subcategory_id?: string | null
          threads?: string | null
          tiktok?: string | null
          updated_at?: string
          username?: string | null
          views_count?: number
          whatsapp?: string | null
          whatsapp_clicks?: number
          youtube?: string | null
        }
        Update: {
          address?: string | null
          blocked_until?: string | null
          category_id?: string | null
          city?: string | null
          cnpj?: string | null
          cover_url?: string | null
          cpf?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          facebook?: string | null
          gallery?: Json
          google_place_id?: string | null
          hours?: Json
          id?: string
          instagram?: string | null
          is_featured?: boolean
          is_platform?: boolean
          is_verified?: boolean
          lat?: number | null
          legal_name?: string | null
          lng?: number | null
          logo_url?: string | null
          migration_cnpj?: string | null
          migration_legal_name?: string | null
          migration_requested_at?: string | null
          migration_status?: string | null
          name?: string
          neighborhood?: string | null
          owner_id?: string | null
          phone?: string | null
          plan_id?: string | null
          short_description?: string | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["business_status"]
          subcategory_id?: string | null
          threads?: string | null
          tiktok?: string | null
          updated_at?: string
          username?: string | null
          views_count?: number
          whatsapp?: string | null
          whatsapp_clicks?: number
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      change_requests: {
        Row: {
          admin_note: string | null
          business_id: string | null
          changes: Json
          created_at: string
          id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["change_request_status"]
          target_type: Database["public"]["Enums"]["change_request_target"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          business_id?: string | null
          changes?: Json
          created_at?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["change_request_status"]
          target_type: Database["public"]["Enums"]["change_request_target"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          business_id?: string | null
          changes?: Json
          created_at?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["change_request_status"]
          target_type?: Database["public"]["Enums"]["change_request_target"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          business_id: string
          code: string
          created_at: string
          description: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_discount_value: number | null
          usage_count: number | null
          usage_limit: number
        }
        Insert: {
          business_id: string
          code: string
          created_at?: string
          description?: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_value?: number | null
          usage_count?: number | null
          usage_limit: number
        }
        Update: {
          business_id?: string
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_value?: number | null
          usage_count?: number | null
          usage_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          business_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          business_id: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          business_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          business_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          is_featured: boolean
          name: string
          price_cents: number
          slug: string
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          is_featured?: boolean
          name: string
          price_cents?: number
          slug: string
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          is_featured?: boolean
          name?: string
          price_cents?: number
          slug?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          is_required: boolean
          required_for: string[]
          slug: string
          sort_order: number
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          required_for?: string[]
          slug: string
          sort_order?: number
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_required?: boolean
          required_for?: string[]
          slug?: string
          sort_order?: number
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      policy_acceptances: {
        Row: {
          accepted_at: string
          business_id: string | null
          claim_id: string | null
          context: string
          id: string
          ip_address: string | null
          policy_id: string
          policy_slug: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          business_id?: string | null
          claim_id?: string | null
          context: string
          id?: string
          ip_address?: string | null
          policy_id: string
          policy_slug: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          business_id?: string | null
          claim_id?: string | null
          context?: string
          id?: string
          ip_address?: string | null
          policy_id?: string
          policy_slug?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_acceptances_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          as_business_id: string | null
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          as_business_id?: string | null
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          as_business_id?: string | null
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "business_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          as_business_id: string | null
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          as_business_id?: string | null
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          as_business_id?: string | null
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "business_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          blocked_until: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          profile_completed: boolean
          rg: string | null
          selfie_url: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          blocked_until?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          profile_completed?: boolean
          rg?: string | null
          selfie_url?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          blocked_until?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          profile_completed?: boolean
          rg?: string | null
          selfie_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          discount_percent: number | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          original_price_cents: number | null
          price_cents: number | null
          starts_at: string
          title: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          original_price_cents?: number | null
          price_cents?: number | null
          starts_at?: string
          title: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          original_price_cents?: number | null
          price_cents?: number | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      public_institutions: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          description: string | null
          email: string | null
          hours: Json
          id: string
          image_url: string | null
          is_active: boolean
          kind: Database["public"]["Enums"]["institution_kind"]
          lat: number | null
          lng: number | null
          name: string
          neighborhood: string | null
          phone: string | null
          sort_order: number
          state: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: Database["public"]["Enums"]["institution_kind"]
          lat?: number | null
          lng?: number | null
          name: string
          neighborhood?: string | null
          phone?: string | null
          sort_order?: number
          state?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: Json
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: Database["public"]["Enums"]["institution_kind"]
          lat?: number | null
          lng?: number | null
          name?: string
          neighborhood?: string | null
          phone?: string | null
          sort_order?: number
          state?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          admin_note: string | null
          as_business_id: string | null
          business_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["review_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          as_business_id?: string | null
          business_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          as_business_id?: string | null
          business_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_coupons: {
        Row: {
          claimed_at: string
          coupon_id: string
          id: string
          status: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          claimed_at?: string
          coupon_id: string
          id?: string
          status?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          claimed_at?: string
          coupon_id?: string
          id?: string
          status?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_coupons_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      claim_coupon: { Args: { p_coupon_id: string }; Returns: undefined }
      create_notification: {
        Args: {
          p_business_id: string
          p_content: string
          p_link: string
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: undefined
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      send_mass_notification: {
        Args: {
          p_content: string
          p_link: string
          p_send_email: boolean
          p_target: string
          p_title: string
        }
        Returns: undefined
      }
      validate_user_coupon: {
        Args: { p_user_coupon_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "merchant" | "user"
      business_status: "pending" | "approved" | "rejected" | "suspended"
      change_request_status: "pending" | "approved" | "rejected"
      change_request_target: "profile" | "business"
      claim_entity_type: "pf" | "pj"
      claim_status: "pending" | "approved" | "rejected"
      discount_type: "fixed" | "percentage"
      entity_type: "pf" | "pj"
      institution_kind:
        | "posto_saude"
        | "cartorio"
        | "delegacia"
        | "conselho_tutelar"
        | "hospital"
        | "escola"
        | "bombeiros"
        | "prefeitura"
        | "outros"
      notification_type:
        | "new_comment"
        | "new_like"
        | "new_review"
        | "new_follower"
        | "comment_reply"
        | "review_reply"
        | "comment_liked"
      review_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "merchant", "user"],
      business_status: ["pending", "approved", "rejected", "suspended"],
      change_request_status: ["pending", "approved", "rejected"],
      change_request_target: ["profile", "business"],
      claim_entity_type: ["pf", "pj"],
      claim_status: ["pending", "approved", "rejected"],
      discount_type: ["fixed", "percentage"],
      entity_type: ["pf", "pj"],
      institution_kind: [
        "posto_saude",
        "cartorio",
        "delegacia",
        "conselho_tutelar",
        "hospital",
        "escola",
        "bombeiros",
        "prefeitura",
        "outros",
      ],
      notification_type: [
        "new_comment",
        "new_like",
        "new_review",
        "new_follower",
        "comment_reply",
        "review_reply",
        "comment_liked",
      ],
      review_status: ["pending", "approved", "rejected"],
    },
  },
} as const
