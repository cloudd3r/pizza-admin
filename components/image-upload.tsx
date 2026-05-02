'use client';

import { ImagePlus, Loader2, Trash } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from './ui/button';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

interface CloudinaryUploadResponse {
  secure_url?: string;
  error?: { message?: string };
}

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const uploadToCloudinary = async (file: File): Promise<string> => {
  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary не настроен. Добавь NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME и NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET в .env.local',
    );
  }

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: form },
  );

  const json = (await res.json()) as CloudinaryUploadResponse;

  if (!res.ok || !json.secure_url) {
    throw new Error(
      json.error?.message ?? `Cloudinary upload failed (${res.status})`,
    );
  }

  return json.secure_url;
};

/**
 * Single-image uploader backed by Cloudinary unsigned uploads.
 *
 * The component is controlled — `value` is the current image URL (or
 * empty string), `onChange` receives the new secure URL after a
 * successful upload, and `onRemove` clears it.
 *
 * Requires two public env vars at build time:
 *   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   - NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET (an "unsigned" preset)
 *
 * The Cloudinary REST endpoint accepts the file directly from the
 * browser, so we don't need a server-side proxy or any Cloudinary
 * SDK.
 */
export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
      toast.success('Изображение загружено');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось загрузить файл';
      toast.error(message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onPickFile = () => inputRef.current?.click();

  if (value) {
    return (
      <div className='relative w-48 h-48 rounded-md overflow-hidden border'>
        <Image
          src={value}
          alt='Uploaded image'
          fill
          sizes='192px'
          className='object-cover'
        />
        <div className='absolute top-2 right-2 z-10'>
          <Button
            type='button'
            variant='destructive'
            size='sm'
            disabled={disabled || uploading}
            onClick={onRemove}
          >
            <Trash className='w-4 h-4' />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Button
        type='button'
        variant='outline'
        disabled={disabled || uploading}
        onClick={onPickFile}
        className='w-48 h-48 flex flex-col gap-2 border-dashed'
      >
        {uploading ? (
          <Loader2 className='w-6 h-6 animate-spin' />
        ) : (
          <ImagePlus className='w-6 h-6' />
        )}
        <span className='text-xs text-muted-foreground'>
          {uploading ? 'Загрузка…' : 'Загрузить картинку'}
        </span>
      </Button>
    </div>
  );
}
