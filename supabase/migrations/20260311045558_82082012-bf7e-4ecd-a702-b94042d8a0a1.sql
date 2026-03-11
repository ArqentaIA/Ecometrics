
-- ============================================================
-- RLS + POLICIES FOR ALL NEW TABLES
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_parameters ENABLE ROW LEVEL SECURITY;

-- ─── Update has_role to support new roles ───
-- (function already works with the expanded enum, no change needed)

-- ─── material_categories ───
CREATE POLICY "All authenticated can read categories"
  ON public.material_categories FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin/Direccion can manage categories"
  ON public.material_categories FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'administrador') OR
    public.has_role(auth.uid(), 'direccion')
  );

-- ─── audit_log ───
CREATE POLICY "Admin/Direccion can read audit log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'administrador') OR
    public.has_role(auth.uid(), 'direccion')
  );

-- Insert allowed for the audit trigger function (SECURITY DEFINER)
CREATE POLICY "System can insert audit log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- ─── additional_material_requests ───
CREATE POLICY "Users can view own requests"
  ON public.additional_material_requests FOR SELECT TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Admin/Direccion can view all requests"
  ON public.additional_material_requests FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'administrador') OR
    public.has_role(auth.uid(), 'direccion')
  );

CREATE POLICY "Authenticated can create requests"
  ON public.additional_material_requests FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admin/Direccion can update requests"
  ON public.additional_material_requests FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'administrador') OR
    public.has_role(auth.uid(), 'direccion')
  );

-- ─── temporary_materials ───
CREATE POLICY "Authenticated can read active temp materials"
  ON public.temporary_materials FOR SELECT TO authenticated
  USING (is_active = true OR created_by = auth.uid());

CREATE POLICY "Admin/Direccion can manage temp materials"
  ON public.temporary_materials FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'administrador') OR
    public.has_role(auth.uid(), 'direccion')
  );

CREATE POLICY "Supervisor can create temp materials"
  ON public.temporary_materials FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'supervisor') AND
    created_by = auth.uid()
  );

-- ─── system_parameters ───
CREATE POLICY "Authenticated can read parameters"
  ON public.system_parameters FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin/Direccion can manage parameters"
  ON public.system_parameters FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'administrador') OR
    public.has_role(auth.uid(), 'direccion')
  );
