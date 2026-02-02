 
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
      accounting_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          end_date: string
          id: string
          is_closed: boolean | null
          period_name: string
          start_date: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          is_closed?: boolean | null
          period_name: string
          start_date: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          is_closed?: boolean | null
          period_name?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_closed_by"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      admin_notifications: {
        Row: {
          created_at: string | null
          escalated_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          member_full_name: string | null
          member_id: string | null
          message: string
          metadata: Json | null
          notification_type: string
          priority: string | null
          read_at: string | null
          read_by: string | null
          reference_id: string
          target_admin_roles: string[]
          title: string
        }
        Insert: {
          created_at?: string | null
          escalated_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          member_full_name?: string | null
          member_id?: string | null
          message: string
          metadata?: Json | null
          notification_type: string
          priority?: string | null
          read_at?: string | null
          read_by?: string | null
          reference_id: string
          target_admin_roles: string[]
          title: string
        }
        Update: {
          created_at?: string | null
          escalated_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          member_full_name?: string | null
          member_id?: string | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          read_at?: string | null
          read_by?: string | null
          reference_id?: string
          target_admin_roles?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notifications_read_by_fkey"
            columns: ["read_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_report_access_logs: {
        Row: {
          action: string
          admin_id: string | null
          admin_role: string
          created_at: string | null
          id: string
          report_type: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          admin_role: string
          created_at?: string | null
          id?: string
          report_type: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          admin_role?: string
          created_at?: string | null
          id?: string
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_report_access_logs_admin_id_fkey"
            columns: ["admin_id"]
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
      attendance_corrections: {
        Row: {
          corrected_attendance_id: string
          corrected_by_admin_id: string
          correction_reason: string
          created_at: string | null
          id: string
          original_attendance_id: string
        }
        Insert: {
          corrected_attendance_id: string
          corrected_by_admin_id: string
          correction_reason: string
          created_at?: string | null
          id?: string
          original_attendance_id: string
        }
        Update: {
          corrected_attendance_id?: string
          corrected_by_admin_id?: string
          correction_reason?: string
          created_at?: string | null
          id?: string
          original_attendance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_corrections_corrected_attendance_id_fkey"
            columns: ["corrected_attendance_id"]
            isOneToOne: false
            referencedRelation: "employee_attendance_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_corrections_corrected_by_admin_id_fkey"
            columns: ["corrected_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_corrections_original_attendance_id_fkey"
            columns: ["original_attendance_id"]
            isOneToOne: false
            referencedRelation: "employee_attendance_logs"
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
      bank_details_change_log: {
        Row: {
          bank_details_id: string
          change_reason: string | null
          change_type: string
          changed_by: string | null
          created_at: string | null
          id: string
          member_id: string
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          bank_details_id: string
          change_reason?: string | null
          change_type: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          member_id: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          bank_details_id?: string
          change_reason?: string | null
          change_type?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          member_id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_details_change_log_bank_details_id_fkey"
            columns: ["bank_details_id"]
            isOneToOne: false
            referencedRelation: "member_bank_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_details_change_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_details_change_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours_config: {
        Row: {
          active: boolean | null
          business_end_time: string
          business_start_time: string
          country_code: string
          created_at: string | null
          grace_period_minutes: number
          timezone: string
          updated_at: string | null
          updated_by_admin_id: string | null
        }
        Insert: {
          active?: boolean | null
          business_end_time?: string
          business_start_time?: string
          country_code: string
          created_at?: string | null
          grace_period_minutes?: number
          timezone?: string
          updated_at?: string | null
          updated_by_admin_id?: string | null
        }
        Update: {
          active?: boolean | null
          business_end_time?: string
          business_start_time?: string
          country_code?: string
          created_at?: string | null
          grace_period_minutes?: number
          timezone?: string
          updated_at?: string | null
          updated_by_admin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_config_updated_by_admin_id_fkey"
            columns: ["updated_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_restricted: boolean | null
          parent_code: string | null
          updated_at: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_restricted?: boolean | null
          parent_code?: string | null
          updated_at?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_restricted?: boolean | null
          parent_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_parent_account"
            columns: ["parent_code"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_code"]
          },
        ]
      }
      community_prize_awards: {
        Row: {
          awarded_at: string | null
          awarded_by_admin_id: string | null
          claim_deadline: string
          claim_status: string
          claimed_at: string | null
          created_at: string | null
          id: string
          member_id: string
          member_number: string
          prize_amount: number
          prize_draw_id: string
          prize_id: string | null
          prize_name: string
          updated_at: string | null
        }
        Insert: {
          awarded_at?: string | null
          awarded_by_admin_id?: string | null
          claim_deadline: string
          claim_status?: string
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          member_id: string
          member_number: string
          prize_amount: number
          prize_draw_id: string
          prize_id?: string | null
          prize_name: string
          updated_at?: string | null
        }
        Update: {
          awarded_at?: string | null
          awarded_by_admin_id?: string | null
          claim_deadline?: string
          claim_status?: string
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          member_id?: string
          member_number?: string
          prize_amount?: number
          prize_draw_id?: string
          prize_id?: string | null
          prize_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_prize_awards_awarded_by_admin_id_fkey"
            columns: ["awarded_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_prize_awards_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_prize_awards_prize_draw_id_fkey"
            columns: ["prize_draw_id"]
            isOneToOne: false
            referencedRelation: "prize_draws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_prize_awards_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "prize_draw_prizes"
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
      consolidated_master_summaries: {
        Row: {
          consolidated_expenses: Json
          consolidated_members: Json
          consolidated_prize_pools: Json
          consolidated_revenue: Json
          countries_included: string[]
          country_summaries: Json
          created_at: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          net_income_all_countries: number
          period_end_date: string
          period_month: number
          period_name: string
          period_start_date: string
          period_year: number
          reporting_currency: string
          sent_at: string | null
          sent_to_master_admin: boolean
          status: string
          total_active_members_all_countries: number
          total_expenses_all_countries: number
          total_prize_pools_all_countries: number
          total_revenue_all_countries: number
          updated_at: string | null
        }
        Insert: {
          consolidated_expenses?: Json
          consolidated_members?: Json
          consolidated_prize_pools?: Json
          consolidated_revenue?: Json
          countries_included?: string[]
          country_summaries?: Json
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          net_income_all_countries?: number
          period_end_date: string
          period_month: number
          period_name: string
          period_start_date: string
          period_year: number
          reporting_currency?: string
          sent_at?: string | null
          sent_to_master_admin?: boolean
          status?: string
          total_active_members_all_countries?: number
          total_expenses_all_countries?: number
          total_prize_pools_all_countries?: number
          total_revenue_all_countries?: number
          updated_at?: string | null
        }
        Update: {
          consolidated_expenses?: Json
          consolidated_members?: Json
          consolidated_prize_pools?: Json
          consolidated_revenue?: Json
          countries_included?: string[]
          country_summaries?: Json
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          net_income_all_countries?: number
          period_end_date?: string
          period_month?: number
          period_name?: string
          period_start_date?: string
          period_year?: number
          reporting_currency?: string
          sent_at?: string | null
          sent_to_master_admin?: boolean
          status?: string
          total_active_members_all_countries?: number
          total_expenses_all_countries?: number
          total_prize_pools_all_countries?: number
          total_revenue_all_countries?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      country_financial_summaries: {
        Row: {
          active_members_count: number
          country_code: string
          country_name: string
          created_at: string | null
          expense_summary: Json
          finalized_at: string | null
          finalized_by: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          local_currency: string
          member_summary: Json
          net_income: number
          period_end_date: string
          period_month: number
          period_name: string
          period_start_date: string
          period_year: number
          prize_pool_balance: number
          prize_pool_summary: Json
          revenue_summary: Json
          status: string
          total_expenses: number
          total_revenue: number
          updated_at: string | null
        }
        Insert: {
          active_members_count?: number
          country_code: string
          country_name: string
          created_at?: string | null
          expense_summary?: Json
          finalized_at?: string | null
          finalized_by?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          local_currency?: string
          member_summary?: Json
          net_income?: number
          period_end_date: string
          period_month: number
          period_name: string
          period_start_date: string
          period_year: number
          prize_pool_balance?: number
          prize_pool_summary?: Json
          revenue_summary?: Json
          status?: string
          total_expenses?: number
          total_revenue?: number
          updated_at?: string | null
        }
        Update: {
          active_members_count?: number
          country_code?: string
          country_name?: string
          created_at?: string | null
          expense_summary?: Json
          finalized_at?: string | null
          finalized_by?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          local_currency?: string
          member_summary?: Json
          net_income?: number
          period_end_date?: string
          period_month?: number
          period_name?: string
          period_start_date?: string
          period_year?: number
          prize_pool_balance?: number
          prize_pool_summary?: Json
          revenue_summary?: Json
          status?: string
          total_expenses?: number
          total_revenue?: number
          updated_at?: string | null
        }
        Relationships: []
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
      document_verification_audit_log: {
        Row: {
          action_details: string | null
          action_type: string
          admin_role: string | null
          created_at: string | null
          doc_verification_request_id: string
          id: string
          new_status: string | null
          old_status: string | null
          performed_by: string
          ticket_reference: string
          timestamp: string | null
        }
        Insert: {
          action_details?: string | null
          action_type: string
          admin_role?: string | null
          created_at?: string | null
          doc_verification_request_id: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          performed_by: string
          ticket_reference: string
          timestamp?: string | null
        }
        Update: {
          action_details?: string | null
          action_type?: string
          admin_role?: string | null
          created_at?: string | null
          doc_verification_request_id?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          performed_by?: string
          ticket_reference?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_verification_audit_lo_doc_verification_request_id_fkey"
            columns: ["doc_verification_request_id"]
            isOneToOne: false
            referencedRelation: "document_verification_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_verification_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_verification_requests: {
        Row: {
          admin_response: string | null
          country_related: string
          created_at: string | null
          document_type: string
          document_type_other: string | null
          explanation: string
          id: string
          internal_notes: string | null
          member_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          ticket_reference: string
          updated_at: string | null
        }
        Insert: {
          admin_response?: string | null
          country_related: string
          created_at?: string | null
          document_type: string
          document_type_other?: string | null
          explanation: string
          id?: string
          internal_notes?: string | null
          member_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          ticket_reference: string
          updated_at?: string | null
        }
        Update: {
          admin_response?: string | null
          country_related?: string
          created_at?: string | null
          document_type?: string
          document_type_other?: string | null
          explanation?: string
          id?: string
          internal_notes?: string | null
          member_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          ticket_reference?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_verification_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
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
      emergency_closures: {
        Row: {
          affects_attendance: boolean | null
          closure_date: string
          closure_type: Database["public"]["Enums"]["closure_type"]
          declared_at: string | null
          declared_by_admin_id: string | null
          id: string
          is_paid: boolean | null
          reason: string
        }
        Insert: {
          affects_attendance?: boolean | null
          closure_date: string
          closure_type: Database["public"]["Enums"]["closure_type"]
          declared_at?: string | null
          declared_by_admin_id?: string | null
          id?: string
          is_paid?: boolean | null
          reason: string
        }
        Update: {
          affects_attendance?: boolean | null
          closure_date?: string
          closure_type?: Database["public"]["Enums"]["closure_type"]
          declared_at?: string | null
          declared_by_admin_id?: string | null
          id?: string
          is_paid?: boolean | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_closures_declared_by_admin_id_fkey"
            columns: ["declared_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_approval_thresholds: {
        Row: {
          can_approve_emergency_overrides: boolean | null
          can_approve_salary_changes: boolean | null
          can_approve_terminations: boolean | null
          created_at: string | null
          id: string
          max_payment_approval_amount: number | null
          role_category: Database["public"]["Enums"]["employee_role_category"]
        }
        Insert: {
          can_approve_emergency_overrides?: boolean | null
          can_approve_salary_changes?: boolean | null
          can_approve_terminations?: boolean | null
          created_at?: string | null
          id?: string
          max_payment_approval_amount?: number | null
          role_category: Database["public"]["Enums"]["employee_role_category"]
        }
        Update: {
          can_approve_emergency_overrides?: boolean | null
          can_approve_salary_changes?: boolean | null
          can_approve_terminations?: boolean | null
          created_at?: string | null
          id?: string
          max_payment_approval_amount?: number | null
          role_category?: Database["public"]["Enums"]["employee_role_category"]
        }
        Relationships: []
      }
      employee_attendance_logs: {
        Row: {
          actual_login_time: string | null
          attendance_date: string
          created_at: string | null
          department: string
          employee_id: string
          expected_login_time: string
          id: string
          lateness_minutes: number | null
          logged_from_ip: string | null
          logged_from_location: string | null
          manual_entry: boolean | null
          manual_entry_reason: string | null
          recorded_by_admin_id: string | null
          recorded_by_system: boolean | null
          role_category: string
          status: Database["public"]["Enums"]["employee_attendance_status"]
          updated_at: string | null
        }
        Insert: {
          actual_login_time?: string | null
          attendance_date: string
          created_at?: string | null
          department: string
          employee_id: string
          expected_login_time: string
          id?: string
          lateness_minutes?: number | null
          logged_from_ip?: string | null
          logged_from_location?: string | null
          manual_entry?: boolean | null
          manual_entry_reason?: string | null
          recorded_by_admin_id?: string | null
          recorded_by_system?: boolean | null
          role_category: string
          status?: Database["public"]["Enums"]["employee_attendance_status"]
          updated_at?: string | null
        }
        Update: {
          actual_login_time?: string | null
          attendance_date?: string
          created_at?: string | null
          department?: string
          employee_id?: string
          expected_login_time?: string
          id?: string
          lateness_minutes?: number | null
          logged_from_ip?: string | null
          logged_from_location?: string | null
          manual_entry?: boolean | null
          manual_entry_reason?: string | null
          recorded_by_admin_id?: string | null
          recorded_by_system?: boolean | null
          role_category?: string
          status?: Database["public"]["Enums"]["employee_attendance_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_attendance_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attendance_logs_recorded_by_admin_id_fkey"
            columns: ["recorded_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_contract_templates: {
        Row: {
          applicable_departments:
            | Database["public"]["Enums"]["department_type"][]
            | null
          applicable_roles:
            | Database["public"]["Enums"]["employee_role_category"][]
            | null
          created_at: string | null
          created_by_admin_id: string | null
          id: string
          is_active: boolean | null
          template_content: string
          template_name: string
          version: string
        }
        Insert: {
          applicable_departments?:
            | Database["public"]["Enums"]["department_type"][]
            | null
          applicable_roles?:
            | Database["public"]["Enums"]["employee_role_category"][]
            | null
          created_at?: string | null
          created_by_admin_id?: string | null
          id?: string
          is_active?: boolean | null
          template_content: string
          template_name: string
          version: string
        }
        Update: {
          applicable_departments?:
            | Database["public"]["Enums"]["department_type"][]
            | null
          applicable_roles?:
            | Database["public"]["Enums"]["employee_role_category"][]
            | null
          created_at?: string | null
          created_by_admin_id?: string | null
          id?: string
          is_active?: boolean | null
          template_content?: string
          template_name?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_contract_templates_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_contracts: {
        Row: {
          contract_content: string
          contract_hash: string | null
          contract_number: string
          created_at: string | null
          employee_id: string
          end_date: string | null
          id: string
          is_signed: boolean | null
          signed_by_admin_at: string | null
          signed_by_admin_id: string | null
          signed_by_employee_at: string | null
          start_date: string
          status: string
          template_id: string | null
          version: string
        }
        Insert: {
          contract_content: string
          contract_hash?: string | null
          contract_number: string
          created_at?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          is_signed?: boolean | null
          signed_by_admin_at?: string | null
          signed_by_admin_id?: string | null
          signed_by_employee_at?: string | null
          start_date: string
          status?: string
          template_id?: string | null
          version?: string
        }
        Update: {
          contract_content?: string
          contract_hash?: string | null
          contract_number?: string
          created_at?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          is_signed?: boolean | null
          signed_by_admin_at?: string | null
          signed_by_admin_id?: string | null
          signed_by_employee_at?: string | null
          start_date?: string
          status?: string
          template_id?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_contracts_signed_by_admin_id_fkey"
            columns: ["signed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "employee_contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_leave_balances: {
        Row: {
          annual_leave_remaining: number | null
          annual_leave_total: number | null
          annual_leave_used: number | null
          employee_id: string
          id: string
          sick_leave_used: number | null
          unpaid_leave_used: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          annual_leave_remaining?: number | null
          annual_leave_total?: number | null
          annual_leave_used?: number | null
          employee_id: string
          id?: string
          sick_leave_used?: number | null
          unpaid_leave_used?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          annual_leave_remaining?: number | null
          annual_leave_total?: number | null
          annual_leave_used?: number | null
          employee_id?: string
          id?: string
          sick_leave_used?: number | null
          unpaid_leave_used?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_leave_requests: {
        Row: {
          approved_at: string | null
          approved_by_admin_id: string | null
          created_at: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string
          total_days: number
        }
        Insert: {
          approved_at?: string | null
          approved_by_admin_id?: string | null
          created_at?: string | null
          employee_id: string
          end_date: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string
          total_days: number
        }
        Update: {
          approved_at?: string | null
          approved_by_admin_id?: string | null
          created_at?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          total_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_leave_requests_approved_by_admin_id_fkey"
            columns: ["approved_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_payroll_profiles: {
        Row: {
          bank_account_details: Json
          basic_salary_bdt: number
          created_at: string | null
          created_by: string | null
          employee_id: string
          employment_end_date: string | null
          employment_start_date: string
          id: string
          pay_frequency: string
          status: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          bank_account_details: Json
          basic_salary_bdt: number
          created_at?: string | null
          created_by?: string | null
          employee_id: string
          employment_end_date?: string | null
          employment_start_date: string
          id?: string
          pay_frequency: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          bank_account_details?: Json
          basic_salary_bdt?: number
          created_at?: string | null
          created_by?: string | null
          employee_id?: string
          employment_end_date?: string | null
          employment_start_date?: string
          id?: string
          pay_frequency?: string
          status?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_payroll_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_payroll_profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_payroll_profiles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_resignations: {
        Row: {
          created_at: string | null
          early_exit_approved: boolean | null
          early_exit_approved_at: string | null
          early_exit_approved_by_admin_id: string | null
          early_exit_requested: boolean | null
          employee_id: string
          final_settlement_amount: number | null
          final_settlement_calculated_at: string | null
          final_settlement_paid: boolean | null
          final_settlement_paid_at: string | null
          id: string
          last_working_day: string
          notice_period_days: number
          reason: string | null
          resignation_date: string
        }
        Insert: {
          created_at?: string | null
          early_exit_approved?: boolean | null
          early_exit_approved_at?: string | null
          early_exit_approved_by_admin_id?: string | null
          early_exit_requested?: boolean | null
          employee_id: string
          final_settlement_amount?: number | null
          final_settlement_calculated_at?: string | null
          final_settlement_paid?: boolean | null
          final_settlement_paid_at?: string | null
          id?: string
          last_working_day: string
          notice_period_days: number
          reason?: string | null
          resignation_date: string
        }
        Update: {
          created_at?: string | null
          early_exit_approved?: boolean | null
          early_exit_approved_at?: string | null
          early_exit_approved_by_admin_id?: string | null
          early_exit_requested?: boolean | null
          employee_id?: string
          final_settlement_amount?: number | null
          final_settlement_calculated_at?: string | null
          final_settlement_paid?: boolean | null
          final_settlement_paid_at?: string | null
          id?: string
          last_working_day?: string
          notice_period_days?: number
          reason?: string | null
          resignation_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_resignations_early_exit_approved_by_admin_id_fkey"
            columns: ["early_exit_approved_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_resignations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_role_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_read: boolean | null
          can_update: boolean | null
          created_at: string | null
          id: string
          permission_name: string
          role_category: string
          scope_restriction: string | null
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          permission_name: string
          role_category: string
          scope_restriction?: string | null
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_read?: boolean | null
          can_update?: boolean | null
          created_at?: string | null
          id?: string
          permission_name?: string
          role_category?: string
          scope_restriction?: string | null
        }
        Relationships: []
      }
      employee_salaries: {
        Row: {
          approved_at: string | null
          approved_by_admin_id: string | null
          created_at: string | null
          currency: string
          effective_date: string
          effective_to: string | null
          employee_id: string
          id: string
          initial_retained_amount: number | null
          last_payment_run_id: string | null
          monthly_gross_salary: number
          monthly_net_salary: number | null
          monthly_retention_deduction: number | null
          other_deductions: number | null
          payment_issue_flag: boolean | null
          payment_issue_reason: string | null
          payment_status: string | null
          provident_fund: number | null
          tax_deduction: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by_admin_id?: string | null
          created_at?: string | null
          currency?: string
          effective_date: string
          effective_to?: string | null
          employee_id: string
          id?: string
          initial_retained_amount?: number | null
          last_payment_run_id?: string | null
          monthly_gross_salary: number
          monthly_net_salary?: number | null
          monthly_retention_deduction?: number | null
          other_deductions?: number | null
          payment_issue_flag?: boolean | null
          payment_issue_reason?: string | null
          payment_status?: string | null
          provident_fund?: number | null
          tax_deduction?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by_admin_id?: string | null
          created_at?: string | null
          currency?: string
          effective_date?: string
          effective_to?: string | null
          employee_id?: string
          id?: string
          initial_retained_amount?: number | null
          last_payment_run_id?: string | null
          monthly_gross_salary?: number
          monthly_net_salary?: number | null
          monthly_retention_deduction?: number | null
          other_deductions?: number | null
          payment_issue_flag?: boolean | null
          payment_issue_reason?: string | null
          payment_status?: string | null
          provident_fund?: number | null
          tax_deduction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_salaries_approved_by_admin_id_fkey"
            columns: ["approved_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_salaries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_terminations: {
        Row: {
          approved_at: string | null
          approved_by_admin_id: string
          created_at: string | null
          detailed_notes: string | null
          effective_date: string
          eligible_for_redundancy_pay: boolean | null
          employee_id: string
          final_settlement_amount: number | null
          final_settlement_paid: boolean | null
          final_settlement_paid_at: string | null
          id: string
          reason: string
          redundancy_pay_amount: number | null
          redundancy_pay_paid: boolean | null
          requires_immediate_effect: boolean | null
          termination_date: string
          termination_type: Database["public"]["Enums"]["termination_type"]
        }
        Insert: {
          approved_at?: string | null
          approved_by_admin_id: string
          created_at?: string | null
          detailed_notes?: string | null
          effective_date: string
          eligible_for_redundancy_pay?: boolean | null
          employee_id: string
          final_settlement_amount?: number | null
          final_settlement_paid?: boolean | null
          final_settlement_paid_at?: string | null
          id?: string
          reason: string
          redundancy_pay_amount?: number | null
          redundancy_pay_paid?: boolean | null
          requires_immediate_effect?: boolean | null
          termination_date: string
          termination_type: Database["public"]["Enums"]["termination_type"]
        }
        Update: {
          approved_at?: string | null
          approved_by_admin_id?: string
          created_at?: string | null
          detailed_notes?: string | null
          effective_date?: string
          eligible_for_redundancy_pay?: boolean | null
          employee_id?: string
          final_settlement_amount?: number | null
          final_settlement_paid?: boolean | null
          final_settlement_paid_at?: string | null
          id?: string
          reason?: string
          redundancy_pay_amount?: number | null
          redundancy_pay_paid?: boolean | null
          requires_immediate_effect?: boolean | null
          termination_date?: string
          termination_type?: Database["public"]["Enums"]["termination_type"]
        }
        Relationships: [
          {
            foreignKeyName: "employee_terminations_approved_by_admin_id_fkey"
            columns: ["approved_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_terminations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_welfare_reserve: {
        Row: {
          balance: number | null
          created_at: string | null
          employee_id: string
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          employee_id: string
          id?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          employee_id?: string
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_welfare_reserve_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          contract_type: string | null
          created_at: string | null
          created_by_admin_id: string | null
          department: Database["public"]["Enums"]["department_type"]
          email: string | null
          employee_number: string
          employment_end_date: string | null
          employment_start_date: string | null
          employment_status_reason: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          full_name: string
          id: string
          job_title: string
          last_status_change_at: string | null
          last_status_change_by: string | null
          monthly_salary_gross: number
          notice_period_days: number
          phone: string | null
          probation_end_date: string | null
          probation_status: string | null
          reports_to_employee_id: string | null
          role_category: Database["public"]["Enums"]["employee_role_category"]
          salary_currency: string
          start_date: string
          status: Database["public"]["Enums"]["employee_status"]
          termination_date: string | null
          termination_reason: string | null
          termination_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          contract_type?: string | null
          created_at?: string | null
          created_by_admin_id?: string | null
          department: Database["public"]["Enums"]["department_type"]
          email?: string | null
          employee_number: string
          employment_end_date?: string | null
          employment_start_date?: string | null
          employment_status_reason?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          full_name: string
          id?: string
          job_title?: string
          last_status_change_at?: string | null
          last_status_change_by?: string | null
          monthly_salary_gross: number
          notice_period_days?: number
          phone?: string | null
          probation_end_date?: string | null
          probation_status?: string | null
          reports_to_employee_id?: string | null
          role_category: Database["public"]["Enums"]["employee_role_category"]
          salary_currency?: string
          start_date: string
          status?: Database["public"]["Enums"]["employee_status"]
          termination_date?: string | null
          termination_reason?: string | null
          termination_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          contract_type?: string | null
          created_at?: string | null
          created_by_admin_id?: string | null
          department?: Database["public"]["Enums"]["department_type"]
          email?: string | null
          employee_number?: string
          employment_end_date?: string | null
          employment_start_date?: string | null
          employment_status_reason?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          full_name?: string
          id?: string
          job_title?: string
          last_status_change_at?: string | null
          last_status_change_by?: string | null
          monthly_salary_gross?: number
          notice_period_days?: number
          phone?: string | null
          probation_end_date?: string | null
          probation_status?: string | null
          reports_to_employee_id?: string | null
          role_category?: Database["public"]["Enums"]["employee_role_category"]
          salary_currency?: string
          start_date?: string
          status?: Database["public"]["Enums"]["employee_status"]
          termination_date?: string | null
          termination_reason?: string | null
          termination_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_last_status_change_by_fkey"
            columns: ["last_status_change_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_reports_to_employee_id_fkey"
            columns: ["reports_to_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_history: {
        Row: {
          escalated_at: string | null
          escalated_by: string | null
          escalation_id: string
          escalation_reason: string | null
          from_level: string
          id: string
          to_level: string
        }
        Insert: {
          escalated_at?: string | null
          escalated_by?: string | null
          escalation_id: string
          escalation_reason?: string | null
          from_level: string
          id?: string
          to_level: string
        }
        Update: {
          escalated_at?: string | null
          escalated_by?: string | null
          escalation_id?: string
          escalation_reason?: string | null
          from_level?: string
          id?: string
          to_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_history_escalated_by_fkey"
            columns: ["escalated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_history_escalation_id_fkey"
            columns: ["escalation_id"]
            isOneToOne: false
            referencedRelation: "hr_escalations"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_approval_audit: {
        Row: {
          action_timestamp: string
          action_type: string
          amount: number
          created_at: string
          currency: string
          expense_number: string
          expense_request_id: string
          id: string
          new_status: string | null
          notes: string | null
          old_status: string | null
          performed_by_employee_id: string | null
          performed_by_role: string | null
        }
        Insert: {
          action_timestamp?: string
          action_type: string
          amount: number
          created_at?: string
          currency?: string
          expense_number: string
          expense_request_id: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          performed_by_employee_id?: string | null
          performed_by_role?: string | null
        }
        Update: {
          action_timestamp?: string
          action_type?: string
          amount?: number
          created_at?: string
          currency?: string
          expense_number?: string
          expense_request_id?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          performed_by_employee_id?: string | null
          performed_by_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_approval_audit_expense_request_id_fkey"
            columns: ["expense_request_id"]
            isOneToOne: false
            referencedRelation: "expense_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_approval_audit_performed_by_employee_id_fkey"
            columns: ["performed_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_requests: {
        Row: {
          account_code: string
          amount: number
          attachment_urls: string[] | null
          created_at: string
          currency: string
          department: string | null
          dept_head_approved: boolean | null
          dept_head_approved_at: string | null
          dept_head_approved_by: string | null
          dept_head_notes: string | null
          description: string
          expense_category: string
          expense_date: string
          expense_number: string
          gm_approved: boolean | null
          gm_approved_at: string | null
          gm_approved_by: string | null
          gm_notes: string | null
          id: string
          is_capex: boolean | null
          journal_entry_id: string | null
          linked_asset_id: string | null
          md_approved: boolean | null
          md_approved_at: string | null
          md_approved_by: string | null
          md_notes: string | null
          paid_at: string | null
          paid_by_admin_id: string | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          receipt_urls: string[] | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: string
          submitted_at: string
          submitted_by_employee_id: string
          super_admin_approval_required: boolean
          super_admin_approved: boolean | null
          super_admin_approved_at: string | null
          super_admin_approved_by: string | null
          super_admin_notes: string | null
          updated_at: string
          vendor_contact: string | null
          vendor_name: string
        }
        Insert: {
          account_code: string
          amount: number
          attachment_urls?: string[] | null
          created_at?: string
          currency?: string
          department?: string | null
          dept_head_approved?: boolean | null
          dept_head_approved_at?: string | null
          dept_head_approved_by?: string | null
          dept_head_notes?: string | null
          description: string
          expense_category: string
          expense_date: string
          expense_number: string
          gm_approved?: boolean | null
          gm_approved_at?: string | null
          gm_approved_by?: string | null
          gm_notes?: string | null
          id?: string
          is_capex?: boolean | null
          journal_entry_id?: string | null
          linked_asset_id?: string | null
          md_approved?: boolean | null
          md_approved_at?: string | null
          md_approved_by?: string | null
          md_notes?: string | null
          paid_at?: string | null
          paid_by_admin_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_urls?: string[] | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string
          submitted_by_employee_id: string
          super_admin_approval_required?: boolean
          super_admin_approved?: boolean | null
          super_admin_approved_at?: string | null
          super_admin_approved_by?: string | null
          super_admin_notes?: string | null
          updated_at?: string
          vendor_contact?: string | null
          vendor_name: string
        }
        Update: {
          account_code?: string
          amount?: number
          attachment_urls?: string[] | null
          created_at?: string
          currency?: string
          department?: string | null
          dept_head_approved?: boolean | null
          dept_head_approved_at?: string | null
          dept_head_approved_by?: string | null
          dept_head_notes?: string | null
          description?: string
          expense_category?: string
          expense_date?: string
          expense_number?: string
          gm_approved?: boolean | null
          gm_approved_at?: string | null
          gm_approved_by?: string | null
          gm_notes?: string | null
          id?: string
          is_capex?: boolean | null
          journal_entry_id?: string | null
          linked_asset_id?: string | null
          md_approved?: boolean | null
          md_approved_at?: string | null
          md_approved_by?: string | null
          md_notes?: string | null
          paid_at?: string | null
          paid_by_admin_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_urls?: string[] | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string
          submitted_by_employee_id?: string
          super_admin_approval_required?: boolean
          super_admin_approved?: boolean | null
          super_admin_approved_at?: string | null
          super_admin_approved_by?: string | null
          super_admin_notes?: string | null
          updated_at?: string
          vendor_contact?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_requests_account_code_fkey"
            columns: ["account_code"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_code"]
          },
          {
            foreignKeyName: "expense_requests_dept_head_approved_by_fkey"
            columns: ["dept_head_approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_gm_approved_by_fkey"
            columns: ["gm_approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_linked_asset_id_fkey"
            columns: ["linked_asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_md_approved_by_fkey"
            columns: ["md_approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_paid_by_admin_id_fkey"
            columns: ["paid_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_submitted_by_employee_id_fkey"
            columns: ["submitted_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_requests_super_admin_approved_by_fkey"
            columns: ["super_admin_approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_assets: {
        Row: {
          account_code: string
          accumulated_depreciation: number
          asset_category: string
          asset_name: string
          country_code: string
          created_at: string | null
          current_book_value: number
          depreciation_method: string
          disposal_amount: number | null
          disposal_date: string | null
          expense_request_id: string | null
          id: string
          notes: string | null
          purchase_amount: number
          purchase_date: string
          residual_value: number
          status: string
          updated_at: string | null
          useful_life_years: number
        }
        Insert: {
          account_code: string
          accumulated_depreciation?: number
          asset_category: string
          asset_name: string
          country_code?: string
          created_at?: string | null
          current_book_value: number
          depreciation_method?: string
          disposal_amount?: number | null
          disposal_date?: string | null
          expense_request_id?: string | null
          id?: string
          notes?: string | null
          purchase_amount: number
          purchase_date: string
          residual_value?: number
          status?: string
          updated_at?: string | null
          useful_life_years?: number
        }
        Update: {
          account_code?: string
          accumulated_depreciation?: number
          asset_category?: string
          asset_name?: string
          country_code?: string
          created_at?: string | null
          current_book_value?: number
          depreciation_method?: string
          disposal_amount?: number | null
          disposal_date?: string | null
          expense_request_id?: string | null
          id?: string
          notes?: string | null
          purchase_amount?: number
          purchase_date?: string
          residual_value?: number
          status?: string
          updated_at?: string | null
          useful_life_years?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixed_assets_account_code_fkey"
            columns: ["account_code"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_code"]
          },
          {
            foreignKeyName: "fixed_assets_expense_request_id_fkey"
            columns: ["expense_request_id"]
            isOneToOne: false
            referencedRelation: "expense_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      general_ledger: {
        Row: {
          account_code: string
          created_at: string | null
          created_by: string | null
          credit_amount: number | null
          currency: string | null
          debit_amount: number | null
          description: string | null
          entry_date: string
          id: string
          reference_number: string | null
          transaction_id: string
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          account_code: string
          created_at?: string | null
          created_by?: string | null
          credit_amount?: number | null
          currency?: string | null
          debit_amount?: number | null
          description?: string | null
          entry_date?: string
          id?: string
          reference_number?: string | null
          transaction_id: string
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          account_code?: string
          created_at?: string | null
          created_by?: string | null
          credit_amount?: number | null
          currency?: string | null
          debit_amount?: number | null
          description?: string | null
          entry_date?: string
          id?: string
          reference_number?: string | null
          transaction_id?: string
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_account_code"
            columns: ["account_code"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_code"]
          },
          {
            foreignKeyName: "fk_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_bonus_config: {
        Row: {
          approved_at: string | null
          approved_by_admin_id: string | null
          bonus_date: string
          bonus_name: string
          bonus_percentage: number
          created_at: string | null
          eligible_categories:
            | Database["public"]["Enums"]["employee_role_category"][]
            | null
          id: string
          is_active: boolean | null
          min_employment_days: number | null
          year: number
        }
        Insert: {
          approved_at?: string | null
          approved_by_admin_id?: string | null
          bonus_date: string
          bonus_name: string
          bonus_percentage?: number
          created_at?: string | null
          eligible_categories?:
            | Database["public"]["Enums"]["employee_role_category"][]
            | null
          id?: string
          is_active?: boolean | null
          min_employment_days?: number | null
          year: number
        }
        Update: {
          approved_at?: string | null
          approved_by_admin_id?: string | null
          bonus_date?: string
          bonus_name?: string
          bonus_percentage?: number
          created_at?: string | null
          eligible_categories?:
            | Database["public"]["Enums"]["employee_role_category"][]
            | null
          id?: string
          is_active?: boolean | null
          min_employment_days?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "holiday_bonus_config_approved_by_admin_id_fkey"
            columns: ["approved_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_escalations: {
        Row: {
          auto_escalate_days: number | null
          created_at: string | null
          current_level: string
          description: string
          employee_id: string
          escalated_at: string | null
          escalated_to_level: string | null
          escalation_type: string
          id: string
          last_escalation_at: string | null
          priority: string | null
          raised_by: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          auto_escalate_days?: number | null
          created_at?: string | null
          current_level?: string
          description: string
          employee_id: string
          escalated_at?: string | null
          escalated_to_level?: string | null
          escalation_type: string
          id?: string
          last_escalation_at?: string | null
          priority?: string | null
          raised_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          auto_escalate_days?: number | null
          created_at?: string | null
          current_level?: string
          description?: string
          employee_id?: string
          escalated_at?: string | null
          escalated_to_level?: string | null
          escalation_type?: string
          id?: string
          last_escalation_at?: string | null
          priority?: string | null
          raised_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_escalations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hr_escalations_resolved_by_fkey"
            columns: ["resolved_by"]
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
      language_availability: {
        Row: {
          created_at: string | null
          enabled_at: string | null
          enabled_by: string | null
          id: string
          is_enabled: boolean | null
          language_code: string
          language_name_english: string
          language_name_native: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          is_enabled?: boolean | null
          language_code: string
          language_name_english: string
          language_name_native: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          is_enabled?: boolean | null
          language_code?: string
          language_name_english?: string
          language_name_native?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "language_availability_enabled_by_fkey"
            columns: ["enabled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          points_amount: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          points_amount: number
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          points_amount?: number
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards_catalog: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          points_cost: number
          reward_description: string
          reward_name: string
          reward_type: string
          stock_quantity: number | null
          terms_conditions: string | null
          updated_at: string
          value_amount: number | null
          value_currency: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          points_cost: number
          reward_description: string
          reward_name: string
          reward_type: string
          stock_quantity?: number | null
          terms_conditions?: string | null
          updated_at?: string
          value_amount?: number | null
          value_currency?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          points_cost?: number
          reward_description?: string
          reward_name?: string
          reward_type?: string
          stock_quantity?: number | null
          terms_conditions?: string | null
          updated_at?: string
          value_amount?: number | null
          value_currency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_catalog_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards_redemptions: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          fulfilled_at: string | null
          id: string
          member_notes: string | null
          points_spent: number
          redemption_code: string | null
          redemption_status: string
          rejection_reason: string | null
          reward_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          member_notes?: string | null
          points_spent: number
          redemption_code?: string | null
          redemption_status?: string
          rejection_reason?: string | null
          reward_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          member_notes?: string | null
          points_spent?: number
          redemption_code?: string | null
          redemption_status?: string
          rejection_reason?: string | null
          reward_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_redemptions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_rewards_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_rewards_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tier_config: {
        Row: {
          bonus_percentage: number
          created_at: string
          created_by: string | null
          effective_from_date: string
          id: string
          is_active: boolean
          notes: string | null
          referral_threshold: number
          tier_id: string
        }
        Insert: {
          bonus_percentage: number
          created_at?: string
          created_by?: string | null
          effective_from_date: string
          id?: string
          is_active?: boolean
          notes?: string | null
          referral_threshold: number
          tier_id: string
        }
        Update: {
          bonus_percentage?: number
          created_at?: string
          created_by?: string | null
          effective_from_date?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          referral_threshold?: number
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_tier_config_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_tier_config_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tier_config_audit: {
        Row: {
          action_type: string
          changed_at: string
          changed_by: string
          config_id: string
          id: string
          new_bonus_percentage: number | null
          new_effective_date: string | null
          new_referral_threshold: number | null
          notes: string | null
          old_bonus_percentage: number | null
          old_effective_date: string | null
          old_referral_threshold: number | null
          reason: string
          tier_id: string
        }
        Insert: {
          action_type: string
          changed_at?: string
          changed_by: string
          config_id: string
          id?: string
          new_bonus_percentage?: number | null
          new_effective_date?: string | null
          new_referral_threshold?: number | null
          notes?: string | null
          old_bonus_percentage?: number | null
          old_effective_date?: string | null
          old_referral_threshold?: number | null
          reason: string
          tier_id: string
        }
        Update: {
          action_type?: string
          changed_at?: string
          changed_by?: string
          config_id?: string
          id?: string
          new_bonus_percentage?: number | null
          new_effective_date?: string | null
          new_referral_threshold?: number | null
          notes?: string | null
          old_bonus_percentage?: number | null
          old_effective_date?: string | null
          old_referral_threshold?: number | null
          reason?: string
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_tier_config_audit_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_tier_config_audit_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tier_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_tier_config_audit_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tier_translations: {
        Row: {
          achievement_message: string
          benefits_description: string | null
          created_at: string
          description: string
          how_to_achieve: string
          id: string
          language_code: string
          tier_id: string
          tier_name_translated: string
          updated_at: string
        }
        Insert: {
          achievement_message: string
          benefits_description?: string | null
          created_at?: string
          description: string
          how_to_achieve: string
          id?: string
          language_code: string
          tier_id: string
          tier_name_translated: string
          updated_at?: string
        }
        Update: {
          achievement_message?: string
          benefits_description?: string | null
          created_at?: string
          description?: string
          how_to_achieve?: string
          id?: string
          language_code?: string
          tier_id?: string
          tier_name_translated?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_tier_translations_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_tiers: {
        Row: {
          achievement_bonus_amount: number | null
          achievement_bonus_enabled: boolean | null
          badge_icon_url: string | null
          benefits: Json
          bonus_percentage: number
          created_at: string
          id: string
          is_active: boolean
          referral_threshold: number
          requires_enhanced_kyc: boolean | null
          tier_level: number
          tier_name: string
          updated_at: string
        }
        Insert: {
          achievement_bonus_amount?: number | null
          achievement_bonus_enabled?: boolean | null
          badge_icon_url?: string | null
          benefits?: Json
          bonus_percentage?: number
          created_at?: string
          id?: string
          is_active?: boolean
          referral_threshold?: number
          requires_enhanced_kyc?: boolean | null
          tier_level: number
          tier_name: string
          updated_at?: string
        }
        Update: {
          achievement_bonus_amount?: number | null
          achievement_bonus_enabled?: boolean | null
          badge_icon_url?: string | null
          benefits?: Json
          bonus_percentage?: number
          created_at?: string
          id?: string
          is_active?: boolean
          referral_threshold?: number
          requires_enhanced_kyc?: boolean | null
          tier_level?: number
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_ui_translations: {
        Row: {
          context: string | null
          created_at: string
          id: string
          language_code: string
          translation_key: string
          translation_value: string
          updated_at: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          language_code: string
          translation_key: string
          translation_value: string
          updated_at?: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          language_code?: string
          translation_key?: string
          translation_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      master_admin_summary_queue: {
        Row: {
          consolidated_summary_id: string | null
          created_at: string | null
          delivery_attempts: number
          email_body: string | null
          email_subject: string | null
          error_message: string | null
          id: string
          last_attempt_at: string | null
          period_month: number
          period_name: string
          period_year: number
          recipient_email: string | null
          scheduled_send_date: string
          sent_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          consolidated_summary_id?: string | null
          created_at?: string | null
          delivery_attempts?: number
          email_body?: string | null
          email_subject?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          period_month: number
          period_name: string
          period_year: number
          recipient_email?: string | null
          scheduled_send_date: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          consolidated_summary_id?: string | null
          created_at?: string | null
          delivery_attempts?: number
          email_body?: string | null
          email_subject?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          period_month?: number
          period_name?: string
          period_year?: number
          recipient_email?: string | null
          scheduled_send_date?: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_admin_summary_queue_consolidated_summary_id_fkey"
            columns: ["consolidated_summary_id"]
            isOneToOne: false
            referencedRelation: "consolidated_master_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      member_bank_details: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_name: string
          branch_name: string | null
          country_code: string
          created_at: string | null
          id: string
          is_verified: boolean | null
          member_id: string
          updated_at: string | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_holder_name: string
          account_number: string
          bank_name: string
          branch_name?: string | null
          country_code: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          member_id: string
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_name?: string
          branch_name?: string | null
          country_code?: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          member_id?: string
          updated_at?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_bank_details_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_bank_details_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_loyalty_status: {
        Row: {
          created_at: string
          current_tier_id: string
          id: string
          lifetime_points: number
          next_tier_evaluation_date: string | null
          points_to_next_tier: number | null
          successful_referrals: number | null
          tier_achieved_at: string | null
          tier_locked_until: string | null
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_tier_id: string
          id?: string
          lifetime_points?: number
          next_tier_evaluation_date?: string | null
          points_to_next_tier?: number | null
          successful_referrals?: number | null
          tier_achieved_at?: string | null
          tier_locked_until?: string | null
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_tier_id?: string
          id?: string
          lifetime_points?: number
          next_tier_evaluation_date?: string | null
          points_to_next_tier?: number | null
          successful_referrals?: number | null
          tier_achieved_at?: string | null
          tier_locked_until?: string | null
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_loyalty_status_current_tier_id_fkey"
            columns: ["current_tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_loyalty_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      monthly_close_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          id: string
          locked_at: string | null
          locked_by: string | null
          period_end_date: string
          period_month: number
          period_start_date: string
          period_year: number
          status: string
          unlock_reason: string | null
          unlocked_at: string | null
          unlocked_by: string | null
          updated_at: string | null
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          period_end_date: string
          period_month: number
          period_start_date: string
          period_year: number
          status?: string
          unlock_reason?: string | null
          unlocked_at?: string | null
          unlocked_by?: string | null
          updated_at?: string | null
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          period_end_date?: string
          period_month?: number
          period_start_date?: string
          period_year?: number
          status?: string
          unlock_reason?: string | null
          unlocked_at?: string | null
          unlocked_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_close_periods_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_close_periods_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_close_periods_unlocked_by_fkey"
            columns: ["unlocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_financial_reports: {
        Row: {
          close_period_id: string
          created_at: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          report_data: Json
          report_type: string
        }
        Insert: {
          close_period_id: string
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          report_data: Json
          report_type: string
        }
        Update: {
          close_period_id?: string
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          report_data?: Json
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_financial_reports_close_period_id_fkey"
            columns: ["close_period_id"]
            isOneToOne: false
            referencedRelation: "financial_close_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_financial_reports_close_period_id_fkey"
            columns: ["close_period_id"]
            isOneToOne: false
            referencedRelation: "monthly_close_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_financial_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_profit_loss: {
        Row: {
          country_code: string
          created_at: string | null
          currency: string
          expense_breakdown: Json
          finalized_at: string | null
          finalized_by: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          net_profit: number
          period_end_date: string
          period_month: number
          period_start_date: string
          period_year: number
          revenue_breakdown: Json
          status: string
          total_expenses: number
          total_revenue: number
          updated_at: string | null
        }
        Insert: {
          country_code?: string
          created_at?: string | null
          currency?: string
          expense_breakdown?: Json
          finalized_at?: string | null
          finalized_by?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          net_profit?: number
          period_end_date: string
          period_month: number
          period_start_date: string
          period_year: number
          revenue_breakdown?: Json
          status?: string
          total_expenses?: number
          total_revenue?: number
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          currency?: string
          expense_breakdown?: Json
          finalized_at?: string | null
          finalized_by?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          net_profit?: number
          period_end_date?: string
          period_month?: number
          period_start_date?: string
          period_year?: number
          revenue_breakdown?: Json
          status?: string
          total_expenses?: number
          total_revenue?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_profit_loss_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_profit_loss_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_profit_loss_period_year_period_month_fkey"
            columns: ["period_year", "period_month"]
            isOneToOne: false
            referencedRelation: "financial_close_summary"
            referencedColumns: ["period_year", "period_month"]
          },
          {
            foreignKeyName: "monthly_profit_loss_period_year_period_month_fkey"
            columns: ["period_year", "period_month"]
            isOneToOne: false
            referencedRelation: "monthly_close_periods"
            referencedColumns: ["period_year", "period_month"]
          },
        ]
      }
      notification_audit_log: {
        Row: {
          action_type: string
          id: string
          metadata: Json | null
          notification_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          id?: string
          metadata?: Json | null
          notification_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          id?: string
          metadata?: Json | null
          notification_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_audit_log_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          created_at: string
          failed_reason: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          recipient_id: string
          reference_id: string | null
          reference_type: string | null
          retry_count: number | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          failed_reason?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          recipient_id: string
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          failed_reason?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          recipient_id?: string
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          description: string
          expires_at: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          notification_type: string
          priority: string
          read_at: string | null
          recipient_id: string
          recipient_role: string
          reference_id: string | null
          reference_type: string | null
          title: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type: string
          priority?: string
          read_at?: string | null
          recipient_id: string
          recipient_role: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          notification_type?: string
          priority?: string
          read_at?: string | null
          recipient_id?: string
          recipient_role?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_audit_log: {
        Row: {
          action: string
          admin_notes: string | null
          amount: number | null
          currency_code: string | null
          id: string
          metadata: Json | null
          new_status: string | null
          old_status: string | null
          payment_request_id: string
          performed_at: string | null
          performed_by: string | null
          rejection_reason: string | null
        }
        Insert: {
          action: string
          admin_notes?: string | null
          amount?: number | null
          currency_code?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          payment_request_id: string
          performed_at?: string | null
          performed_by?: string | null
          rejection_reason?: string | null
        }
        Update: {
          action?: string
          admin_notes?: string | null
          amount?: number | null
          currency_code?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          payment_request_id?: string
          performed_at?: string | null
          performed_by?: string | null
          rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_audit_log_payment_request_id_fkey"
            columns: ["payment_request_id"]
            isOneToOne: false
            referencedRelation: "payment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          bank_details_snapshot: Json | null
          created_at: string | null
          currency_code: string
          id: string
          member_id: string
          payment_type: string
          rejection_reason: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_transaction_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          bank_details_snapshot?: Json | null
          created_at?: string | null
          currency_code: string
          id?: string
          member_id: string
          payment_type: string
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_transaction_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          bank_details_snapshot?: Json | null
          created_at?: string | null
          currency_code?: string
          id?: string
          member_id?: string
          payment_type?: string
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_transaction_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
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
      payroll_approvals: {
        Row: {
          action: string
          approved_at: string | null
          approver_admin_id: string
          approver_role: Database["public"]["Enums"]["employee_role_category"]
          comments: string | null
          id: string
          payroll_run_id: string
        }
        Insert: {
          action: string
          approved_at?: string | null
          approver_admin_id: string
          approver_role: Database["public"]["Enums"]["employee_role_category"]
          comments?: string | null
          id?: string
          payroll_run_id: string
        }
        Update: {
          action?: string
          approved_at?: string | null
          approver_admin_id?: string
          approver_role?: Database["public"]["Enums"]["employee_role_category"]
          comments?: string | null
          id?: string
          payroll_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_approvals_approver_admin_id_fkey"
            columns: ["approver_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_approvals_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          bonus_amount: number | null
          bonus_type: string | null
          created_at: string | null
          employee_id: string
          gross_salary: number
          id: string
          net_salary: number | null
          other_deductions: number | null
          paid_at: string | null
          payment_status: string | null
          payroll_run_id: string
          provident_fund: number | null
          retention_deduction: number | null
          tax_deduction: number | null
        }
        Insert: {
          bonus_amount?: number | null
          bonus_type?: string | null
          created_at?: string | null
          employee_id: string
          gross_salary: number
          id?: string
          net_salary?: number | null
          other_deductions?: number | null
          paid_at?: string | null
          payment_status?: string | null
          payroll_run_id: string
          provident_fund?: number | null
          retention_deduction?: number | null
          tax_deduction?: number | null
        }
        Update: {
          bonus_amount?: number | null
          bonus_type?: string | null
          created_at?: string | null
          employee_id?: string
          gross_salary?: number
          id?: string
          net_salary?: number | null
          other_deductions?: number | null
          paid_at?: string | null
          payment_status?: string | null
          payroll_run_id?: string
          provident_fund?: number | null
          retention_deduction?: number | null
          tax_deduction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          locked_at: string | null
          locked_by: string | null
          month: number
          notes: string | null
          period_name: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
          year: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          month: number
          notes?: string | null
          period_name: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          year: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          month?: number
          notes?: string | null
          period_name?: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_periods_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_periods_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_periods_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_run_snapshots: {
        Row: {
          deductions_total: number | null
          employee_id: string
          generated_at: string | null
          gross_salary: number
          id: string
          net_pay: number
          payroll_period_id: string
          status: string
        }
        Insert: {
          deductions_total?: number | null
          employee_id: string
          generated_at?: string | null
          gross_salary: number
          id?: string
          net_pay: number
          payroll_period_id: string
          status?: string
        }
        Update: {
          deductions_total?: number | null
          employee_id?: string
          generated_at?: string | null
          gross_salary?: number
          id?: string
          net_pay?: number
          payroll_period_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_run_snapshots_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_run_snapshots_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          approved_at: string | null
          approved_by_admin_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by_admin_id: string | null
          employee_count: number | null
          id: string
          journal_entry_id: string | null
          md_approved: boolean | null
          md_approved_at: string | null
          md_approved_by: string | null
          pay_period_end: string
          pay_period_start: string
          payment_date: string
          period_month: number | null
          period_year: number | null
          posted_to_ledger: boolean | null
          posted_to_ledger_at: string | null
          processed_at: string | null
          run_number: string
          status: Database["public"]["Enums"]["payroll_run_status"]
          super_admin_approval_required: boolean | null
          super_admin_approved: boolean | null
          super_admin_approved_at: string | null
          super_admin_approved_by: string | null
          total_deductions: number | null
          total_gross: number | null
          total_net: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by_admin_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by_admin_id?: string | null
          employee_count?: number | null
          id?: string
          journal_entry_id?: string | null
          md_approved?: boolean | null
          md_approved_at?: string | null
          md_approved_by?: string | null
          pay_period_end: string
          pay_period_start: string
          payment_date: string
          period_month?: number | null
          period_year?: number | null
          posted_to_ledger?: boolean | null
          posted_to_ledger_at?: string | null
          processed_at?: string | null
          run_number: string
          status?: Database["public"]["Enums"]["payroll_run_status"]
          super_admin_approval_required?: boolean | null
          super_admin_approved?: boolean | null
          super_admin_approved_at?: string | null
          super_admin_approved_by?: string | null
          total_deductions?: number | null
          total_gross?: number | null
          total_net?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by_admin_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by_admin_id?: string | null
          employee_count?: number | null
          id?: string
          journal_entry_id?: string | null
          md_approved?: boolean | null
          md_approved_at?: string | null
          md_approved_by?: string | null
          pay_period_end?: string
          pay_period_start?: string
          payment_date?: string
          period_month?: number | null
          period_year?: number | null
          posted_to_ledger?: boolean | null
          posted_to_ledger_at?: string | null
          processed_at?: string | null
          run_number?: string
          status?: Database["public"]["Enums"]["payroll_run_status"]
          super_admin_approval_required?: boolean | null
          super_admin_approved?: boolean | null
          super_admin_approved_at?: string | null
          super_admin_approved_by?: string | null
          total_deductions?: number | null
          total_gross?: number | null
          total_net?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_approved_by_admin_id_fkey"
            columns: ["approved_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_md_approved_by_fkey"
            columns: ["md_approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_super_admin_approved_by_fkey"
            columns: ["super_admin_approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          created_at: string | null
          deductions_total: number | null
          delivery_status: string
          employee_id: string
          gross_salary: number
          id: string
          issued_at: string | null
          net_pay: number
          payroll_period_id: string
          payslip_pdf_url: string | null
        }
        Insert: {
          created_at?: string | null
          deductions_total?: number | null
          delivery_status?: string
          employee_id: string
          gross_salary: number
          id?: string
          issued_at?: string | null
          net_pay: number
          payroll_period_id: string
          payslip_pdf_url?: string | null
        }
        Update: {
          created_at?: string | null
          deductions_total?: number | null
          delivery_status?: string
          employee_id?: string
          gross_salary?: number
          id?: string
          issued_at?: string | null
          net_pay?: number
          payroll_period_id?: string
          payslip_pdf_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      petty_cash_spends: {
        Row: {
          amount: number
          created_at: string
          description: string
          expense_request_id: string | null
          id: string
          receipt_url: string | null
          recorded_by: string | null
          spend_date: string
          updated_at: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          expense_request_id?: string | null
          id?: string
          receipt_url?: string | null
          recorded_by?: string | null
          spend_date?: string
          updated_at?: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          expense_request_id?: string | null
          id?: string
          receipt_url?: string | null
          recorded_by?: string | null
          spend_date?: string
          updated_at?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "petty_cash_spends_expense_request_id_fkey"
            columns: ["expense_request_id"]
            isOneToOne: false
            referencedRelation: "expense_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petty_cash_spends_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petty_cash_spends_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "petty_cash_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      petty_cash_transactions: {
        Row: {
          amount: number
          approval_status: string
          approved_by: string | null
          country_code: string
          created_at: string | null
          description: string
          expense_category: string | null
          id: string
          journal_entry_id: string | null
          receipt_url: string | null
          recorded_by: string
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          approval_status?: string
          approved_by?: string | null
          country_code?: string
          created_at?: string | null
          description: string
          expense_category?: string | null
          id?: string
          journal_entry_id?: string | null
          receipt_url?: string | null
          recorded_by: string
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          approval_status?: string
          approved_by?: string | null
          country_code?: string
          created_at?: string | null
          description?: string
          expense_category?: string | null
          id?: string
          journal_entry_id?: string | null
          receipt_url?: string | null
          recorded_by?: string
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "petty_cash_transactions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petty_cash_transactions_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petty_cash_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "petty_cash_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      petty_cash_wallets: {
        Row: {
          account_code: string
          country_code: string
          created_at: string | null
          current_balance: number
          custodian_employee_id: string | null
          id: string
          location: string
          max_single_transaction: number
          status: string
          updated_at: string | null
          wallet_name: string
        }
        Insert: {
          account_code?: string
          country_code?: string
          created_at?: string | null
          current_balance?: number
          custodian_employee_id?: string | null
          id?: string
          location: string
          max_single_transaction?: number
          status?: string
          updated_at?: string | null
          wallet_name: string
        }
        Update: {
          account_code?: string
          country_code?: string
          created_at?: string | null
          current_balance?: number
          custodian_employee_id?: string | null
          id?: string
          location?: string
          max_single_transaction?: number
          status?: string
          updated_at?: string | null
          wallet_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "petty_cash_wallets_account_code_fkey"
            columns: ["account_code"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_code"]
          },
          {
            foreignKeyName: "petty_cash_wallets_custodian_employee_id_fkey"
            columns: ["custodian_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_state: {
        Row: {
          country_code: string
          created_at: string | null
          id: string
          is_platform_locked: boolean
          lock_reason: string | null
          locked_at: string | null
          locked_by: string | null
          unlocked_at: string | null
          unlocked_by: string | null
          updated_at: string | null
        }
        Insert: {
          country_code?: string
          created_at?: string | null
          id?: string
          is_platform_locked?: boolean
          lock_reason?: string | null
          locked_at?: string | null
          locked_by?: string | null
          unlocked_at?: string | null
          unlocked_by?: string | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          id?: string
          is_platform_locked?: boolean
          lock_reason?: string | null
          locked_at?: string | null
          locked_by?: string | null
          unlocked_at?: string | null
          unlocked_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_state_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_state_unlocked_by_fkey"
            columns: ["unlocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_claim_reports: {
        Row: {
          claimed_amount: number
          claimed_prizes: number
          draw_id: string
          generated_at: string | null
          generated_by: string | null
          id: string
          is_immutable: boolean | null
          report_data: Json
          report_date: string
          report_type: string
          rollover_amount: number
          sent_at: string | null
          sent_to_admins: boolean | null
          total_prize_amount: number
          total_prizes: number
          unclaimed_amount: number
          unclaimed_prizes: number
        }
        Insert: {
          claimed_amount?: number
          claimed_prizes?: number
          draw_id: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          is_immutable?: boolean | null
          report_data: Json
          report_date?: string
          report_type?: string
          rollover_amount?: number
          sent_at?: string | null
          sent_to_admins?: boolean | null
          total_prize_amount?: number
          total_prizes?: number
          unclaimed_amount?: number
          unclaimed_prizes?: number
        }
        Update: {
          claimed_amount?: number
          claimed_prizes?: number
          draw_id?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          is_immutable?: boolean | null
          report_data?: Json
          report_date?: string
          report_type?: string
          rollover_amount?: number
          sent_at?: string | null
          sent_to_admins?: boolean | null
          total_prize_amount?: number
          total_prizes?: number
          unclaimed_amount?: number
          unclaimed_prizes?: number
        }
        Relationships: [
          {
            foreignKeyName: "prize_claim_reports_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "prize_draws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_claim_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_draw_closure_reports: {
        Row: {
          created_at: string | null
          draw_date: string
          draw_id: string
          draw_name: string
          draw_type: string
          generated_at: string | null
          generated_by: string | null
          id: string
          is_final: boolean | null
          report_data: Json
          rollover_to_community_pool: number
          rollover_to_random_pool: number
          total_amount_allocated: number
          total_amount_claimed: number
          total_amount_expired: number
          total_prizes_claimed: number
          total_prizes_created: number
          total_prizes_expired: number
        }
        Insert: {
          created_at?: string | null
          draw_date: string
          draw_id: string
          draw_name: string
          draw_type: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          is_final?: boolean | null
          report_data: Json
          rollover_to_community_pool?: number
          rollover_to_random_pool?: number
          total_amount_allocated?: number
          total_amount_claimed?: number
          total_amount_expired?: number
          total_prizes_claimed?: number
          total_prizes_created?: number
          total_prizes_expired?: number
        }
        Update: {
          created_at?: string | null
          draw_date?: string
          draw_id?: string
          draw_name?: string
          draw_type?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          is_final?: boolean | null
          report_data?: Json
          rollover_to_community_pool?: number
          rollover_to_random_pool?: number
          total_amount_allocated?: number
          total_amount_claimed?: number
          total_amount_expired?: number
          total_prizes_claimed?: number
          total_prizes_created?: number
          total_prizes_expired?: number
        }
        Relationships: [
          {
            foreignKeyName: "prize_draw_closure_reports_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: true
            referencedRelation: "prize_draws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_draw_closure_reports_generated_by_fkey"
            columns: ["generated_by"]
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
          deducted_from_pool: boolean | null
          description: string | null
          draw_id: string
          id: string
          is_active: boolean | null
          number_of_winners: number
          pool_deduction_timestamp: string | null
          prize_type: string
          prize_value_amount: number
          sub_pool_type: string | null
          title: string
        }
        Insert: {
          award_type: string
          created_at?: string | null
          currency_code?: string
          deducted_from_pool?: boolean | null
          description?: string | null
          draw_id: string
          id?: string
          is_active?: boolean | null
          number_of_winners?: number
          pool_deduction_timestamp?: string | null
          prize_type: string
          prize_value_amount: number
          sub_pool_type?: string | null
          title: string
        }
        Update: {
          award_type?: string
          created_at?: string | null
          currency_code?: string
          deducted_from_pool?: boolean | null
          description?: string | null
          draw_id?: string
          id?: string
          is_active?: boolean | null
          number_of_winners?: number
          pool_deduction_timestamp?: string | null
          prize_type?: string
          prize_value_amount?: number
          sub_pool_type?: string | null
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
      prize_draw_reports: {
        Row: {
          auto_executed: boolean | null
          country_code: string
          created_at: string
          draw_date: string
          draw_id: string
          draw_name: string
          draw_time: string
          executed_by: string | null
          execution_timestamp: string
          id: string
          leftover_amount: number
          pool_balance_after: number
          pool_balance_before: number
          pool_type: string
          report_signature: string
          total_awarded: number
          total_entries: number
          total_prize_amount: number
          total_winners: number
          winner_ids: string[]
        }
        Insert: {
          auto_executed?: boolean | null
          country_code?: string
          created_at?: string
          draw_date: string
          draw_id: string
          draw_name: string
          draw_time: string
          executed_by?: string | null
          execution_timestamp?: string
          id?: string
          leftover_amount?: number
          pool_balance_after: number
          pool_balance_before: number
          pool_type: string
          report_signature: string
          total_awarded: number
          total_entries?: number
          total_prize_amount: number
          total_winners?: number
          winner_ids?: string[]
        }
        Update: {
          auto_executed?: boolean | null
          country_code?: string
          created_at?: string
          draw_date?: string
          draw_id?: string
          draw_name?: string
          draw_time?: string
          executed_by?: string | null
          execution_timestamp?: string
          id?: string
          leftover_amount?: number
          pool_balance_after?: number
          pool_balance_before?: number
          pool_type?: string
          report_signature?: string
          total_awarded?: number
          total_entries?: number
          total_prize_amount?: number
          total_winners?: number
          winner_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "prize_draw_reports_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: true
            referencedRelation: "prize_draws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_draw_reports_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_draw_winners: {
        Row: {
          admin_reason: string | null
          award_type: string
          claim_blocked_reason: string | null
          claim_deadline: string | null
          claim_deadline_at: string | null
          claim_method: string | null
          claim_status: string
          claimed_at: string | null
          draw_id: string
          expired_at: string | null
          id: string
          paid_at: string | null
          payout_status: string
          prize_id: string
          rollover_amount: number | null
          rollover_processed: boolean | null
          selected_at: string | null
          selected_by_admin_id: string | null
          winner_user_id: string
        }
        Insert: {
          admin_reason?: string | null
          award_type: string
          claim_blocked_reason?: string | null
          claim_deadline?: string | null
          claim_deadline_at?: string | null
          claim_method?: string | null
          claim_status?: string
          claimed_at?: string | null
          draw_id: string
          expired_at?: string | null
          id?: string
          paid_at?: string | null
          payout_status?: string
          prize_id: string
          rollover_amount?: number | null
          rollover_processed?: boolean | null
          selected_at?: string | null
          selected_by_admin_id?: string | null
          winner_user_id: string
        }
        Update: {
          admin_reason?: string | null
          award_type?: string
          claim_blocked_reason?: string | null
          claim_deadline?: string | null
          claim_deadline_at?: string | null
          claim_method?: string | null
          claim_status?: string
          claimed_at?: string | null
          draw_id?: string
          expired_at?: string | null
          id?: string
          paid_at?: string | null
          payout_status?: string
          prize_id?: string
          rollover_amount?: number | null
          rollover_processed?: boolean | null
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
          auto_executed: boolean | null
          completed_at: string | null
          country_code: string
          created_at: string | null
          created_by: string
          currency: string
          description: string | null
          disclaimer_text: string | null
          draw_date: string
          draw_name: string | null
          draw_time: string | null
          entry_cutoff_time: string | null
          estimated_prize_pool_amount: number | null
          estimated_prize_pool_currency: string | null
          estimated_prize_pool_percentage: number | null
          executed_at: string | null
          execution_report: Json | null
          fairness_locked: boolean | null
          forecast_member_count: number | null
          id: string
          leftover_amount: number | null
          notes: string | null
          number_of_winners: number
          pool_type: string | null
          prize_value: number
          status: Database["public"]["Enums"]["prize_draw_status"]
          sub_pool_type: string | null
          title: string
        }
        Insert: {
          announced_at?: string | null
          announcement_status?: string
          auto_executed?: boolean | null
          completed_at?: string | null
          country_code?: string
          created_at?: string | null
          created_by: string
          currency?: string
          description?: string | null
          disclaimer_text?: string | null
          draw_date: string
          draw_name?: string | null
          draw_time?: string | null
          entry_cutoff_time?: string | null
          estimated_prize_pool_amount?: number | null
          estimated_prize_pool_currency?: string | null
          estimated_prize_pool_percentage?: number | null
          executed_at?: string | null
          execution_report?: Json | null
          fairness_locked?: boolean | null
          forecast_member_count?: number | null
          id?: string
          leftover_amount?: number | null
          notes?: string | null
          number_of_winners?: number
          pool_type?: string | null
          prize_value: number
          status?: Database["public"]["Enums"]["prize_draw_status"]
          sub_pool_type?: string | null
          title: string
        }
        Update: {
          announced_at?: string | null
          announcement_status?: string
          auto_executed?: boolean | null
          completed_at?: string | null
          country_code?: string
          created_at?: string | null
          created_by?: string
          currency?: string
          description?: string | null
          disclaimer_text?: string | null
          draw_date?: string
          draw_name?: string | null
          draw_time?: string | null
          entry_cutoff_time?: string | null
          estimated_prize_pool_amount?: number | null
          estimated_prize_pool_currency?: string | null
          estimated_prize_pool_percentage?: number | null
          executed_at?: string | null
          execution_report?: Json | null
          fairness_locked?: boolean | null
          forecast_member_count?: number | null
          id?: string
          leftover_amount?: number | null
          notes?: string | null
          number_of_winners?: number
          pool_type?: string | null
          prize_value?: number
          status?: Database["public"]["Enums"]["prize_draw_status"]
          sub_pool_type?: string | null
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
      prize_notification_queue: {
        Row: {
          created_at: string | null
          draw_id: string
          id: string
          notification_type: string
          recipient_user_id: string
          sent_at: string | null
          status: string | null
          template_data: Json
        }
        Insert: {
          created_at?: string | null
          draw_id: string
          id?: string
          notification_type: string
          recipient_user_id: string
          sent_at?: string | null
          status?: string | null
          template_data: Json
        }
        Update: {
          created_at?: string | null
          draw_id?: string
          id?: string
          notification_type?: string
          recipient_user_id?: string
          sent_at?: string | null
          status?: string | null
          template_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "prize_notification_queue_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "prize_draws"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_notification_queue_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_pool_config: {
        Row: {
          allocation_percentage: number
          country_code: string
          created_at: string
          effective_from: string
          id: string
          notes: string | null
          set_by_admin_id: string | null
          updated_at: string
        }
        Insert: {
          allocation_percentage: number
          country_code: string
          created_at?: string
          effective_from: string
          id?: string
          notes?: string | null
          set_by_admin_id?: string | null
          updated_at?: string
        }
        Update: {
          allocation_percentage?: number
          country_code?: string
          created_at?: string
          effective_from?: string
          id?: string
          notes?: string | null
          set_by_admin_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prize_pool_config_set_by_admin_id_fkey"
            columns: ["set_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_pool_config_audit: {
        Row: {
          action_type: string
          change_reason: string | null
          changed_at: string
          changed_by: string
          config_id: string
          country_code: string
          id: string
          new_allocation_percentage: number | null
          new_effective_from: string | null
          notes: string | null
          old_allocation_percentage: number | null
          old_effective_from: string | null
        }
        Insert: {
          action_type: string
          change_reason?: string | null
          changed_at?: string
          changed_by: string
          config_id: string
          country_code: string
          id?: string
          new_allocation_percentage?: number | null
          new_effective_from?: string | null
          notes?: string | null
          old_allocation_percentage?: number | null
          old_effective_from?: string | null
        }
        Update: {
          action_type?: string
          change_reason?: string | null
          changed_at?: string
          changed_by?: string
          config_id?: string
          country_code?: string
          id?: string
          new_allocation_percentage?: number | null
          new_effective_from?: string | null
          notes?: string | null
          old_allocation_percentage?: number | null
          old_effective_from?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prize_pool_config_audit_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_pool_config_audit_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "prize_pool_config"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_pool_split_config: {
        Row: {
          community_percentage: number
          country_code: string
          created_at: string | null
          effective_from: string
          id: string
          random_percentage: number
          set_by_admin_id: string | null
        }
        Insert: {
          community_percentage: number
          country_code: string
          created_at?: string | null
          effective_from: string
          id?: string
          random_percentage: number
          set_by_admin_id?: string | null
        }
        Update: {
          community_percentage?: number
          country_code?: string
          created_at?: string | null
          effective_from?: string
          id?: string
          random_percentage?: number
          set_by_admin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prize_pool_split_config_set_by_admin_id_fkey"
            columns: ["set_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_pool_sub_accounts: {
        Row: {
          country_code: string
          created_at: string | null
          current_balance: number
          id: string
          last_updated_at: string | null
          sub_pool_type: string
        }
        Insert: {
          country_code?: string
          created_at?: string | null
          current_balance?: number
          id?: string
          last_updated_at?: string | null
          sub_pool_type: string
        }
        Update: {
          country_code?: string
          created_at?: string | null
          current_balance?: number
          id?: string
          last_updated_at?: string | null
          sub_pool_type?: string
        }
        Relationships: []
      }
      prize_pool_sub_ledger: {
        Row: {
          amount: number
          balance_after: number
          country_code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          sub_pool_type: string
          transaction_date: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          country_code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          sub_pool_type: string
          transaction_date?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          country_code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          sub_pool_type?: string
          transaction_date?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "prize_pool_sub_ledger_created_by_fkey"
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
          is_test_account: boolean | null
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
          welcome_seen: boolean | null
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
          is_test_account?: boolean | null
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
          welcome_seen?: boolean | null
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
          is_test_account?: boolean | null
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
          welcome_seen?: boolean | null
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
      system_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings_audit_log: {
        Row: {
          changed_at: string | null
          changed_by: string
          id: string
          new_value: string
          old_value: string | null
          setting_key: string
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          id?: string
          new_value: string
          old_value?: string | null
          setting_key: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          id?: string
          new_value?: string
          old_value?: string | null
          setting_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      termination_appeals: {
        Row: {
          appeal_reason: string
          decision: string | null
          decision_notes: string | null
          employee_id: string
          id: string
          reviewed_at: string | null
          reviewed_by_admin_id: string | null
          status: string
          submitted_at: string | null
          supporting_documents: string[] | null
          termination_id: string
        }
        Insert: {
          appeal_reason: string
          decision?: string | null
          decision_notes?: string | null
          employee_id: string
          id?: string
          reviewed_at?: string | null
          reviewed_by_admin_id?: string | null
          status?: string
          submitted_at?: string | null
          supporting_documents?: string[] | null
          termination_id: string
        }
        Update: {
          appeal_reason?: string
          decision?: string | null
          decision_notes?: string | null
          employee_id?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by_admin_id?: string | null
          status?: string
          submitted_at?: string | null
          supporting_documents?: string[] | null
          termination_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "termination_appeals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termination_appeals_reviewed_by_admin_id_fkey"
            columns: ["reviewed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termination_appeals_termination_id_fkey"
            columns: ["termination_id"]
            isOneToOne: true
            referencedRelation: "employee_terminations"
            referencedColumns: ["id"]
          },
        ]
      }
      test_data_metadata: {
        Row: {
          admin_count: number | null
          agent_count: number | null
          cleaned_up_by: string | null
          cleanup_timestamp: string | null
          generated_by: string | null
          generation_timestamp: string | null
          id: string
          is_cleaned_up: boolean | null
          member_count: number | null
        }
        Insert: {
          admin_count?: number | null
          agent_count?: number | null
          cleaned_up_by?: string | null
          cleanup_timestamp?: string | null
          generated_by?: string | null
          generation_timestamp?: string | null
          id?: string
          is_cleaned_up?: boolean | null
          member_count?: number | null
        }
        Update: {
          admin_count?: number | null
          agent_count?: number | null
          cleaned_up_by?: string | null
          cleanup_timestamp?: string | null
          generated_by?: string | null
          generation_timestamp?: string | null
          id?: string
          is_cleaned_up?: boolean | null
          member_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cleaned_up_by"
            columns: ["cleaned_up_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_generated_by"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_data_metadata_cleaned_up_by_fkey"
            columns: ["cleaned_up_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_data_metadata_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_achievement_bonus_approvals: {
        Row: {
          admin_notes: string | null
          bonus_amount: number
          created_at: string | null
          currency_code: string
          id: string
          member_id: string
          paid_at: string | null
          rejection_reason: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tier_id: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          bonus_amount: number
          created_at?: string | null
          currency_code?: string
          id?: string
          member_id: string
          paid_at?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tier_id: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          bonus_amount?: number
          created_at?: string | null
          currency_code?: string
          id?: string
          member_id?: string
          paid_at?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tier_achievement_bonus_approvals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_achievement_bonus_approvals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_achievement_bonus_approvals_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_achievement_bonus_config_audit: {
        Row: {
          change_reason: string | null
          changed_by: string
          created_at: string | null
          id: string
          new_bonus_amount: number | null
          new_status: string | null
          old_bonus_amount: number | null
          old_status: string | null
          tier_id: string
          tier_name: string
        }
        Insert: {
          change_reason?: string | null
          changed_by: string
          created_at?: string | null
          id?: string
          new_bonus_amount?: number | null
          new_status?: string | null
          old_bonus_amount?: number | null
          old_status?: string | null
          tier_id: string
          tier_name: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string
          created_at?: string | null
          id?: string
          new_bonus_amount?: number | null
          new_status?: string | null
          old_bonus_amount?: number | null
          old_status?: string | null
          tier_id?: string
          tier_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_achievement_bonus_config_audit_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_achievement_bonus_config_audit_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_bonus_approvals: {
        Row: {
          admin_notes: string | null
          base_referral_bonus_amount: number
          calculated_tier_bonus_amount: number
          created_at: string | null
          currency_code: string
          id: string
          member_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tier_bonus_percentage: number
          tier_id: string
          tier_level: number
          tier_name: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          base_referral_bonus_amount: number
          calculated_tier_bonus_amount: number
          created_at?: string | null
          currency_code: string
          id?: string
          member_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tier_bonus_percentage: number
          tier_id: string
          tier_level: number
          tier_name: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          base_referral_bonus_amount?: number
          calculated_tier_bonus_amount?: number
          created_at?: string | null
          currency_code?: string
          id?: string
          member_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tier_bonus_percentage?: number
          tier_id?: string
          tier_level?: number
          tier_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tier_bonus_approvals_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_bonus_approvals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_bonus_approvals_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_bonus_audit_log: {
        Row: {
          action: string
          admin_notes: string | null
          base_referral_bonus_amount: number
          calculated_tier_bonus_amount: number
          created_at: string | null
          currency_code: string
          id: string
          member_id: string
          performed_by: string | null
          performed_by_email: string | null
          performed_by_role: string | null
          rejection_reason: string | null
          tier_bonus_approval_id: string
          tier_bonus_percentage: number
          tier_id: string
          tier_level: number
          tier_name: string
        }
        Insert: {
          action: string
          admin_notes?: string | null
          base_referral_bonus_amount: number
          calculated_tier_bonus_amount: number
          created_at?: string | null
          currency_code: string
          id?: string
          member_id: string
          performed_by?: string | null
          performed_by_email?: string | null
          performed_by_role?: string | null
          rejection_reason?: string | null
          tier_bonus_approval_id: string
          tier_bonus_percentage: number
          tier_id: string
          tier_level: number
          tier_name: string
        }
        Update: {
          action?: string
          admin_notes?: string | null
          base_referral_bonus_amount?: number
          calculated_tier_bonus_amount?: number
          created_at?: string | null
          currency_code?: string
          id?: string
          member_id?: string
          performed_by?: string | null
          performed_by_email?: string | null
          performed_by_role?: string | null
          rejection_reason?: string | null
          tier_bonus_approval_id?: string
          tier_bonus_percentage?: number
          tier_id?: string
          tier_level?: number
          tier_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tier_bonus_audit_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_bonus_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_bonus_audit_log_tier_bonus_approval_id_fkey"
            columns: ["tier_bonus_approval_id"]
            isOneToOne: false
            referencedRelation: "tier_bonus_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tier_bonus_audit_log_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "loyalty_tiers"
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
      welfare_reserve_ledger: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          employee_id: string
          entry_type: string
          id: string
          journal_entry_id: string | null
          notes: string | null
          reference_period: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          employee_id: string
          entry_type: string
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          reference_period?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          employee_id?: string
          entry_type?: string
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          reference_period?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "welfare_reserve_ledger_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "welfare_reserve_ledger_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
      admin_prize_pool_breakdown: {
        Row: {
          country_code: string | null
          current_balance: number | null
          current_split_percentage: number | null
          last_updated_at: string | null
          pool_description: string | null
          sub_pool_type: string | null
        }
        Insert: {
          country_code?: string | null
          current_balance?: number | null
          current_split_percentage?: never
          last_updated_at?: string | null
          pool_description?: never
          sub_pool_type?: string | null
        }
        Update: {
          country_code?: string | null
          current_balance?: number | null
          current_split_percentage?: never
          last_updated_at?: string | null
          pool_description?: never
          sub_pool_type?: string | null
        }
        Relationships: []
      }
      bangladesh_deployment_config: {
        Row: {
          country_code: string | null
          country_name: string | null
          currency_code: string | null
          currency_symbol: string | null
          deployment_note: string | null
          is_locked: boolean | null
        }
        Relationships: []
      }
      country_summary_overview: {
        Row: {
          active_members_count: number | null
          country_code: string | null
          country_name: string | null
          finalized_at: string | null
          finalized_by_name: string | null
          generated_at: string | null
          generated_by_name: string | null
          id: string | null
          local_currency: string | null
          net_income: number | null
          period_month: number | null
          period_name: string | null
          period_year: number | null
          prize_pool_balance: number | null
          status: string | null
          total_expenses: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      financial_close_summary: {
        Row: {
          closed_at: string | null
          closed_by_name: string | null
          created_at: string | null
          id: string | null
          locked_at: string | null
          locked_by_name: string | null
          period_end_date: string | null
          period_month: number | null
          period_name: string | null
          period_start_date: string | null
          period_year: number | null
          report_count: number | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      member_prize_pool_view: {
        Row: {
          country_code: string | null
          last_updated_at: string | null
          total_prize_pool_balance: number | null
        }
        Relationships: []
      }
      member_tier_summary: {
        Row: {
          current_tier: string | null
          current_tier_bonus_pct: number | null
          current_tier_threshold: number | null
          email: string | null
          full_name: string | null
          membership_number: number | null
          next_tier: string | null
          next_tier_bonus_pct: number | null
          next_tier_evaluation_date: string | null
          next_tier_threshold: number | null
          referrals_needed_for_next: number | null
          successful_referrals: number | null
          tier_achieved_at: string | null
          tier_level: number | null
          tier_locked_until: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_loyalty_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_pool_summary: {
        Row: {
          account_code: string | null
          account_name: string | null
          currency: string | null
          current_balance: number | null
          last_transaction_date: string | null
          total_contributions: number | null
          total_disbursements: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      allocate_to_prize_pools: {
        Args: {
          p_country_code?: string
          p_description: string
          p_reference_id: string
          p_reference_type: string
          p_total_allocation_amount: number
        }
        Returns: Json
      }
      approve_attendance_override: {
        Args: {
          p_approved_by_admin_id: string
          p_decision: string
          p_override_id: string
        }
        Returns: Json
      }
      approve_expense_chairman: {
        Args: { p_expense_id: string; p_notes?: string }
        Returns: Json
      }
      approve_expense_dept_head: {
        Args: { p_expense_id: string; p_notes?: string }
        Returns: Json
      }
      approve_expense_gm: {
        Args: { p_expense_id: string; p_notes?: string }
        Returns: Json
      }
      approve_expense_md: {
        Args: { p_expense_id: string; p_notes?: string }
        Returns: Json
      }
      approve_payment_request: {
        Args: { p_admin_notes?: string; p_payment_request_id: string }
        Returns: boolean
      }
      approve_payroll_chairman: {
        Args: { p_notes?: string; p_payroll_run_id: string }
        Returns: Json
      }
      approve_payroll_md: { Args: { p_payroll_run_id: string }; Returns: Json }
      approve_tier_achievement_bonus: {
        Args: { p_admin_notes?: string; p_approval_id: string }
        Returns: boolean
      }
      approve_tier_bonus: {
        Args: { p_admin_notes?: string; p_approval_id: string }
        Returns: boolean
      }
      assign_master_admin_via_employees: {
        Args: { target_user_id: string }
        Returns: Json
      }
      assign_super_admin_via_employees: {
        Args: { target_user_id: string }
        Returns: Json
      }
      auto_escalate_hr_issues: { Args: never; Returns: Json }
      auto_generate_country_summary: {
        Args: { p_period_month: number; p_period_year: number }
        Returns: string
      }
      award_community_prize: {
        Args: {
          p_awarded_by_admin_id: string
          p_member_number: string
          p_prize_amount: number
          p_prize_draw_id: string
          p_prize_id: string
          p_prize_name: string
        }
        Returns: Json
      }
      calculate_attendance_status: {
        Args: {
          p_actual_time: string
          p_expected_time: string
          p_grace_minutes: number
        }
        Returns: {
          lateness_minutes: number
          status: Database["public"]["Enums"]["employee_attendance_status"]
        }[]
      }
      calculate_leave_balance: {
        Args: { p_employee_id: string; p_year: number }
        Returns: {
          remaining_annual: number
          total_annual: number
          used_annual: number
          used_sick: number
          used_unpaid: number
        }[]
      }
      calculate_member_tier: {
        Args: { p_successful_referrals: number }
        Returns: string
      }
      calculate_member_tier_from_referrals: {
        Args: { p_referral_count: number }
        Returns: string
      }
      calculate_membership_end_date: {
        Args: { start_date: string }
        Returns: string
      }
      calculate_strict_prize_allocation: {
        Args: {
          p_membership_fee: number
          p_referral_cost: number
          p_tier_percent_cost: number
          p_transaction_date?: string
        }
        Returns: number
      }
      calculate_total_bonus_percentage: {
        Args: { p_member_id: string; p_referral_bonus_percentage?: number }
        Returns: number
      }
      calculate_total_renewal_bonus: {
        Args: { p_member_id: string; p_renewal_date?: string }
        Returns: {
          referral_bonus_amount: number
          tier_bonus_amount: number
          tier_bonus_percentage: number
          total_bonus_amount: number
        }[]
      }
      calculate_wallet_balance: { Args: { user_uuid: string }; Returns: number }
      can_create_prize_draw: {
        Args: { total_prize_value: number }
        Returns: {
          allowed: boolean
          current_balance: number
          required_balance: number
          shortfall: number
        }[]
      }
      check_approval_authority: {
        Args: { p_action_type: string; p_admin_id: string; p_amount?: number }
        Returns: boolean
      }
      check_duplicate_membership: {
        Args: { check_email: string; check_gov_id: string }
        Returns: boolean
      }
      check_hr_permission: {
        Args: {
          p_action: string
          p_admin_id: string
          p_permission_name: string
          p_target_employee_id?: string
        }
        Returns: Json
      }
      check_period_locked: {
        Args: { transaction_date: string }
        Returns: boolean
      }
      claim_community_prize: {
        Args: { p_award_id: string; p_member_id: string }
        Returns: Json
      }
      close_accounting_period: {
        Args: { p_admin_id: string; p_month: number; p_year: number }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_action_url?: string
          p_description: string
          p_metadata?: Json
          p_notification_type: string
          p_priority?: string
          p_recipient_id: string
          p_reference_id?: string
          p_reference_type?: string
          p_title: string
        }
        Returns: string
      }
      create_super_admin: {
        Args: {
          p_country_code: string
          p_created_by: string
          p_user_id: string
        }
        Returns: Json
      }
      credit_wallet: {
        Args: {
          p_amount: number
          p_description: string
          p_reference_id: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: Json
      }
      days_until_expiry: { Args: { user_uuid: string }; Returns: number }
      deduct_prize_from_sub_pool: {
        Args: {
          p_country_code?: string
          p_prize_amount: number
          p_prize_id: string
          p_sub_pool_type: string
        }
        Returns: Json
      }
      escalate_pending_tier_bonus_notifications: {
        Args: never
        Returns: number
      }
      expire_memberships: { Args: never; Returns: undefined }
      finalize_monthly_pl: { Args: { p_pl_id: string }; Returns: Json }
      finalize_payroll: { Args: { p_payroll_run_id: string }; Returns: Json }
      format_bdt_amount: { Args: { p_amount: number }; Returns: string }
      generate_draw_closure_report: {
        Args: { p_draw_id: string }
        Returns: Json
      }
      generate_draw_report:
        | {
            Args: { p_auto_executed?: boolean; p_draw_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_auto_executed?: boolean
              p_draw_id: string
              p_executed_by?: string
            }
            Returns: Json
          }
      generate_employee_number: { Args: never; Returns: string }
      generate_final_claim_report: {
        Args: { p_draw_id: string }
        Returns: Json
      }
      generate_membership_number: { Args: never; Returns: number }
      generate_monthly_payroll: {
        Args: {
          p_pay_period_end: string
          p_pay_period_start: string
          p_payment_date: string
        }
        Returns: Json
      }
      generate_monthly_pl: {
        Args: { p_month: number; p_year: number }
        Returns: Json
      }
      generate_prize_pool_reconciliation: {
        Args: { end_date: string; start_date: string }
        Returns: Json
      }
      generate_profit_loss_report: {
        Args: { end_date: string; start_date: string }
        Returns: Json
      }
      generate_referral_code: { Args: never; Returns: string }
      generate_referral_payouts_report: {
        Args: { end_date: string; start_date: string }
        Returns: Json
      }
      generate_tier_payouts_report: {
        Args: { end_date: string; start_date: string }
        Returns: Json
      }
      get_absent_employees: {
        Args: { p_admin_id?: string; p_date?: string; p_department?: string }
        Returns: {
          department: string
          employee_id: string
          employee_name: string
          expected_login_time: string
          role: string
        }[]
      }
      get_active_tier_config: {
        Args: { p_as_of_date?: string; p_tier_id: string }
        Returns: {
          bonus_percentage: number
          config_id: string
          effective_from: string
          is_active: boolean
          referral_threshold: number
          tier_id: string
        }[]
      }
      get_admin_notifications: {
        Args: { p_admin_id?: string; p_include_read?: boolean }
        Returns: {
          created_at: string
          escalated_at: string
          hours_pending: number
          is_read: boolean
          member_full_name: string
          member_id: string
          message: string
          metadata: Json
          notification_id: string
          notification_type: string
          priority: string
          title: string
        }[]
      }
      get_all_languages_admin: {
        Args: never
        Returns: {
          enabled_at: string
          enabled_by_email: string
          is_enabled: boolean
          language_code: string
          language_name_english: string
          language_name_native: string
        }[]
      }
      get_all_tiers_localized: {
        Args: { p_language_code?: string }
        Returns: {
          achievement_message_translated: string
          bonus_percentage: number
          referral_threshold: number
          tier_description_translated: string
          tier_level: number
          tier_name: string
          tier_name_translated: string
        }[]
      }
      get_attendance_summary: {
        Args: { p_admin_id?: string; p_date?: string; p_department?: string }
        Returns: Json
      }
      get_draw_total_prize_value: {
        Args: { draw_id_param: string }
        Returns: number
      }
      get_draws_ready_for_execution: {
        Args: never
        Returns: {
          draw_date: string
          draw_id: string
          draw_name: string
          draw_time: string
          estimated_prize_pool_amount: number
          pool_type: string
        }[]
      }
      get_employee_attendance: {
        Args: {
          p_employee_id: string
          p_end_date: string
          p_start_date: string
          p_viewer_id?: string
        }
        Returns: {
          actual_login_time: string
          attendance_date: string
          expected_login_time: string
          id: string
          lateness_minutes: number
          manual_entry: boolean
          manual_entry_reason: string
          status: Database["public"]["Enums"]["employee_attendance_status"]
        }[]
      }
      get_employee_attendance_history: {
        Args: {
          p_employee_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          actual_login_time: string
          attendance_date: string
          expected_login_time: string
          lateness_minutes: number
          manual_entry_reason: string
          status: string
        }[]
      }
      get_employee_hierarchy: {
        Args: { p_employee_id?: string }
        Returns: {
          full_name: string
          id: string
          level: number
          manager_id: string
          manager_name: string
          path: string[]
          role_category: Database["public"]["Enums"]["employee_role_category"]
          role_title: string
        }[]
      }
      get_enabled_languages: {
        Args: never
        Returns: {
          language_code: string
          language_name_english: string
          language_name_native: string
        }[]
      }
      get_expense_approval_statistics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: Json
      }
      get_expense_summary_by_category: {
        Args: {
          p_department?: Database["public"]["Enums"]["department_type"]
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          avg_amount: number
          count_requests: number
          expense_category: string
          max_amount: number
          total_amount: number
        }[]
      }
      get_late_employees: {
        Args: { p_admin_id?: string; p_date?: string; p_department?: string }
        Returns: {
          actual_login_time: string
          department: string
          employee_id: string
          employee_name: string
          expected_login_time: string
          lateness_minutes: number
          logged_from_ip: string
          role: string
        }[]
      }
      get_loyalty_ui_translations: {
        Args: { p_language_code?: string }
        Returns: {
          translation_key: string
          translation_value: string
        }[]
      }
      get_member_claimable_prizes: {
        Args: { p_user_id: string }
        Returns: {
          blocked_reason: string
          can_claim: boolean
          claim_deadline: string
          days_remaining: number
          draw_id: string
          draw_name: string
          eligibility_details: Json
          prize_amount: number
          prize_title: string
          winner_id: string
        }[]
      }
      get_member_document_verification_requests: {
        Args: never
        Returns: {
          admin_response: string
          country_related: string
          created_at: string
          document_type: string
          document_type_other: string
          explanation: string
          request_id: string
          reviewed_at: string
          status: string
          ticket_reference: string
          updated_at: string
        }[]
      }
      get_member_language_preference: {
        Args: { p_member_id: string }
        Returns: string
      }
      get_member_tier_achievement_history: {
        Args: { p_member_id: string }
        Returns: {
          approval_id: string
          bonus_amount: number
          currency_code: string
          requested_at: string
          reviewed_at: string
          status: string
          tier_level: number
          tier_name: string
        }[]
      }
      get_member_tier_bonus_history: {
        Args: { p_member_id: string }
        Returns: {
          approval_id: string
          calculated_tier_bonus_amount: number
          created_at: string
          currency_code: string
          reviewed_at: string
          status: string
          tier_bonus_percentage: number
          tier_level: number
          tier_name: string
        }[]
      }
      get_member_tier_details: {
        Args: { p_member_id: string }
        Returns: {
          achieved_tier_at: string
          current_referrals: number
          next_tier_name: string
          referrals_needed_for_next: number
          tier_bonus_percentage: number
          tier_level: number
          tier_locked_until: string
          tier_name: string
        }[]
      }
      get_member_tier_details_localized: {
        Args: { p_language_code?: string; p_member_id: string }
        Returns: {
          achievement_message_translated: string
          bonus_percentage: number
          current_referrals: number
          next_tier_name: string
          next_tier_name_translated: string
          progress_percentage: number
          referrals_needed: number
          tier_description_translated: string
          tier_level: number
          tier_locked_until: string
          tier_name: string
          tier_name_translated: string
        }[]
      }
      get_member_tier_progress: {
        Args: { p_member_id: string }
        Returns: {
          current_bonus_percentage: number
          current_tier_color: string
          current_tier_id: string
          current_tier_level: number
          current_tier_name: string
          membership_expiry_date: string
          membership_start_date: string
          membership_status: string
          next_tier_id: string
          next_tier_level: number
          next_tier_name: string
          next_tier_required_referrals: number
          progress_percentage: number
          referrals_until_next_tier: number
          total_successful_referrals: number
        }[]
      }
      get_monthly_pl: {
        Args: { p_month: number; p_year: number }
        Returns: Json
      }
      get_pending_document_verification_requests: {
        Args: never
        Returns: {
          admin_response: string
          country_related: string
          created_at: string
          document_type: string
          document_type_other: string
          explanation: string
          internal_notes: string
          member_email: string
          member_full_name: string
          member_id: string
          membership_number: number
          request_id: string
          reviewed_at: string
          reviewed_by: string
          reviewed_by_email: string
          status: string
          ticket_reference: string
          updated_at: string
        }[]
      }
      get_pending_expense_approvals: {
        Args: { p_user_id: string }
        Returns: {
          amount: number
          created_at: string
          created_by_name: string
          days_pending: number
          department: Database["public"]["Enums"]["department_type"]
          expense_category: string
          expense_id: string
          requires_chairman: boolean
          title: string
        }[]
      }
      get_pending_notifications: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          draw_id: string
          notification_id: string
          notification_type: string
          recipient_user_id: string
          template_data: Json
        }[]
      }
      get_pending_payment_requests: {
        Args: never
        Returns: {
          amount: number
          bank_details: Json
          currency_code: string
          member_email: string
          member_full_name: string
          member_id: string
          payment_request_id: string
          payment_type: string
          requested_at: string
          status: string
          wallet_balance: number
          wallet_pending_balance: number
        }[]
      }
      get_pending_tier_achievement_approvals: {
        Args: never
        Returns: {
          admin_notes: string
          approval_id: string
          bonus_amount: number
          currency_code: string
          member_email: string
          member_full_name: string
          member_id: string
          rejection_reason: string
          requested_at: string
          requires_enhanced_kyc: boolean
          reviewed_at: string
          reviewed_by: string
          reviewed_by_email: string
          status: string
          tier_id: string
          tier_level: number
          tier_name: string
        }[]
      }
      get_pending_tier_bonus_approvals: {
        Args: never
        Returns: {
          approval_id: string
          base_referral_bonus_amount: number
          calculated_tier_bonus_amount: number
          created_at: string
          currency_code: string
          member_email: string
          member_id: string
          member_name: string
          status: string
          tier_bonus_percentage: number
          tier_level: number
          tier_name: string
        }[]
      }
      get_prize_pool_allocation_percentage: {
        Args: { p_country_code: string; p_effective_date?: string }
        Returns: number
      }
      get_prize_pool_balance: { Args: never; Returns: number }
      get_referral_balance: { Args: { user_uuid: string }; Returns: number }
      get_referral_bonus_summary: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          currency_code: string
          month: string
          total_bonus_paid: number
          total_referrals: number
        }[]
      }
      get_referral_earnings: {
        Args: { user_uuid: string }
        Returns: {
          pending_amount: number
          total_earned: number
          total_referrals: number
          withdrawn_amount: number
        }[]
      }
      get_system_setting: { Args: { p_setting_key: string }; Returns: string }
      get_tier_achievement_bonus_audit_log: {
        Args: { p_tier_id?: string }
        Returns: {
          audit_id: string
          change_reason: string
          changed_by_email: string
          changed_by_id: string
          changed_by_name: string
          created_at: string
          new_bonus_amount: number
          old_bonus_amount: number
          tier_name: string
        }[]
      }
      get_tier_achievement_bonus_config: {
        Args: never
        Returns: {
          achievement_bonus_amount: number
          bonus_percentage: number
          is_active: boolean
          required_referrals: number
          requires_enhanced_kyc: boolean
          tier_id: string
          tier_level: number
          tier_name: string
          updated_at: string
        }[]
      }
      get_tier_bonus_at_renewal: {
        Args: { p_member_user_id: string; p_renewal_date?: string }
        Returns: number
      }
      get_tier_bonus_financial_summary: {
        Args: {
          p_country_code?: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          approved_unpaid_amount: number
          count: number
          country_code: string
          currency_code: string
          month: string
          paid_amount: number
          pending_approval_amount: number
          tier_name: string
        }[]
      }
      get_tier_overview_report: {
        Args: never
        Returns: {
          bonus_percentage: number
          pending_approvals: number
          required_referrals: number
          tier_level: number
          tier_name: string
          total_members: number
          upgraded_this_month: number
        }[]
      }
      get_top_referrers: {
        Args: { p_limit?: number }
        Returns: {
          currency_code: string
          member_id_anonymized: string
          total_earned: number
          total_successful_referrals: number
        }[]
      }
      get_unread_notification_count: { Args: never; Returns: number }
      get_unread_notifications: {
        Args: never
        Returns: {
          action_url: string
          created_at: string
          description: string
          metadata: Json
          notification_id: string
          notification_type: string
          priority: string
          reference_id: string
          reference_type: string
          title: string
        }[]
      }
      get_user_notifications: {
        Args: { p_include_read?: boolean; p_limit?: number; p_offset?: number }
        Returns: {
          action_url: string
          created_at: string
          description: string
          is_read: boolean
          metadata: Json
          notification_id: string
          notification_type: string
          priority: string
          read_at: string
          reference_id: string
          reference_type: string
          title: string
        }[]
      }
      has_active_membership: { Args: { user_uuid: string }; Returns: boolean }
      is_membership_active: { Args: { user_uuid: string }; Returns: boolean }
      lock_accounting_period: {
        Args: { p_admin_id: string; p_month: number; p_year: number }
        Returns: Json
      }
      log_employee_attendance: {
        Args: {
          p_actual_login_time: string
          p_attendance_date: string
          p_employee_id: string
          p_logged_from_ip?: string
        }
        Returns: Json
      }
      log_report_access: {
        Args: { p_action: string; p_report_type: string }
        Returns: undefined
      }
      manual_attendance_entry: {
        Args: {
          p_actual_login_time: string
          p_attendance_date: string
          p_employee_id: string
          p_reason: string
          p_recorded_by_admin_id: string
          p_status: Database["public"]["Enums"]["employee_attendance_status"]
        }
        Returns: Json
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      mark_notification_sent: {
        Args: { p_notification_id: string; p_success?: boolean }
        Returns: undefined
      }
      notify_admins_by_role: {
        Args: {
          p_action_url?: string
          p_description: string
          p_metadata?: Json
          p_min_role: string
          p_notification_type: string
          p_priority?: string
          p_reference_id?: string
          p_reference_type?: string
          p_title: string
        }
        Returns: number
      }
      process_expired_prizes_split_rollover: { Args: never; Returns: Json }
      process_expired_unclaimed_prizes: { Args: never; Returns: Json }
      process_prize_claim: {
        Args: {
          p_claim_method?: string
          p_user_id: string
          p_winner_id: string
        }
        Returns: Json
      }
      process_prize_payout: {
        Args: {
          p_country_code?: string
          p_description: string
          p_payout_amount: number
          p_reference_id: string
          p_reference_type: string
          p_sub_pool_type: string
        }
        Returns: Json
      }
      queue_winner_notifications: { Args: { p_draw_id: string }; Returns: Json }
      reconcile_petty_cash_wallet:
        | { Args: { p_wallet_id: string }; Returns: Json }
        | {
            Args: {
              p_physical_cash_count: number
              p_reconciliation_notes?: string
              p_wallet_id: string
            }
            Returns: Json
          }
      record_petty_cash_spend: {
        Args: {
          p_amount: number
          p_description: string
          p_receipt_url: string
          p_wallet_id: string
        }
        Returns: Json
      }
      reject_payment_request: {
        Args: {
          p_admin_notes?: string
          p_payment_request_id: string
          p_rejection_reason: string
        }
        Returns: boolean
      }
      reject_tier_achievement_bonus: {
        Args: {
          p_admin_notes?: string
          p_approval_id: string
          p_rejection_reason: string
        }
        Returns: boolean
      }
      reject_tier_bonus: {
        Args: {
          p_admin_notes?: string
          p_approval_id: string
          p_rejection_reason: string
        }
        Returns: boolean
      }
      request_attendance_override: {
        Args: {
          p_log_id: string
          p_new_status: Database["public"]["Enums"]["employee_attendance_status"]
          p_reason: string
          p_requested_by_admin_id: string
        }
        Returns: Json
      }
      request_payment_approval: {
        Args: {
          p_amount: number
          p_currency_code: string
          p_member_id: string
          p_payment_type: string
          p_source_transaction_id?: string
        }
        Returns: string
      }
      request_petty_cash_topup: {
        Args: { p_amount: number; p_reason: string; p_wallet_id: string }
        Returns: Json
      }
      request_tier_achievement_bonus_approval: {
        Args: { p_member_id: string; p_tier_id: string }
        Returns: string
      }
      request_tier_bonus_approval: {
        Args: {
          p_base_referral_bonus_amount: number
          p_currency_code: string
          p_member_id: string
          p_tier_id: string
        }
        Returns: string
      }
      rollover_leftover_funds: {
        Args: {
          p_country_code?: string
          p_draw_id: string
          p_leftover_amount: number
          p_sub_pool_type: string
        }
        Returns: Json
      }
      select_random_winners: { Args: { p_draw_id: string }; Returns: Json }
      submit_document_verification_request: {
        Args: {
          p_country_related: string
          p_document_type: string
          p_document_type_other?: string
          p_explanation: string
        }
        Returns: {
          request_id: string
          ticket_reference: string
        }[]
      }
      submit_expense_request: { Args: { p_expense_id: string }; Returns: Json }
      toggle_language_availability: {
        Args: { p_is_enabled: boolean; p_language_code: string }
        Returns: boolean
      }
      update_document_verification_status: {
        Args: {
          p_admin_response?: string
          p_internal_notes?: string
          p_new_status: string
          p_request_id: string
        }
        Returns: boolean
      }
      update_member_language_preference: {
        Args: { p_language_code: string; p_member_id: string }
        Returns: boolean
      }
      update_system_setting: {
        Args: { p_new_value: string; p_setting_key: string }
        Returns: boolean
      }
      update_tier_achievement_bonus_amount: {
        Args: {
          p_change_reason?: string
          p_new_bonus_amount: number
          p_tier_id: string
        }
        Returns: boolean
      }
      validate_draw_execution_safety: {
        Args: { p_draw_id: string }
        Returns: Json
      }
      validate_file_upload: {
        Args: {
          bucket_name: string
          file_path: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      validate_prize_claim_eligibility: {
        Args: { p_user_id: string; p_winner_id: string }
        Returns: Json
      }
      validate_prize_pool_integrity: {
        Args: { p_country_code?: string }
        Returns: Json
      }
    }
    Enums: {
      agent_status: "pending_approval" | "approved" | "rejected" | "suspended"
      closure_type:
        | "emergency"
        | "strike"
        | "force_majeure"
        | "public_holiday"
        | "company_event"
      department_type:
        | "executive"
        | "hr"
        | "accounts"
        | "pr"
        | "member_relations"
        | "operations"
        | "it"
        | "support"
      employee_attendance_status:
        | "on_time"
        | "late"
        | "absent"
        | "excused"
        | "absent_unreported"
        | "absent_reported"
        | "emergency_closure"
        | "strike_unrest"
        | "public_holiday"
        | "eid_holiday"
        | "awol_flagged"
      employee_role_category:
        | "chairman"
        | "managing_director"
        | "general_manager"
        | "department_head"
        | "staff"
        | "support_staff"
        | "hr_manager"
      employee_status:
        | "active"
        | "probation"
        | "resigned"
        | "terminated"
        | "suspended"
        | "inactive"
      employment_type: "full_time" | "contract" | "support"
      leave_type:
        | "annual"
        | "sick"
        | "emergency"
        | "unpaid"
        | "maternity"
        | "paternity"
      membership_status: "pending_payment" | "active" | "expired" | "suspended"
      payment_status: "pending" | "confirmed" | "failed" | "refunded"
      payroll_run_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "processing"
        | "completed"
        | "failed"
        | "finalized"
      prize_draw_status:
        | "upcoming"
        | "active"
        | "completed"
        | "cancelled"
        | "executing"
      report_status: "submitted" | "under_review" | "verified" | "rejected"
      service_request_status:
        | "submitted"
        | "agent_assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
      termination_type:
        | "resignation"
        | "redundancy"
        | "negligence"
        | "fraud"
        | "misconduct"
        | "awol"
        | "performance"
        | "contract_end"
      user_role:
        | "super_admin"
        | "manager_admin"
        | "worker_admin"
        | "member"
        | "agent"
        | "agent_pending"
        | "agent_suspended"
        | "master_admin"
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
      closure_type: [
        "emergency",
        "strike",
        "force_majeure",
        "public_holiday",
        "company_event",
      ],
      department_type: [
        "executive",
        "hr",
        "accounts",
        "pr",
        "member_relations",
        "operations",
        "it",
        "support",
      ],
      employee_attendance_status: [
        "on_time",
        "late",
        "absent",
        "excused",
        "absent_unreported",
        "absent_reported",
        "emergency_closure",
        "strike_unrest",
        "public_holiday",
        "eid_holiday",
        "awol_flagged",
      ],
      employee_role_category: [
        "chairman",
        "managing_director",
        "general_manager",
        "department_head",
        "staff",
        "support_staff",
        "hr_manager",
      ],
      employee_status: [
        "active",
        "probation",
        "resigned",
        "terminated",
        "suspended",
        "inactive",
      ],
      employment_type: ["full_time", "contract", "support"],
      leave_type: [
        "annual",
        "sick",
        "emergency",
        "unpaid",
        "maternity",
        "paternity",
      ],
      membership_status: ["pending_payment", "active", "expired", "suspended"],
      payment_status: ["pending", "confirmed", "failed", "refunded"],
      payroll_run_status: [
        "draft",
        "pending_approval",
        "approved",
        "processing",
        "completed",
        "failed",
        "finalized",
      ],
      prize_draw_status: [
        "upcoming",
        "active",
        "completed",
        "cancelled",
        "executing",
      ],
      report_status: ["submitted", "under_review", "verified", "rejected"],
      service_request_status: [
        "submitted",
        "agent_assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      termination_type: [
        "resignation",
        "redundancy",
        "negligence",
        "fraud",
        "misconduct",
        "awol",
        "performance",
        "contract_end",
      ],
      user_role: [
        "super_admin",
        "manager_admin",
        "worker_admin",
        "member",
        "agent",
        "agent_pending",
        "agent_suspended",
        "master_admin",
      ],
      withdrawal_status: ["pending", "approved", "rejected", "paid"],
    },
  },
} as const
