/**
 * Mahdev Firebase Storage Foundation (Phase 22)
 * File and media upload helpers for portfolio, gallery, and invoice PDFs.
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from '../lib/firebase';

class FirebaseStorageService {
  /**
   * Upload file to specific storage path
   */
  async uploadFile(path: string, file: Blob | Uint8Array | ArrayBuffer): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const snap = await uploadBytes(storageRef, file);
      return await getDownloadURL(snap.ref);
    } catch (err) {
      console.warn('[FirebaseStorage] uploadFile error:', err);
      throw err;
    }
  }

  /**
   * Get direct download URL for stored asset
   */
  async getFileURL(path: string): Promise<string> {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  }

  /**
   * Delete asset from storage
   */
  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  }

  /**
   * List files in a directory
   */
  async listFiles(dirPath: string): Promise<string[]> {
    try {
      const dirRef = ref(storage, dirPath);
      const res = await listAll(dirRef);
      return Promise.all(res.items.map((item) => getDownloadURL(item)));
    } catch (err) {
      console.warn('[FirebaseStorage] listFiles error:', err);
      return [];
    }
  }
}

export const firebaseStorageService = new FirebaseStorageService();
