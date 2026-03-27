-- Create public bucket for templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('plantillas', 'plantillas', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for plantillas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'plantillas');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated upload to plantillas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'plantillas');