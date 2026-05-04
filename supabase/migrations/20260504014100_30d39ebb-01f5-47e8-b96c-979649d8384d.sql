
-- 1. report_audit_log: remove anon read, expose verification via RPC
DROP POLICY IF EXISTS "Anon can read for verification" ON public.report_audit_log;

CREATE OR REPLACE FUNCTION public.verify_report_by_folio(_folio text)
RETURNS TABLE(
  folio text,
  hash_sha256 text,
  firma_digital text,
  dataset_id text,
  tipo_reporte text,
  fecha_generacion timestamptz,
  parametros_json jsonb,
  total_registros integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT folio, hash_sha256, firma_digital, dataset_id, tipo_reporte,
         fecha_generacion, parametros_json, total_registros
  FROM public.report_audit_log
  WHERE folio = _folio
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.verify_report_by_folio(text) TO anon, authenticated;

-- 2. material_factors: restrict direct reads to admin/direccion
DROP POLICY IF EXISTS "Authenticated can read factors" ON public.material_factors;

CREATE POLICY "Admin/Direccion can read factors"
ON public.material_factors
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'administrador'::app_role)
  OR has_role(auth.uid(), 'direccion'::app_role)
);

-- 3. plantillas storage bucket: restrict writes to admins, prevent listing
DROP POLICY IF EXISTS "Public can upload plantillas" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload plantillas" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload plantillas" ON storage.objects;
DROP POLICY IF EXISTS "Plantillas insert" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage plantillas insert" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage plantillas update" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage plantillas delete" ON storage.objects;
DROP POLICY IF EXISTS "Plantillas public read by path" ON storage.objects;

CREATE POLICY "Admins manage plantillas insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'plantillas'
  AND (has_role(auth.uid(), 'admin'::app_role)
       OR has_role(auth.uid(), 'administrador'::app_role)
       OR has_role(auth.uid(), 'direccion'::app_role))
);

CREATE POLICY "Admins manage plantillas update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'plantillas'
  AND (has_role(auth.uid(), 'admin'::app_role)
       OR has_role(auth.uid(), 'administrador'::app_role)
       OR has_role(auth.uid(), 'direccion'::app_role))
);

CREATE POLICY "Admins manage plantillas delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'plantillas'
  AND (has_role(auth.uid(), 'admin'::app_role)
       OR has_role(auth.uid(), 'administrador'::app_role)
       OR has_role(auth.uid(), 'direccion'::app_role))
);
