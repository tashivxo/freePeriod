'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UploadType } from '@/types/database';

interface UseFileUploadProps {
  bucket?: string;
  uploadType: UploadType;
  onParsed?: (uploadId: string) => void;
}

interface UseFileUploadReturn {
  file: File | null;
  storagePath: string | null;
  uploadId: string | null;
  isUploading: boolean;
  error: string | null;
  handleFile: (file: File) => Promise<void>;
  removeFile: () => Promise<void>;
}

export function useFileUpload({
  bucket = 'uploads',
  uploadType,
  onParsed,
}: UseFileUploadProps): UseFileUploadReturn {
  const [file, setFile] = useState<File | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (incoming: File) => {
    setError(null);
    setIsUploading(true);
    try {
      const supabase = createClient();

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('Not authenticated');
      }
      const userId = userData.user.id;

      // Build storage path: {userId}/{uploadType}/{stem}-{timestamp}.{ext}
      const ext = incoming.name.split('.').pop() ?? 'bin';
      const stem = incoming.name.replace(/\.[^.]+$/, '');
      const path = `${userId}/${uploadType}/${stem}-${Date.now()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from(bucket)
        .upload(path, incoming);
      if (storageError) throw new Error(storageError.message);

      // Insert upload record
      const { data: insertData, error: insertError } = await supabase
        .from('uploads')
        .insert({
          user_id: userId,
          type: uploadType,
          file_name: incoming.name,
          storage_path: path,
          lesson_id: null,
          parsed_content: null,
        })
        .select('id')
        .single();
      if (insertError) throw new Error(insertError.message);

      const newUploadId = (insertData as { id: string }).id;

      // Trigger parse-document
      await fetch('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: path, uploadId: newUploadId }),
      });

      setFile(incoming);
      setStoragePath(path);
      setUploadId(newUploadId);
      onParsed?.(newUploadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = async () => {
    if (!storagePath || !uploadId) {
      setFile(null);
      setStoragePath(null);
      setUploadId(null);
      return;
    }

    try {
      const supabase = createClient();
      await supabase.storage.from(bucket).remove([storagePath]);
      await supabase.from('uploads').delete().eq('id', uploadId);
    } catch {
      // Best-effort cleanup — reset state regardless
    } finally {
      setFile(null);
      setStoragePath(null);
      setUploadId(null);
      setError(null);
    }
  };

  return {
    file,
    storagePath,
    uploadId,
    isUploading,
    error,
    handleFile,
    removeFile,
  };
}
