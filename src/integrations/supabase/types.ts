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
      company_config: {
        Row: {
          address: string
          company_name: string
          contact_email: string
          contact_phone: string
          created_at: string
          id: string
          logo_url: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          address?: string
          company_name?: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          id?: string
          logo_url?: string
          updated_at?: string
          wallet_address?: string
        }
        Update: {
          address?: string
          company_name?: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          id?: string
          logo_url?: string
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          account_name: string | null
          account_number: string | null
          address: string | null
          bank_name: string | null
          created_at: string
          iban: string | null
          id: string
          name: string
          notes: string | null
          sort_code: string | null
          swift: string | null
          tax_reference: string | null
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          name: string
          notes?: string | null
          sort_code?: string | null
          swift?: string | null
          tax_reference?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          name?: string
          notes?: string | null
          sort_code?: string | null
          swift?: string | null
          tax_reference?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      gbp_balances: {
        Row: {
          balance_pence: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_pence?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_pence?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interest_registrations: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          location: string
          name: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          location?: string
          name: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          location?: string
          name?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_cents: number
          category: Database["public"]["Enums"]["invoice_category"]
          created_at: string
          currency: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          paid_at: string | null
          paid_currency: string | null
          paid_rail: Database["public"]["Enums"]["payment_rail"] | null
          payee_id: string | null
          payee_name: string
          reference: string | null
          source: Database["public"]["Enums"]["invoice_source"]
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          amount_cents: number
          category: Database["public"]["Enums"]["invoice_category"]
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_currency?: string | null
          paid_rail?: Database["public"]["Enums"]["payment_rail"] | null
          payee_id?: string | null
          payee_name: string
          reference?: string | null
          source?: Database["public"]["Enums"]["invoice_source"]
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          amount_cents?: number
          category?: Database["public"]["Enums"]["invoice_category"]
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_currency?: string | null
          paid_rail?: Database["public"]["Enums"]["payment_rail"] | null
          payee_id?: string | null
          payee_name?: string
          reference?: string | null
          source?: Database["public"]["Enums"]["invoice_source"]
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      mfa_recovery_tokens: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          requested_ip: string | null
          token_hash: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          requested_ip?: string | null
          token_hash: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          requested_ip?: string | null
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          account_name: string | null
          account_number: string | null
          address: string | null
          bank_name: string | null
          created_at: string
          iban: string | null
          id: string
          name: string
          notes: string | null
          sort_code: string | null
          swift: string | null
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          name: string
          notes?: string | null
          sort_code?: string | null
          swift?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          name?: string
          notes?: string | null
          sort_code?: string | null
          swift?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tax_offices: {
        Row: {
          account_name: string | null
          account_number: string | null
          authority_name: string
          bank_name: string | null
          company_tax_reference: string | null
          country: string | null
          created_at: string
          iban: string | null
          id: string
          notes: string | null
          sort_code: string | null
          swift: string | null
          updated_at: string
          wallet_address: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          authority_name: string
          bank_name?: string | null
          company_tax_reference?: string | null
          country?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          notes?: string | null
          sort_code?: string | null
          swift?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          authority_name?: string
          bank_name?: string | null
          company_tax_reference?: string | null
          country?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          notes?: string | null
          sort_code?: string | null
          swift?: string | null
          updated_at?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string
          currency: string | null
          eur_cents: number | null
          gbp_pence: number | null
          id: string
          invoice_id: string | null
          notes: string | null
          payee_legal_name: string | null
          rail: Database["public"]["Enums"]["payment_rail"] | null
          recipient_address: string | null
          solana_signature: string | null
          status: Database["public"]["Enums"]["tx_status"]
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          eur_cents?: number | null
          gbp_pence?: number | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payee_legal_name?: string | null
          rail?: Database["public"]["Enums"]["payment_rail"] | null
          recipient_address?: string | null
          solana_signature?: string | null
          status?: Database["public"]["Enums"]["tx_status"]
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          eur_cents?: number | null
          gbp_pence?: number | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payee_legal_name?: string | null
          rail?: Database["public"]["Enums"]["payment_rail"] | null
          recipient_address?: string | null
          solana_signature?: string | null
          status?: Database["public"]["Enums"]["tx_status"]
          type?: Database["public"]["Enums"]["tx_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      wallet_balances: {
        Row: {
          balance_minor: number
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_minor?: number
          currency: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_minor?: number
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      website_content: {
        Row: {
          content: Json
          id: string
          section_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          id?: string
          section_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          id?: string
          section_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_interest_log: {
        Args: never
        Returns: {
          company: string
          email: string
          email_error: string
          email_sent_at: string
          email_status: string
          id: string
          location: string
          name: string
          registered_at: string
        }[]
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "creator"
        | "approver"
        | "readonly"
        | "tech_admin"
      invoice_category: "supplier" | "payroll" | "tax"
      invoice_source: "xero" | "quickbooks" | "sage" | "upload" | "manual"
      invoice_status: "unpaid" | "paid" | "failed"
      payment_rail: "stable" | "fiat"
      tx_status: "pending" | "confirmed" | "failed"
      tx_type: "topup" | "send"
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
      app_role: [
        "admin",
        "user",
        "creator",
        "approver",
        "readonly",
        "tech_admin",
      ],
      invoice_category: ["supplier", "payroll", "tax"],
      invoice_source: ["xero", "quickbooks", "sage", "upload", "manual"],
      invoice_status: ["unpaid", "paid", "failed"],
      payment_rail: ["stable", "fiat"],
      tx_status: ["pending", "confirmed", "failed"],
      tx_type: ["topup", "send"],
    },
  },
} as const
