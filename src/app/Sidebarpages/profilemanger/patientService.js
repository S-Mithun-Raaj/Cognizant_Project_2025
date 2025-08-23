import { db } from '../../firebaseConfig';
import { 
  doc, 
  setDoc, 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

// Save patient profile to Firestore
export const savePatientProfile = async (profileData) => {
  try {
    const docRef = await addDoc(collection(db, 'profileData'), {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Profile saved successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

// Update existing patient profile
export const updatePatientProfile = async (profileId, profileData) => {
  try {
    const profileRef = doc(db, 'profileData', profileId);
    await updateDoc(profileRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    });
    console.log('Profile updated successfully!');
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Get all patient profiles
export const getAllPatientProfiles = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'profileData'));
    const profiles = [];
    querySnapshot.forEach((docSnap) => {
      profiles.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    return profiles;
  } catch (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }
};

// Delete patient profile
export const deletePatientProfile = async (profileId) => {
  try {
    await deleteDoc(doc(db, 'profileData', profileId));
    console.log('Profile deleted successfully!');
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
};

// Save patient profile with custom ID (alternative method)
export const savePatientProfileWithId = async (profileId, profileData) => {
  try {
    await setDoc(doc(db, 'profileData', profileId), {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('Profile saved successfully with custom ID!');
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};