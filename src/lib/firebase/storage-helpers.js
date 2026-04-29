// ============================================
// Firebase Storage — Helpers
// Upload, download, delete files with organized paths
// ============================================

import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from './config';

// ==================== Path Generators ====================

export const StoragePaths = {
  // Platform-level
  platformLogo: () => 'platform/logo.png',
  platformAsset: (name) => `platform/assets/${name}`,

  // Tenant-level
  tenantLogo: (tenantId) => `tenants/${tenantId}/logo.png`,
  tenantBanner: (tenantId) => `tenants/${tenantId}/banner.jpg`,
  tenantGallery: (tenantId, fileName) => `tenants/${tenantId}/gallery/${fileName}`,

  // Member
  memberAvatar: (tenantId, memberId) => `tenants/${tenantId}/members/${memberId}/avatar.jpg`,
  memberDocument: (tenantId, memberId, docName) => `tenants/${tenantId}/members/${memberId}/documents/${docName}`,

  // Trainer
  trainerAvatar: (tenantId, trainerId) => `tenants/${tenantId}/trainers/${trainerId}/avatar.jpg`,
  trainerCertificate: (tenantId, trainerId, certName) => `tenants/${tenantId}/trainers/${trainerId}/certs/${certName}`,

  // Finance
  receipt: (tenantId, transactionId) => `tenants/${tenantId}/receipts/${transactionId}.jpg`,

  // Platform Payments
  paymentReceipt: (paymentId) => `payments/${paymentId}/receipt.jpg`,
};

// ==================== Upload ====================

/**
 * Upload a file to Firebase Storage
 * @param {string} path - Storage path
 * @param {File|Blob} file - File to upload
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {{ url: string, error: string|null }}
 */
export async function uploadFile(path, file, maxSizeMB = 10) {
  try {
    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return {
        url: null,
        error: `File too large. Maximum ${maxSizeMB}MB allowed.`,
      };
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return {
        url: null,
        error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, PDF',
      };
    }

    const storageRef = ref(storage, path);
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedAt: new Date().toISOString(),
      },
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const url = await getDownloadURL(snapshot.ref);

    return { url, error: null };
  } catch (error) {
    console.error('[Storage] Upload error:', error);
    return { url: null, error: error.message };
  }
}

/**
 * Upload an image with optional compression
 * Uses canvas to resize images before upload
 */
export async function uploadImage(path, file, maxWidth = 800, quality = 0.85) {
  if (typeof window === 'undefined') return uploadFile(path, file);

  try {
    // If file is small enough or not an image, upload directly
    if (file.size < 200 * 1024 || !file.type.startsWith('image/')) {
      return uploadFile(path, file);
    }

    // Compress via canvas
    const compressed = await compressImage(file, maxWidth, quality);
    return uploadFile(path, compressed);
  } catch {
    // Fallback to direct upload
    return uploadFile(path, file);
  }
}

/**
 * Compress an image using canvas
 */
async function compressImage(file, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Compression failed'));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ==================== Delete ====================

/**
 * Delete a file from Storage
 */
export async function deleteFile(path) {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { error: null };
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      return { error: null }; // Already deleted
    }
    return { error: error.message };
  }
}

// ==================== Get URL ====================

/**
 * Get download URL for a file
 */
export async function getFileURL(path) {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return { url, error: null };
  } catch (error) {
    return { url: null, error: error.message };
  }
}

// ==================== List Files ====================

/**
 * List all files in a directory
 */
export async function listFiles(dirPath) {
  try {
    const storageRef = ref(storage, dirPath);
    const result = await listAll(storageRef);
    const files = await Promise.all(
      result.items.map(async (item) => ({
        name: item.name,
        fullPath: item.fullPath,
        url: await getDownloadURL(item),
      }))
    );
    return { files, error: null };
  } catch (error) {
    return { files: [], error: error.message };
  }
}
