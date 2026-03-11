import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "operador" | "supervisor" | "administrador" | "direccion" | "admin" | "user";

export interface RolePermissions {
  canEditKg: boolean;
  canEditPrice: boolean;
  canConfirmCapture: boolean;
  canReopenCapture: boolean;
  canManageCatalog: boolean;
  canManageFactors: boolean;
  canManageUsers: boolean;
  canViewAuditLog: boolean;
  canRequestAdditionalMaterial: boolean;
  canApproveAdditionalMaterial: boolean;
  canConvertToOfficial: boolean;
  canViewExecutiveReports: boolean;
}

const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  operador: {
    canEditKg: true,
    canEditPrice: false,
    canConfirmCapture: false, // controlled by system_parameters
    canReopenCapture: false,
    canManageCatalog: false,
    canManageFactors: false,
    canManageUsers: false,
    canViewAuditLog: false,
    canRequestAdditionalMaterial: true,
    canApproveAdditionalMaterial: false,
    canConvertToOfficial: false,
    canViewExecutiveReports: false,
  },
  supervisor: {
    canEditKg: true,
    canEditPrice: false,
    canConfirmCapture: true,
    canReopenCapture: false,
    canManageCatalog: false,
    canManageFactors: false,
    canManageUsers: false,
    canViewAuditLog: false,
    canRequestAdditionalMaterial: true,
    canApproveAdditionalMaterial: false,
    canConvertToOfficial: false,
    canViewExecutiveReports: false,
  },
  administrador: {
    canEditKg: true,
    canEditPrice: true,
    canConfirmCapture: true,
    canReopenCapture: true,
    canManageCatalog: true,
    canManageFactors: true,
    canManageUsers: true,
    canViewAuditLog: true,
    canRequestAdditionalMaterial: true,
    canApproveAdditionalMaterial: true,
    canConvertToOfficial: true,
    canViewExecutiveReports: false,
  },
  // Legacy 'admin' maps to administrador
  admin: {
    canEditKg: true,
    canEditPrice: true,
    canConfirmCapture: true,
    canReopenCapture: true,
    canManageCatalog: true,
    canManageFactors: true,
    canManageUsers: true,
    canViewAuditLog: true,
    canRequestAdditionalMaterial: true,
    canApproveAdditionalMaterial: true,
    canConvertToOfficial: true,
    canViewExecutiveReports: false,
  },
  direccion: {
    canEditKg: true,
    canEditPrice: true,
    canConfirmCapture: true,
    canReopenCapture: true,
    canManageCatalog: true,
    canManageFactors: true,
    canManageUsers: true,
    canViewAuditLog: true,
    canRequestAdditionalMaterial: true,
    canApproveAdditionalMaterial: true,
    canConvertToOfficial: true,
    canViewExecutiveReports: true,
  },
  // Legacy 'user' maps to operador
  user: {
    canEditKg: true,
    canEditPrice: false,
    canConfirmCapture: false,
    canReopenCapture: false,
    canManageCatalog: false,
    canManageFactors: false,
    canManageUsers: false,
    canViewAuditLog: false,
    canRequestAdditionalMaterial: true,
    canApproveAdditionalMaterial: false,
    canConvertToOfficial: false,
    canViewExecutiveReports: false,
  },
};

const DEFAULT_PERMISSIONS: RolePermissions = ROLE_PERMISSIONS.operador;

const ROLE_LABELS: Record<string, string> = {
  operador: "Operador",
  supervisor: "Supervisor",
  administrador: "Administrador",
  direccion: "Dirección",
  admin: "Administrador",
  user: "Operador",
};

export function useUserRole(user: User | null) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    async function fetchRole() {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .limit(1)
        .single();

      if (error || !data) {
        setRole("operador");
      } else {
        setRole(data.role as AppRole);
      }
      setLoading(false);
    }
    fetchRole();
  }, [user]);

  const permissions: RolePermissions = role
    ? (ROLE_PERMISSIONS[role] ?? DEFAULT_PERMISSIONS)
    : DEFAULT_PERMISSIONS;

  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : "—";

  return { role, roleLabel, permissions, loading };
}
