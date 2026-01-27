 
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
      admin_hierarchy: {
        Row: {
          admin_id: string
          created_at: string | null
          created_by: string
          deleted_at: string | null
          id: string
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          created_by: string
          deleted_at?: string | null
          id?: string
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          created_by?: string
          deleted_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_hierarchy_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_hierarchy_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_approval_audit_log: {
        Row: {
          action_type: string
          admin_role: Database["public"]["Enums"]["user_role"]
          admin_user_id: string
          agent_user_id: string
          created_at: string | null
          id: string
          new_role: Database["public"]["Enums"]["user_role"]
          previous_role: Database["public"]["Enums"]["user_role"] | null
          reason: string
        }
        Insert: {
          action_type: string
          admin_role: Database["public"]["Enums"]["user_role"]
          admin_user_id: string
          agent_user_id: string
          created_at?: string | null
          id?: string
          new_role: Database["public"]["Enums"]["user_role"]
          previous_role?: Database["public"]["Enums"]["user_role"] | null
          reason: string
        }
        Update: {
          action_type?: string
          admin_role?: Database["public"]["Enums"]["user_role"]
          admin_user_id?: string
          agent_user_id?: string
          created_at?: string | null
          id?: string
          new_role?: Database["public"]["Enums"]["user_role"]
          previous_role?: Database["public"]["Enums"]["user_role"] | null
          reason?: string
        }
        Relationships: []
      }
      agent_request_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          request_id: string
          sender_role: string
          sender_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          request_id: string
          sender_role: string
          sender_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          request_id?: string
          sender_role?: string
          sender_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_request_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "agent_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_request_timeline: {
        Row: {
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          actor_type: string | null
          agent_request_id: string
          assigned_agent_id: string | null
          assigned_by_admin_id: string | null
          created_at: string
          event_timestamp: string
          event_type: string
          id: string
          message_content: string | null
          message_sender_id: string | null
          message_sender_type: string | null
          metadata: Json | null
          new_status: string | null
          notes: string | null
          old_status: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          actor_type?: string | null
          agent_request_id: string
          assigned_agent_id?: string | null
          assigned_by_admin_id?: string | null
          created_at?: string
          event_timestamp?: string
          event_type: string
          id?: string
          message_content?: string | null
          message_sender_id?: string | null
          message_sender_type?: string | null
          metadata?: Json | null
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          actor_type?: string | null
          agent_request_id?: string
          assigned_agent_id?: string | null
          assigned_by_admin_id?: string | null
          created_at?: string
          event_timestamp?: string
          event_type?: string
          id?: string
          message_content?: string | null
          message_sender_id?: string | null
          message_sender_type?: string | null
          metadata?: Json | null
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_request_timeline_agent_request_id_fkey"
            columns: ["agent_request_id"]
            isOneToOne: false
            referencedRelation: "agent_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_requests: {
        Row: {
          admin_notes: string | null
          assigned_agent_id: string | null
          assigned_at: string | null
          assigned_by_admin_id: string | null
          created_at: string | null
          destination_country_code: string
          id: string
          member_country_code: string
          member_feedback: string | null
          member_user_id: string
          notes: string | null
          outcome_status: string
          request_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_agent_id?: string | null
          assigned_at?: string | null
          assigned_by_admin_id?: string | null
          created_at?: string | null
          destination_country_code: string
          id?: string
          member_country_code: string
          member_feedback?: string | null
          member_user_id: string
          notes?: string | null
          outcome_status?: string
          request_type: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_agent_id?: string | null
          assigned_at?: string | null
          assigned_by_admin_id?: string | null
          created_at?: string | null
          destination_country_code?: string
          id?: string
          member_country_code?: string
          member_feedback?: string | null
          member_user_id?: string
          notes?: string | null
          outcome_status?: string
          request_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_requests_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_requests_assigned_by_admin_id_fkey"
            columns: ["assigned_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_verification_requests: {
        Row: {
          additional_details: string | null
          admin_notes: string | null
          agent_country: string
          agent_name: string
          asked_documents_early: boolean
          asked_upfront_payment: boolean
          company_name: string | null
          contact_method: string
          created_at: string | null
          email: string | null
          evidence_files: Json | null
          id: string
          member_id: string
          membership_number: string
          outcome: string | null
          phone_number: string
          private_comm_only: boolean
          promised_guarantee: boolean
          refused_license: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          services: Json
          status: string
          updated_at: string | null
          website_or_social: string | null
          whatsapp_number: string | null
        }
        Insert: {
          additional_details?: string | null
          admin_notes?: string | null
          agent_country: string
          agent_name: string
          asked_documents_early: boolean
          asked_upfront_payment: boolean
          company_name?: string | null
          contact_method: string
          created_at?: string | null
          email?: string | null
          evidence_files?: Json | null
          id?: string
          member_id: string
          membership_number: string
          outcome?: string | null
          phone_number: string
          private_comm_only: boolean
          promised_guarantee: boolean
          refused_license: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          services?: Json
          status?: string
          updated_at?: string | null
          website_or_social?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          additional_details?: string | null
          admin_notes?: string | null
          agent_country?: string
          agent_name?: string
          asked_documents_early?: boolean
          asked_upfront_payment?: boolean
          company_name?: string | null
          contact_method?: string
          created_at?: string | null
          email?: string | null
          evidence_files?: Json | null
          id?: string
          member_id?: string
          membership_number?: string
          outcome?: string | null
          phone_number?: string
          private_comm_only?: boolean
          promised_guarantee?: boolean
          refused_license?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          services?: Json
          status?: string
          updated_at?: string | null
          website_or_social?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      agents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          countries_covered: string[] | null
          created_at: string | null
          id: string
          id_file_url: string | null
          license_file_url: string | null
          license_number: string
          rejection_reason: string | null
          services_offered: string[] | null
          status: Database["public"]["Enums"]["agent_status"]
          successful_migrations: number | null
          total_fees_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          countries_covered?: string[] | null
          created_at?: string | null
          id?: string
          id_file_url?: string | null
          license_file_url?: string | null
          license_number: string
          rejection_reason?: string | null
          services_offered?: string[] | null
          status?: Database["public"]["Enums"]["agent_status"]
          successful_migrations?: number | null
          total_fees_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          countries_covered?: string[] | null
          created_at?: string | null
          id?: string
          id_file_url?: string | null
          license_file_url?: string | null
          license_number?: string
          rejection_reason?: string | null
          services_offered?: string[] | null
          status?: Database["public"]["Enums"]["agent_status"]
          successful_migrations?: number | null
          total_fees_earned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_accounts: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string
          currency: string
          description: string | null
          id: string
          notes: string | null
          reference_id: string | null
          reference_type: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by: string
          currency?: string
          description?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date: string
          transaction_type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string
          currency?: string
          description?: string | null
          id?: string
          notes?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_settings: {
        Row: {
          company_registration_no: string | null
          country_code: string
          created_at: string
          display_on_home: boolean
          id: string
          tin_no: string | null
          trade_license_expiry: string | null
          trade_license_no: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_registration_no?: string | null
          country_code: string
          created_at?: string
          display_on_home?: boolean
          id?: string
          tin_no?: string | null
          trade_license_expiry?: string | null
          trade_license_no?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_registration_no?: string | null
          country_code?: string
          created_at?: string
          display_on_home?: boolean
          id?: string
          tin_no?: string | null
          trade_license_expiry?: string | null
          trade_license_no?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      country_settings: {
        Row: {
          country_code: string
          country_name: string
          currency_code: string
          currency_symbol: string
          is_active: boolean | null
          membership_fee_amount: number
          payment_gateway_provider: string | null
          updated_at: string | null
          updated_by_admin_id: string | null
        }
        Insert: {
          country_code: string
          country_name: string
          currency_code: string
          currency_symbol: string
          is_active?: boolean | null
          membership_fee_amount: number
          payment_gateway_provider?: string | null
          updated_at?: string | null
          updated_by_admin_id?: string | null
        }
        Update: {
          country_code?: string
          country_name?: string
          currency_code?: string
          currency_symbol?: string
          is_active?: boolean | null
          membership_fee_amount?: number
          payment_gateway_provider?: string | null
          updated_at?: string | null
          updated_by_admin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "country_settings_updated_by_admin_id_fkey"
            columns: ["updated_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      embassies: {
        Row: {
          address: string
          contact_details: string | null
          contact_summary: string | null
          country_code: string
          country_name: string
          created_at: string | null
          created_by: string | null
          display_order: number | null
          email: string | null
          embassy_name: string
          id: string
          is_active: boolean | null
          last_verified_at: string | null
          last_verified_by: string | null
          phone: string | null
          services_offered: string[] | null
          source_url: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address: string
          contact_details?: string | null
          contact_summary?: string | null
          country_code: string
          country_name: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          email?: string | null
          embassy_name: string
          id?: string
          is_active?: boolean | null
          last_verified_at?: string | null
          last_verified_by?: string | null
          phone?: string | null
          services_offered?: string[] | null
          source_url?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          contact_details?: string | null
          contact_summary?: string | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          email?: string | null
          embassy_name?: string
          id?: string
          is_active?: boolean | null
          last_verified_at?: string | null
          last_verified_by?: string | null
          phone?: string | null
          services_offered?: string[] | null
          source_url?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embassies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embassies_last_verified_by_fkey"
            columns: ["last_verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_verifications: {
        Row: {
          created_at: string | null
          date_of_birth: string
          first_name: string
          id: string
          id_back_url: string | null
          id_front_url: string
          id_number: string
          id_type: string
          last_name: string
          middle_name: string | null
          nationality: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth: string
          first_name: string
          id?: string
          id_back_url?: string | null
          id_front_url: string
          id_number: string
          id_type: string
          last_name: string
          middle_name?: string | null
          nationality: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string
          first_name?: string
          id?: string
          id_back_url?: string | null
          id_front_url?: string
          id_number?: string
          id_type?: string
          last_name?: string
          middle_name?: string | null
          nationality?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "identity_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          application_email: string | null
          archived_at: string | null
          archived_by: string | null
          benefits: string | null
          benefits_bn: string | null
          closes_at: string | null
          created_at: string | null
          created_by: string | null
          department: string
          department_bn: string | null
          description: string
          description_bn: string | null
          employment_type: string
          id: string
          is_published: boolean | null
          language_requirements: string | null
          location_city: string | null
          location_country: string
          location_type: string
          opens_at: string | null
          preferred_experience: string | null
          published_at: string | null
          qualifications: string | null
          qualifications_bn: string | null
          reporting_to: string | null
          requirements: string
          requirements_bn: string | null
          responsibilities: string | null
          responsibilities_bn: string | null
          salary_range: string | null
          status: string
          summary: string | null
          summary_bn: string | null
          title: string
          title_bn: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          application_email?: string | null
          archived_at?: string | null
          archived_by?: string | null
          benefits?: string | null
          benefits_bn?: string | null
          closes_at?: string | null
          created_at?: string | null
          created_by?: string | null
          department: string
          department_bn?: string | null
          description: string
          description_bn?: string | null
          employment_type: string
          id?: string
          is_published?: boolean | null
          language_requirements?: string | null
          location_city?: string | null
          location_country: string
          location_type: string
          opens_at?: string | null
          preferred_experience?: string | null
          published_at?: string | null
          qualifications?: string | null
          qualifications_bn?: string | null
          reporting_to?: string | null
          requirements: string
          requirements_bn?: string | null
          responsibilities?: string | null
          responsibilities_bn?: string | null
          salary_range?: string | null
          status?: string
          summary?: string | null
          summary_bn?: string | null
          title: string
          title_bn?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          application_email?: string | null
          archived_at?: string | null
          archived_by?: string | null
          benefits?: string | null
          benefits_bn?: string | null
          closes_at?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string
          department_bn?: string | null
          description?: string
          description_bn?: string | null
          employment_type?: string
          id?: string
          is_published?: boolean | null
          language_requirements?: string | null
          location_city?: string | null
          location_country?: string
          location_type?: string
          opens_at?: string | null
          preferred_experience?: string | null
          published_at?: string | null
          qualifications?: string | null
          qualifications_bn?: string | null
          reporting_to?: string | null
          requirements?: string
          requirements_bn?: string | null
          responsibilities?: string | null
          responsibilities_bn?: string | null
          salary_range?: string | null
          status?: string
          summary?: string | null
          summary_bn?: string | null
          title?: string
          title_bn?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      membership_config: {
        Row: {
          country_code: string | null
          created_at: string | null
          created_by: string | null
          effective_from: string
          id: string
          membership_duration_days: number
          membership_fee_amount: number
          membership_fee_currency: string
          notes: string | null
          referral_bonus_amount: number
          referral_bonus_currency: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_from?: string
          id?: string
          membership_duration_days?: number
          membership_fee_amount: number
          membership_fee_currency?: string
          notes?: string | null
          referral_bonus_amount?: number
          referral_bonus_currency?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_from?: string
          id?: string
          membership_duration_days?: number
          membership_fee_amount?: number
          membership_fee_currency?: string
          notes?: string | null
          referral_bonus_amount?: number
          referral_bonus_currency?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_config_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string | null
          end_date: string | null
          fee_amount: number
          fee_currency: string
          id: string
          is_renewal: boolean | null
          membership_number: number
          previous_membership_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          fee_amount: number
          fee_currency: string
          id?: string
          is_renewal?: boolean | null
          membership_number: number
          previous_membership_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          fee_amount?: number
          fee_currency?: string
          id?: string
          is_renewal?: boolean | null
          membership_number?: number
          previous_membership_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_previous_membership_id_fkey"
            columns: ["previous_membership_id"]
            isOneToOne: false
            referencedRelation: "active_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_previous_membership_id_fkey"
            columns: ["previous_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_recipients: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          folder: string
          id: string
          is_read: boolean
          message_id: string
          read_at: string | null
          recipient_user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          folder?: string
          id?: string
          is_read?: boolean
          message_id: string
          read_at?: string | null
          recipient_user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          folder?: string
          id?: string
          is_read?: boolean
          message_id?: string
          read_at?: string | null
          recipient_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_recipients_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_recipients_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string | null
          id: string
          message_type: string
          sender_role: string
          sender_user_id: string | null
          subject: string | null
          target_country_code: string | null
          target_group: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          message_type: string
          sender_role: string
          sender_user_id?: string | null
          subject?: string | null
          target_country_code?: string | null
          target_group?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          message_type?: string
          sender_role?: string
          sender_user_id?: string | null
          subject?: string | null
          target_country_code?: string | null
          target_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          confirmation_date: string | null
          confirmed_by: string | null
          created_at: string | null
          currency: string
          id: string
          membership_id: string
          notes: string | null
          payment_date: string | null
          payment_gateway: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          confirmation_date?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          currency: string
          id?: string
          membership_id: string
          notes?: string | null
          payment_date?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          confirmation_date?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          membership_id?: string
          notes?: string | null
          payment_date?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "active_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_draw_entries: {
        Row: {
          created_at: string | null
          id: string
          is_winner: boolean | null
          membership_id: string
          prize_draw_id: string
          user_id: string
          won_amount: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_winner?: boolean | null
          membership_id: string
          prize_draw_id: string
          user_id: string
          won_amount?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_winner?: boolean | null
          membership_id?: string
          prize_draw_id?: string
          user_id?: string
          won_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prize_draw_entries_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "active_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_draw_entries_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_draw_entries_prize_draw_id_fkey"
            columns: ["prize_draw_id"]
            isOneToOne: false
            referencedRelation: "prize_draws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_draw_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_draw_prizes: {
        Row: {
          award_type: string
          created_at: string | null
          currency_code: string
          description: string | null
          draw_id: string
          id: string
          is_active: boolean | null
          number_of_winners: number
          prize_type: string
          prize_value_amount: number
          title: string
        }
        Insert: {
          award_type: string
          created_at?: string | null
          currency_code?: string
          description?: string | null
          draw_id: string
          id?: string
          is_active?: boolean | null
          number_of_winners?: number
          prize_type: string
          prize_value_amount: number
          title: string
        }
        Update: {
          award_type?: string
          created_at?: string | null
          currency_code?: string
          description?: string | null
          draw_id?: string
          id?: string
          is_active?: boolean | null
          number_of_winners?: number
          prize_type?: string
          prize_value_amount?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "prize_draw_prizes_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "prize_draws"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_draw_winners: {
        Row: {
          admin_reason: string | null
          award_type: string
          claim_deadline_at: string | null
          claim_status: string
          claimed_at: string | null
          draw_id: string
          id: string
          paid_at: string | null
          payout_status: string
          prize_id: string
          selected_at: string | null
          selected_by_admin_id: string | null
          winner_user_id: string
        }
        Insert: {
          admin_reason?: string | null
          award_type: string
          claim_deadline_at?: string | null
          claim_status?: string
          claimed_at?: string | null
          draw_id: string
          id?: string
          paid_at?: string | null
          payout_status?: string
          prize_id: string
          selected_at?: string | null
          selected_by_admin_id?: string | null
          winner_user_id: string
        }
        Update: {
          admin_reason?: string | null
          award_type?: string
          claim_deadline_at?: string | null
          claim_status?: string
          claimed_at?: string | null
          draw_id?: string
          id?: string
          paid_at?: string | null
          payout_status?: string
          prize_id?: string
          selected_at?: string | null
          selected_by_admin_id?: string | null
          winner_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prize_draw_winners_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "prize_draws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_draw_winners_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "prize_draw_prizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_draw_winners_selected_by_admin_id_fkey"
            columns: ["selected_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_draw_winners_winner_user_id_fkey"
            columns: ["winner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_draws: {
        Row: {
          announced_at: string | null
          announcement_status: string
          completed_at: string | null
          country_code: string
          created_at: string | null
          created_by: string
          currency: string
          description: string | null
          disclaimer_text: string | null
          draw_date: string
          estimated_prize_pool_amount: number | null
          estimated_prize_pool_currency: string | null
          estimated_prize_pool_percentage: number | null
          forecast_member_count: number | null
          id: string
          notes: string | null
          number_of_winners: number
          prize_value: number
          status: Database["public"]["Enums"]["prize_draw_status"]
          title: string
        }
        Insert: {
          announced_at?: string | null
          announcement_status?: string
          completed_at?: string | null
          country_code?: string
          created_at?: string | null
          created_by: string
          currency?: string
          description?: string | null
          disclaimer_text?: string | null
          draw_date: string
          estimated_prize_pool_amount?: number | null
          estimated_prize_pool_currency?: string | null
          estimated_prize_pool_percentage?: number | null
          forecast_member_count?: number | null
          id?: string
          notes?: string | null
          number_of_winners?: number
          prize_value: number
          status?: Database["public"]["Enums"]["prize_draw_status"]
          title: string
        }
        Update: {
          announced_at?: string | null
          announcement_status?: string
          completed_at?: string | null
          country_code?: string
          created_at?: string | null
          created_by?: string
          currency?: string
          description?: string | null
          disclaimer_text?: string | null
          draw_date?: string
          estimated_prize_pool_amount?: number | null
          estimated_prize_pool_currency?: string | null
          estimated_prize_pool_percentage?: number | null
          forecast_member_count?: number | null
          id?: string
          notes?: string | null
          number_of_winners?: number
          prize_value?: number
          status?: Database["public"]["Enums"]["prize_draw_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "prize_draws_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepted_member_agreement: boolean | null
          accepted_member_agreement_at: string | null
          accepted_member_agreement_version: string | null
          agent_number: string | null
          agent_status: string | null
          avatar_url: string | null
          country_code: string | null
          created_at: string | null
          created_by_admin_id: string | null
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          full_name: string | null
          government_id_file_url: string | null
          government_id_number: string | null
          government_id_type: string | null
          id: string
          is_verified: boolean | null
          last_hardship_request_year: number | null
          membership_number: number | null
          phone_number: string | null
          preferred_language: string | null
          referral_code: string | null
          referred_by_code: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          selfie_file_url: string | null
          updated_at: string | null
          verification_notes: string | null
        }
        Insert: {
          accepted_member_agreement?: boolean | null
          accepted_member_agreement_at?: string | null
          accepted_member_agreement_version?: string | null
          agent_number?: string | null
          agent_status?: string | null
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string | null
          created_by_admin_id?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          government_id_file_url?: string | null
          government_id_number?: string | null
          government_id_type?: string | null
          id: string
          is_verified?: boolean | null
          last_hardship_request_year?: number | null
          membership_number?: number | null
          phone_number?: string | null
          preferred_language?: string | null
          referral_code?: string | null
          referred_by_code?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          selfie_file_url?: string | null
          updated_at?: string | null
          verification_notes?: string | null
        }
        Update: {
          accepted_member_agreement?: boolean | null
          accepted_member_agreement_at?: string | null
          accepted_member_agreement_version?: string | null
          agent_number?: string | null
          agent_status?: string | null
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string | null
          created_by_admin_id?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          government_id_file_url?: string | null
          government_id_number?: string | null
          government_id_type?: string | null
          id?: string
          is_verified?: boolean | null
          last_hardship_request_year?: number | null
          membership_number?: number | null
          phone_number?: string | null
          preferred_language?: string | null
          referral_code?: string | null
          referred_by_code?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          selfie_file_url?: string | null
          updated_at?: string | null
          verification_notes?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_amount: number
          bonus_currency: string
          created_at: string | null
          id: string
          is_paid: boolean | null
          membership_id: string | null
          referral_code: string
          referred_user_id: string
          referrer_id: string
        }
        Insert: {
          bonus_amount: number
          bonus_currency: string
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          membership_id?: string | null
          referral_code: string
          referred_user_id: string
          referrer_id: string
        }
        Update: {
          bonus_amount?: number
          bonus_currency?: string
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          membership_id?: string | null
          referral_code?: string
          referred_user_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "active_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scammer_reports: {
        Row: {
          amount_lost: number | null
          created_at: string | null
          currency: string | null
          evidence_file_urls: string[] | null
          id: string
          incident_date: string | null
          incident_description: string
          is_published: boolean | null
          last_known_address: string | null
          published_at: string | null
          reported_by: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scammer_company: string | null
          scammer_contact: string | null
          scammer_name: string
          scammer_photo_url: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string | null
        }
        Insert: {
          amount_lost?: number | null
          created_at?: string | null
          currency?: string | null
          evidence_file_urls?: string[] | null
          id?: string
          incident_date?: string | null
          incident_description: string
          is_published?: boolean | null
          last_known_address?: string | null
          published_at?: string | null
          reported_by: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scammer_company?: string | null
          scammer_contact?: string | null
          scammer_name: string
          scammer_photo_url?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string | null
        }
        Update: {
          amount_lost?: number | null
          created_at?: string | null
          currency?: string | null
          evidence_file_urls?: string[] | null
          id?: string
          incident_date?: string | null
          incident_description?: string
          is_published?: boolean | null
          last_known_address?: string | null
          published_at?: string | null
          reported_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scammer_company?: string | null
          scammer_contact?: string | null
          scammer_name?: string
          scammer_photo_url?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scammer_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scammer_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          assigned_agent_id: string | null
          assigned_at: string | null
          assigned_by: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          destination_country: string
          id: string
          member_feedback: string | null
          member_id: string
          member_rating: number | null
          service_type: string
          status: Database["public"]["Enums"]["service_request_status"]
          updated_at: string | null
        }
        Insert: {
          assigned_agent_id?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          destination_country: string
          id?: string
          member_feedback?: string | null
          member_id: string
          member_rating?: number | null
          service_type: string
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string | null
        }
        Update: {
          assigned_agent_id?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          destination_country?: string
          id?: string
          member_feedback?: string | null
          member_id?: string
          member_rating?: number | null
          service_type?: string
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "admin_agent_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string | null
          currency: string
          id: string
          total_earned: number
          total_withdrawn: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          amount: number
          currency: string
          id: string
          paid_at: string | null
          payment_details: Json | null
          payment_method: string | null
          requested_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Insert: {
          amount: number
          currency: string
          id?: string
          paid_at?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          requested_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
        }
        Update: {
          amount?: number
          currency?: string
          id?: string
          paid_at?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          requested_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_memberships: {
        Row: {
          created_at: string | null
          email: string | null
          end_date: string | null
          fee_amount: number | null
          fee_currency: string | null
          full_name: string | null
          id: string | null
          is_renewal: boolean | null
          membership_number: number | null
          phone_number: string | null
          previous_membership_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["membership_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memberships_previous_membership_id_fkey"
            columns: ["previous_membership_id"]
            isOneToOne: false
            referencedRelation: "active_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_previous_membership_id_fkey"
            columns: ["previous_membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_agent_stats: {
        Row: {
          approved_at: string | null
          average_rating: number | null
          company_name: string | null
          completed_requests: number | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          license_number: string | null
          status: Database["public"]["Enums"]["agent_status"] | null
          successful_migrations: number | null
          total_fees_earned: number | null
          total_service_requests: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_dashboard_stats: {
        Row: {
          active_memberships: number | null
          expired_memberships: number | null
          pending_agent_applications: number | null
          pending_memberships: number | null
          pending_referrals: number | null
          pending_scam_reports: number | null
          pending_withdrawals: number | null
          total_memberships: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_membership_end_date: {
        Args: { start_date: string }
        Returns: string
      }
      calculate_wallet_balance: { Args: { user_uuid: string }; Returns: number }
      check_duplicate_membership: {
        Args: { check_email: string; check_gov_id: string }
        Returns: boolean
      }
      days_until_expiry: { Args: { user_uuid: string }; Returns: number }
      expire_memberships: { Args: never; Returns: undefined }
      generate_membership_number: { Args: never; Returns: number }
      generate_referral_code: { Args: never; Returns: string }
      get_referral_balance: { Args: { user_uuid: string }; Returns: number }
      get_referral_earnings: {
        Args: { user_uuid: string }
        Returns: {
          pending_amount: number
          total_earned: number
          total_referrals: number
          withdrawn_amount: number
        }[]
      }
      has_active_membership: { Args: { user_uuid: string }; Returns: boolean }
      is_membership_active: { Args: { user_uuid: string }; Returns: boolean }
      validate_file_upload: {
        Args: {
          bucket_name: string
          file_path: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      agent_status: "pending_approval" | "approved" | "rejected" | "suspended"
      membership_status: "pending_payment" | "active" | "expired" | "suspended"
      payment_status: "pending" | "confirmed" | "failed" | "refunded"
      prize_draw_status: "upcoming" | "active" | "completed" | "cancelled"
      report_status: "submitted" | "under_review" | "verified" | "rejected"
      service_request_status:
        | "submitted"
        | "agent_assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
      user_role:
        | "super_admin"
        | "manager_admin"
        | "worker_admin"
        | "member"
        | "agent"
        | "agent_pending"
        | "agent_suspended"
      withdrawal_status: "pending" | "approved" | "rejected" | "paid"
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
      agent_status: ["pending_approval", "approved", "rejected", "suspended"],
      membership_status: ["pending_payment", "active", "expired", "suspended"],
      payment_status: ["pending", "confirmed", "failed", "refunded"],
      prize_draw_status: ["upcoming", "active", "completed", "cancelled"],
      report_status: ["submitted", "under_review", "verified", "rejected"],
      service_request_status: [
        "submitted",
        "agent_assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      user_role: [
        "super_admin",
        "manager_admin",
        "worker_admin",
        "member",
        "agent",
        "agent_pending",
        "agent_suspended",
      ],
      withdrawal_status: ["pending", "approved", "rejected", "paid"],
    },
  },
} as const
