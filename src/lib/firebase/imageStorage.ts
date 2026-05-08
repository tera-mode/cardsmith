import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection, addDoc, getDocs, query, orderBy, doc, deleteDoc,
} from 'firebase/firestore';
import { storage, db } from './config';
import type { UserImage } from '@/lib/types/meta';

// Storage path: user-images/{userId}/{timestamp}.webp
// Firestore: users/{userId}/imageLib/{docId} = { url, createdAt }

export async function uploadUserImage(userId: string, blob: Blob): Promise<UserImage> {
  const timestamp = Date.now();
  const storageRef = ref(storage, `user-images/${userId}/${timestamp}.webp`);
  await uploadBytes(storageRef, blob, { contentType: 'image/webp' });
  const url = await getDownloadURL(storageRef);

  const docRef = await addDoc(
    collection(db, 'users', userId, 'imageLib'),
    { url, createdAt: timestamp }
  );

  return { id: docRef.id, url, createdAt: timestamp };
}

export async function listUserImages(userId: string): Promise<UserImage[]> {
  const q = query(
    collection(db, 'users', userId, 'imageLib'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    url: d.data().url as string,
    createdAt: d.data().createdAt as number,
  }));
}

export async function deleteUserImage(userId: string, imageId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'imageLib', imageId));
}
