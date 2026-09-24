'use client';

import { useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { requiresExtractedText } from '@/lib/parse/types';
import type { UploadType } from '@/types';

export const PARSE_DOCUMENT_TIMEOUT_MS = 90_000;

export type UploadPhase = 'idle' | 'uploading' | 'parsing' | 'ready' | 'error';

interface UseFileUploadProps {
  bucket?: string;
  uploadType: UploadType;
  onParsed?: (uploadId: string, text: string) => void;
  accept?: string;
}

interface UseFileUploadReturn {
  file: File | null;
  storagePath: string | null;
  uploadId: string | null;
  parsedText: string | null;
  isUploading: boolean;
  phase: UploadPhase;
  error: string | null;
  handleFile: (file: File) => Promise<void>;
  removeFile: () => Promise<void>;
}

type StoredAttempt = {
  name: string;
  size: number;
  uploadId: string;
  path: string;
};

function parseTimeoutError(): Error {
  return new Error(
    'This document is taking too long to read. Try a smaller file, or wait a moment and try again.',
  );
}

async function fetchParseDocument(
  body: { storagePath: string; uploadId: string; uploadType: UploadType },
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch('/api/parse-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw parseTimeoutError();
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function useFileUpload({
  bucket = 'uploads',
  uploadType,
  onParsed,
  accept = '',
}: UseFileUploadProps): UseFileUploadReturn {
  const [file, setFile] = useState<File | null>(null);
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [parsedText, setParsedText] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const storedAttemptRef = useRef<StoredAttempt | null>(null);

  const handleFile = async (incoming: File) => {
    if (inFlightRef.current) return;

    setError(null);

    if (accept) {
      const accepted = accept.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const nameParts = incoming.name.split('.');
      const ext = nameParts.length > 1 ? `.${nameParts.pop()!.toLowerCase()}` : '';
      if (!accepted.includes(ext)) {
        setPhase('error');
        setError(
          `Only ${accepted.join(', ')} files are accepted. You uploaded a ${ext || 'unknown'} file.`,
        );
        return;
      }
    }

    inFlightRef.current = true;
    setIsUploading(true);
    setFile(incoming);
    setStoragePath(null);
    setParsedText(null);
    setPhase('uploading');

    try {
      const prior = storedAttemptRef.current;
      const reuseStored =
        prior !== null &&
        prior.name === incoming.name &&
        prior.size === incoming.size;

      let path = prior?.path;
      let newUploadId = prior?.uploadId;

      if (!reuseStored) {
        const supabase = createClient();

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          throw new Error('Not authenticated');
        }
        const userId = userData.user.id;

        const ext = incoming.name.split('.').pop() ?? 'bin';
        const stem = incoming.name.replace(/\.[^.]+$/, '');
        path = `${userId}/${uploadType}/${stem}-${Date.now()}.${ext}`;

        const { error: storageError } = await supabase.storage
          .from(bucket)
          .upload(path, incoming);
        if (storageError) throw new Error(storageError.message);

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

        newUploadId = (insertData as { id: string }).id;
        storedAttemptRef.current = {
          name: incoming.name,
          size: incoming.size,
          uploadId: newUploadId,
          path,
        };
      }

      if (!path || !newUploadId) {
        throw new Error('Upload failed');
      }

      setPhase('parsing');
      const parseResponse = await fetchParseDocument(
        { storagePath: path, uploadId: newUploadId, uploadType },
        PARSE_DOCUMENT_TIMEOUT_MS,
      );
      if (!parseResponse.ok) {
        let message = 'The document could not be processed.';
        try {
          const data = (await parseResponse.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // Keep the generic processing error when the response is not JSON.
        }
        throw new Error(message);
      }
      const parsedData = (await parseResponse.json()) as { text?: string };
      const extracted = parsedData.text ?? '';
      if (requiresExtractedText(uploadType) && !extracted.trim()) {
        throw new Error(
          'No readable text was found in this document. Please upload a clearer curriculum file.',
        );
      }

      setUploadId(newUploadId);
      setStoragePath(path);
      setParsedText(extracted);
      setPhase('ready');
      onParsed?.(newUploadId, extracted);
    } catch (err) {
      setStoragePath(null);
      setUploadId(storedAttemptRef.current?.uploadId ?? null);
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      inFlightRef.current = false;
      setIsUploading(false);
    }
  };

  const removeFile = async () => {
    const pathToRemove = storagePath ?? storedAttemptRef.current?.path;
    const idToRemove = uploadId ?? storedAttemptRef.current?.uploadId;
    storedAttemptRef.current = null;

    if (!pathToRemove || !idToRemove) {
      setFile(null);
      setStoragePath(null);
      setUploadId(null);
      setParsedText(null);
      setPhase('idle');
      setError(null);
      return;
    }

    try {
      const supabase = createClient();
      await supabase.storage.from(bucket).remove([pathToRemove]);
      await supabase.from('uploads').delete().eq('id', idToRemove);
    } catch {
      // Best-effort cleanup — reset state regardless
    } finally {
      setFile(null);
      setStoragePath(null);
      setUploadId(null);
      setParsedText(null);
      setPhase('idle');
      setError(null);
    }
  };

  return {
    file,
    storagePath,
    uploadId,
    parsedText,
    isUploading,
    phase,
    error,
    handleFile,
    removeFile,
  };
}
