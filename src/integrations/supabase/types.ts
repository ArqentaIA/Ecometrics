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
      additional_material_requests: {
        Row: {
          catalog_material_code: string | null
          converted_to_catalog: boolean
          created_at: string
          description: string | null
          id: string
          proposed_category: string | null
          proposed_name: string
          proposed_price_per_kg: number | null
          proposed_unit: string | null
          reason: string | null
          requested_by: string
          review_comment: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          catalog_material_code?: string | null
          converted_to_catalog?: boolean
          created_at?: string
          description?: string | null
          id?: string
          proposed_category?: string | null
          proposed_name: string
          proposed_price_per_kg?: number | null
          proposed_unit?: string | null
          reason?: string | null
          requested_by: string
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          catalog_material_code?: string | null
          converted_to_catalog?: boolean
          created_at?: string
          description?: string | null
          id?: string
          proposed_category?: string | null
          proposed_name?: string
          proposed_price_per_kg?: number | null
          proposed_unit?: string | null
          reason?: string | null
          requested_by?: string
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          comment: string | null
          created_at: string
          event_type: string
          field_changed: string | null
          id: string
          new_value: string | null
          old_value: string | null
          record_id: string
          table_name: string
          user_id: string
          user_role: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_type: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          record_id: string
          table_name: string
          user_id: string
          user_role?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_type?: string
          field_changed?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          record_id?: string
          table_name?: string
          user_id?: string
          user_role?: string | null
        }
        Relationships: []
      }
      material_captures: {
        Row: {
          capture_origin: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          cost_per_kg_applied: number | null
          created_at: string
          factor_agua_applied: number | null
          factor_arboles_applied: number | null
          factor_co2_applied: number | null
          factor_energia_applied: number | null
          family: string | null
          id: string
          is_additional_material: boolean | null
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
          result_economic_impact: number | null
          result_energia: number | null
          temporary_material_id: string | null
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
          capture_origin?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          cost_per_kg_applied?: number | null
          created_at?: string
          factor_agua_applied?: number | null
          factor_arboles_applied?: number | null
          factor_co2_applied?: number | null
          factor_energia_applied?: number | null
          family?: string | null
          id?: string
          is_additional_material?: boolean | null
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
          result_economic_impact?: number | null
          result_energia?: number | null
          temporary_material_id?: string | null
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
          capture_origin?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          cost_per_kg_applied?: number | null
          created_at?: string
          factor_agua_applied?: number | null
          factor_arboles_applied?: number | null
          factor_co2_applied?: number | null
          factor_energia_applied?: number | null
          family?: string | null
          id?: string
          is_additional_material?: boolean | null
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
          result_economic_impact?: number | null
          result_energia?: number | null
          temporary_material_id?: string | null
          updated_at?: string
          user_id?: string
          uses_agua?: boolean | null
          uses_arboles?: boolean | null
          uses_co2?: boolean | null
          uses_energia?: boolean | null
          year?: number
          yield_applied?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_captures_temporary_material_id_fkey"
            columns: ["temporary_material_id"]
            isOneToOne: false
            referencedRelation: "temporary_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_catalog: {
        Row: {
          category_id: string | null
          code: string
          created_at: string
          created_by: string | null
          default_cost_per_kg: number | null
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
          updated_by: string | null
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
          category_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          default_cost_per_kg?: number | null
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
          updated_by?: string | null
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
          category_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          default_cost_per_kg?: number | null
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
          updated_by?: string | null
          uses_agua?: boolean
          uses_arboles?: boolean
          uses_co2?: boolean
          uses_energia?: boolean
          yield_loss_reason?: string
          yield_max?: number
          yield_min?: number
          yield_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_catalog_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "material_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      material_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
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
      public_tokens: {
        Row: {
          activo: boolean
          cliente: string
          fecha_creacion: string
          id: string
          notas: string | null
          token: string
        }
        Insert: {
          activo?: boolean
          cliente: string
          fecha_creacion?: string
          id?: string
          notas?: string | null
          token: string
        }
        Update: {
          activo?: boolean
          cliente?: string
          fecha_creacion?: string
          id?: string
          notas?: string | null
          token?: string
        }
        Relationships: []
      }
      system_parameters: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      temporary_materials: {
        Row: {
          approved_for_temp_use: boolean
          category: string | null
          created_at: string
          created_by: string
          default_yield: number
          description: string | null
          factor_agua: number | null
          factor_arboles: number | null
          factor_co2: number | null
          factor_energia: number | null
          id: string
          is_active: boolean
          name: string
          price_per_kg: number
          request_id: string | null
          requires_review: boolean
          updated_at: string
          uses_agua: boolean
          uses_arboles: boolean
          uses_co2: boolean
          uses_energia: boolean
          valid_until: string | null
        }
        Insert: {
          approved_for_temp_use?: boolean
          category?: string | null
          created_at?: string
          created_by: string
          default_yield?: number
          description?: string | null
          factor_agua?: number | null
          factor_arboles?: number | null
          factor_co2?: number | null
          factor_energia?: number | null
          id?: string
          is_active?: boolean
          name: string
          price_per_kg?: number
          request_id?: string | null
          requires_review?: boolean
          updated_at?: string
          uses_agua?: boolean
          uses_arboles?: boolean
          uses_co2?: boolean
          uses_energia?: boolean
          valid_until?: string | null
        }
        Update: {
          approved_for_temp_use?: boolean
          category?: string | null
          created_at?: string
          created_by?: string
          default_yield?: number
          description?: string | null
          factor_agua?: number | null
          factor_arboles?: number | null
          factor_co2?: number | null
          factor_energia?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price_per_kg?: number
          request_id?: string | null
          requires_review?: boolean
          updated_at?: string
          uses_agua?: boolean
          uses_arboles?: boolean
          uses_co2?: boolean
          uses_energia?: boolean
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temporary_materials_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "additional_material_requests"
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
      app_role:
        | "admin"
        | "user"
        | "operador"
        | "supervisor"
        | "administrador"
        | "direccion"
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
        "operador",
        "supervisor",
        "administrador",
        "direccion",
      ],
    },
  },
} as const
