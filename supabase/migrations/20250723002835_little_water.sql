/*
  # Create storage bucket for pengaduan images

  1. Storage
    - Create `pengaduan-images` bucket
    - Set bucket to public for easy access
    - Add RLS policies for authenticated users to upload files
    - Add policy for public read access to files

  2. Security
    - Enable RLS on storage.objects
    - Allow authenticated users to upload files
    - Allow public read access to uploaded files
*/

-- Create the pengaduan-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('pengaduan-images', 'pengaduan-images', true);

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload pengaduan images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pengaduan-images');

-- Allow authenticated users to view their own files
CREATE POLICY "Allow users to view pengaduan images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pengaduan-images');

-- Allow public read access to pengaduan images
CREATE POLICY "Allow public read access to pengaduan images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pengaduan-images');