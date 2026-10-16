import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import {
  UserProfile,
  ProcessedDocument,
  DoctorSharingSession,
  MedicalEntity,
} from '../types/clinical';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfigJson);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with configured databaseId
export const db = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

// Test Firestore Connection as required by Firebase integration guidelines
export async function checkFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.code === 'not-found') {
      return true;
    }
    return false;
  }
}

export async function testConnection() {
  try {
    await checkFirestoreConnection();
  } catch {}
}

// Auto-run connection check on module initialization
testConnection();

// Normalize mobile/email for Firebase Auth credentials
export function toAuthEmail(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  const cleanMobile = trimmed.replace(/\D/g, '');
  return `${cleanMobile}@takecare.health`;
}

// ==========================================
// FIREBASE AUTHENTICATION API
// ==========================================

export async function firebaseRegister(
  emailOrMobile: string,
  password: string,
  fullName?: string
): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const authEmail = toAuthEmail(emailOrMobile);
  const cleanMobile = emailOrMobile.includes('@') ? '' : emailOrMobile.replace(/\D/g, '');

  const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
  const fbUser = userCredential.user;

  if (fullName) {
    try {
      await updateFirebaseProfile(fbUser, { displayName: fullName });
    } catch {}
  }

  // Create empty initial profile in Firestore
  const newProfile: UserProfile = {
    id: `prof_${fbUser.uid.slice(0, 8)}`,
    userId: fbUser.uid,
    fullName: fullName || '',
    mobile: cleanMobile,
    isMobileVerified: true,
    email: emailOrMobile.includes('@') ? emailOrMobile : '',
    isComplete: !!fullName,
    updatedAt: Date.now(),
  };

  try {
    await setDoc(doc(db, 'users', fbUser.uid), {
      ...newProfile,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Initial firestore user doc write warning:', err);
  }

  return { user: fbUser, profile: newProfile };
}

export async function firebaseLogin(
  emailOrMobile: string,
  password: string
): Promise<{ user: FirebaseUser; profile: UserProfile | null }> {
  const authEmail = toAuthEmail(emailOrMobile);
  const userCredential = await signInWithEmailAndPassword(auth, authEmail, password);
  const fbUser = userCredential.user;

  // Retrieve Firestore profile
  let profile = await firestoreGetUserProfile(fbUser.uid);
  if (!profile) {
    // Generate default profile if not found
    profile = {
      id: `prof_${fbUser.uid.slice(0, 8)}`,
      userId: fbUser.uid,
      fullName: fbUser.displayName || '',
      mobile: emailOrMobile.includes('@') ? '' : emailOrMobile.replace(/\D/g, ''),
      isMobileVerified: true,
      email: fbUser.email || '',
      isComplete: !!fbUser.displayName,
      updatedAt: Date.now(),
    };
    try {
      await setDoc(doc(db, 'users', fbUser.uid), profile);
    } catch {}
  }

  return { user: fbUser, profile };
}

export async function firebaseLogout(): Promise<void> {
  await signOut(auth);
}

// ==========================================
// FIRESTORE USER PROFILE API
// ==========================================

export async function firestoreGetUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (err) {
    console.error('Error fetching user profile from Firestore:', err);
    return null;
  }
}

export async function firestoreSaveUserProfile(
  userId: string,
  profileData: Partial<UserProfile>
): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', userId);
  const existing = await firestoreGetUserProfile(userId);

  const updatedProfile: UserProfile = {
    id: existing?.id || `prof_${userId.slice(0, 8)}`,
    userId,
    fullName: profileData.fullName ?? existing?.fullName ?? '',
    dob: profileData.dob ?? existing?.dob,
    gender: profileData.gender ?? existing?.gender,
    mobile: profileData.mobile ?? existing?.mobile ?? '',
    isMobileVerified: profileData.isMobileVerified ?? existing?.isMobileVerified ?? true,
    email: profileData.email ?? existing?.email,
    emergencyContactName: profileData.emergencyContactName ?? existing?.emergencyContactName,
    emergencyContactPhone: profileData.emergencyContactPhone ?? existing?.emergencyContactPhone,
    preferredLanguage: profileData.preferredLanguage ?? existing?.preferredLanguage,
    bloodGroup: profileData.bloodGroup ?? existing?.bloodGroup,
    isComplete: !!(profileData.fullName || existing?.fullName),
    updatedAt: Date.now(),
  };

  await setDoc(userDocRef, updatedProfile, { merge: true });
  return updatedProfile;
}

