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
      material_captures: {
        Row: {
          created_at: string
          factor_agua_applied: number | null
          factor_arboles_applied: number | null
          factor_co2_applied: number | null
          factor_energia_applied: number | null
          family: string | null
          id: string
          is_confirmed: boolean | null
          kg_brutos: number
          kg_netos: number | null
          material_code: string
          material_name: string | null
          month: number
          notes: string | null
          result_agua: number | null
          result_arboles: number | null
          result_co2: number | null
          result_energia: number | null
          updated_at: string
          user_id: string
          uses_agua: boolean | null
          uses_arboles: boolean | null
          uses_co2: boolean | null
          uses_energia: boolean | null
          year: number
          yield_applied: number | null
        }
        Insert: {
          created_at?: string
          factor_agua_applied?: number | null
          factor_arboles_applied?: number | null
          factor_co2_applied?: number | null
          factor_energia_applied?: number | null
          family?: string | null
          id?: string
          is_confirmed?: boolean | null
          kg_brutos?: number
          kg_netos?: number | null
          material_code: string
          material_name?: string | null
          month: number
          notes?: string | null
          result_agua?: number | null
          result_arboles?: number | null
          result_co2?: number | null
          result_energia?: number | null
          updated_at?: string
          user_id: string
          uses_agua?: boolean | null
          uses_arboles?: boolean | null
          uses_co2?: boolean | null
          uses_energia?: boolean | null
          year: number
          yield_applied?: number | null
        }
        Update: {
          created_at?: string
          factor_agua_applied?: number | null
          factor_arboles_applied?: number | null
          factor_co2_applied?: number | null
          factor_energia_applied?: number | null
          family?: string | null
          id?: string
          is_confirmed?: boolean | null
          kg_brutos?: number
          kg_netos?: number | null
          material_code?: string
          material_name?: string | null
          month?: number
          notes?: string | null
          result_agua?: number | null
          result_arboles?: number | null
          result_co2?: number | null
          result_energia?: number | null
          updated_at?: string
          user_id?: string
          uses_agua?: boolean | null
          uses_arboles?: boolean | null
          uses_co2?: boolean | null
          uses_energia?: boolean | null
          year?: number
          yield_applied?: number | null
        }
        Relationships: []
      }
      material_catalog: {
        Row: {
          code: string
          created_at: string
          default_yield: number
          display_order: number
          factor_agua: number | null
          factor_arboles: number | null
          factor_co2: number | null
          factor_energia: number | null
          factors_source: string
          family: string
          id: number
          is_active: boolean
          name: string
          updated_at: string
          uses_agua: boolean
          uses_arboles: boolean
          uses_co2: boolean
          uses_energia: boolean
          yield_loss_reason: string
          yield_max: number
          yield_min: number
          yield_source: string
        }
        Insert: {
          code: string
          created_at?: string
          default_yield?: number
          display_order?: number
          factor_agua?: number | null
          factor_arboles?: number | null
          factor_co2?: number | null
          factor_energia?: number | null
          factors_source?: string
          family?: string
          id?: number
          is_active?: boolean
          name: string
          updated_at?: string
          uses_agua?: boolean
          uses_arboles?: boolean
          uses_co2?: boolean
          uses_energia?: boolean
          yield_loss_reason?: string
          yield_max?: number
          yield_min?: number
          yield_source?: string
        }
        Update: {
          code?: string
          created_at?: string
          default_yield?: number
          display_order?: number
          factor_agua?: number | null
          factor_arboles?: number | null
          factor_co2?: number | null
          factor_energia?: number | null
          factors_source?: string
          family?: string
          id?: number
          is_active?: boolean
          name?: string
          updated_at?: string
          uses_agua?: boolean
          uses_arboles?: boolean
          uses_co2?: boolean
          uses_energia?: boolean
          yield_loss_reason?: string
          yield_max?: number
          yield_min?: number
          yield_source?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          company?: string
          created_at?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          company?: string
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
