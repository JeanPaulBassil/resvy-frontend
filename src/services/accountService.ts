

import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { auth, db } from '@/lib/firebase';
import { storage } from '@/lib/firebase';
import type { AccountDetailsSchema } from '@/schemas/settingsSchema';

async function uploadProfilePhoto(file: File, userId: string): Promise<string> {
  const storageRef = ref(storage, `users/${userId}/profilePhoto/${file.name}`);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    console.log('snapshot', snapshot);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('downloadURL', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw new Error('Failed to upload photo');
  }
}

interface UserProfileUpdate {
  username?: string;
  phoneNumber?: string;
  photoURL?: string;
}

async function updateUserProfile(userId: string, updateData: UserProfileUpdate) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found.');
  }

  if (updateData.username || updateData.photoURL) {
    try {
      await updateProfile(currentUser, {
        displayName: updateData.username ?? undefined,
        photoURL: updateData.photoURL ?? undefined,
      });
    } catch (error) {
      console.error('Error updating Firebase Auth user profile:', error);
      throw new Error('Failed to update Firebase Auth user profile');
    }
  }

  if (updateData.phoneNumber) {
    const userDocRef = doc(db, 'users', userId);
    try {
      await updateDoc(userDocRef, {
        phoneNumber: updateData.phoneNumber,
        displayName: updateData.username,
        photoURL: updateData.photoURL,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating Firestore user document:', error);
      throw new Error('Failed to update Firestore user document');
    }
  }
}

export async function updateAccountDetails(data: AccountDetailsSchema): Promise<void> {
  console.log('Starting account details update:', data);

  if (!data.uid) {
    throw new Error('id is required for account details update');
  }

  let photoURL: string | undefined;

  if (data.photo && data.photo instanceof File) {
    photoURL = await uploadProfilePhoto(data.photo, data.uid);
  }

  await updateUserProfile(data.uid, {
    username: data.username,
    phoneNumber: data.phoneNumber,
    photoURL: photoURL
  });

  console.log('Account details updated successfully');
}