// ==========================================
// FIRESTORE MEDICAL DOCUMENTS API
// ==========================================

export async function firestoreGetUserDocuments(userId: string): Promise<ProcessedDocument[]> {
  try {
    const docsColRef = collection(db, 'users', userId, 'documents');
    const snap = await getDocs(docsColRef);
    const docs: ProcessedDocument[] = [];
    snap.forEach((d) => {
      docs.push(d.data() as ProcessedDocument);
    });
    return docs.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  } catch (err) {
    console.error('Error fetching documents from Firestore:', err);
    return [];
  }
}

export async function firestoreSaveUserDocument(
  userId: string,
  docData: ProcessedDocument
): Promise<ProcessedDocument> {
  const documentRef = doc(db, 'users', userId, 'documents', docData.id);
  const cleanData: ProcessedDocument = {
    ...docData,
    userId,
  };
  await setDoc(documentRef, cleanData);
  return cleanData;
}

export async function firestoreDeleteUserDocument(userId: string, docId: string): Promise<boolean> {
  try {
    const documentRef = doc(db, 'users', userId, 'documents', docId);
    await deleteDoc(documentRef);
    return true;
  } catch (err) {
    console.error('Error deleting document from Firestore:', err);
    return false;
  }
}

export async function firestoreUpdateDocumentEntity(
  userId: string,
  docId: string,
  entityId: string,
  newStatus: string,
  newValue?: string
): Promise<ProcessedDocument | null> {
  const documentRef = doc(db, 'users', userId, 'documents', docId);
  const snap = await getDoc(documentRef);
  if (!snap.exists()) return null;

  const currentDoc = snap.data() as ProcessedDocument;
  const updatedEntities = (currentDoc.extractedEntities || []).map((entity: MedicalEntity) => {
    if (entity.id === entityId) {
      return {
        ...entity,
        status: newStatus as any,
        editedValue: newValue !== undefined ? newValue : entity.editedValue,
      };
    }
    return entity;
  });

  const updatedDoc: ProcessedDocument = {
    ...currentDoc,
    extractedEntities: updatedEntities,
    status: updatedEntities.every((e) => e.status === 'Confirmed') ? 'Confirmed' : currentDoc.status,
  };

  await setDoc(documentRef, updatedDoc, { merge: true });
  return updatedDoc;
}

// ==========================================
// FIRESTORE SHARING SESSIONS API
// ==========================================

export async function firestoreSaveSharingSession(session: DoctorSharingSession): Promise<void> {
  const sessionRef = doc(db, 'sharing_sessions', session.code);
  await setDoc(sessionRef, {
    code: session.code,
    userId: session.patientId,
    duration: session.duration,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    status: session.status,
    scope: session.scope,
    doctorDetails: session.doctorDetails,
    authToken: session.authToken,
  });
}

export async function firestoreGetSharingSession(code: string): Promise<DoctorSharingSession | null> {
  try {
    const sessionRef = doc(db, 'sharing_sessions', code);
    const snap = await getDoc(sessionRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      code: data.code,
      patientId: data.userId,
      duration: data.duration,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      remainingSeconds: Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000)),
      status: data.status,
      scope: data.scope,
      doctorDetails: data.doctorDetails,
      authToken: data.authToken,
      consultationNote: data.consultationNote,
      isSigned: data.isSigned,
      signedNmcReg: data.signedNmcReg,
    };
  } catch (err) {
    console.error('Error fetching sharing session from Firestore:', err);
    return null;
  }
}

export async function firestoreRevokeSharingSession(code: string, userId: string): Promise<void> {
  const sessionRef = doc(db, 'sharing_sessions', code);
  await setDoc(
    sessionRef,
    {
      status: 'revoked',
      revokedAt: Date.now(),
    },
    { merge: true }
  );
}
