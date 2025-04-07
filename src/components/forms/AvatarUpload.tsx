import { Avatar, Badge, Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface AvatarUploadProps {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
  onPhotoChange: (file: File) => void;
}

export function AvatarUpload({ photoURL, displayName, email, onPhotoChange }: AvatarUploadProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPEG, PNG, or GIF)');
        return;
      }

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('Image size should be less than 5MB');
        return;
      }

      onPhotoChange(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    },
    [onPhotoChange]
  );

  const handleEditClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  return (
    <div className="flex gap-4 py-4">
      <Badge
        showOutline
        classNames={{
          badge: 'w-5 h-5',
        }}
        color="primary"
        content={
          <Button
            isIconOnly
            className="p-0 text-primary-foreground cursor-pointer"
            radius="full"
            size="sm"
            variant="light"
            onClick={handleEditClick}
          >
            <Icon icon="solar:pen-2-linear" />
          </Button>
        }
        placement="bottom-right"
        shape="circle"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handlePhotoUpload}
        />
        <Avatar
          className="h-14 w-14"
          src={photoPreview || photoURL || undefined}
          showFallback
          name={displayName || email?.split('@')[0]}
          alt="Profile Photo"
        />
      </Badge>
      <div className="flex flex-col items-start justify-center">
        <p className="font-medium">{displayName || email?.split('@')[0]}</p>
        <span className="text-small text-default-500">{email}</span>
      </div>
    </div>
  );
} 