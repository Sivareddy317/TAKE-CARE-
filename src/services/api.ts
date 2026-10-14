import {
  AuthUser,
  UserProfile,
  ProcessedDocument,
  UserHealthSummary,
  DoctorSharingSession,
} from '../types/clinical';
import {
  firebaseRegister,
  firebaseLogin,
  firebaseLogout,
  firestoreSaveUserProfile,
  firestoreGetUserProfile,
  firestoreGetUserDocuments,
  firestoreSaveUserDocument,
  firestoreDeleteUserDocument,
  firestoreUpdateDocumentEntity,
  firestoreSaveSharingSession,
  firestoreRevokeSharingSession,
  firestoreGetSharingSession,
} from './firebase';

const TOKEN_KEY = 'takecare_auth_token';

export const ApiService = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },

  clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // =====================
  // AUTH
  // =====================
  async register(mobile: string, password: string, fullName: string) {
    // 1. Register with backend
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, password, fullName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    // 2. Register with Firebase Auth & Firestore
    try {
      await firebaseRegister(mobile, password, fullName);
    } catch (fbErr: any) {
      // If user already exists in Firebase Auth, attempt login
      if (fbErr.code === 'auth/email-already-in-use') {
        try {
          await firebaseLogin(mobile, password);
        } catch {}
      } else {
        console.warn('Firebase registration notice:', fbErr.message);
      }
    }

    return data;
  },

  async verify(mobile: string, code: string): Promise<{ token: string; user: AuthUser; profile: UserProfile }> {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Verification failed');
    if (data.token) {
      this.setToken(data.token);
    }

    // Sync Firestore profile
    try {
      if (data.user?.id) {
        await firestoreSaveUserProfile(data.user.id, data.profile);
      }
    } catch {}

    return data;
  },

  async login(mobile: string, password: string): Promise<{ token: string; user: AuthUser; profile: UserProfile }> {
    // 1. Backend Login
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (data.token) {
      this.setToken(data.token);
    }

    // 2. Firebase Auth Login & Firestore Profile Sync
    try {
      await firebaseLogin(mobile, password);
      if (data.user?.id) {
        await firestoreSaveUserProfile(data.user.id, data.profile);
      }
    } catch (fbErr: any) {
      console.warn('Firebase auth sync warning:', fbErr.message);
    }

    return data;
  },

  async devQuickLogin(name: string = 'Alex Chen', mobile: string = '9876543210') {
    const res = await fetch('/api/auth/dev-quick-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mobile }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Quick login failed');
    if (data.token) {
      this.setToken(data.token);
    }

    // Sync with Firebase Auth
    try {
      try {
        await firebaseLogin(mobile, 'DevPass123!');
      } catch {
        await firebaseRegister(mobile, 'DevPass123!', name);
      }
      if (data.user?.id) {
        await firestoreSaveUserProfile(data.user.id, data.profile);
      }
    } catch {}

    return data;
  },

  async getMe(): Promise<{ user: AuthUser; profile: UserProfile } | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401) {
          this.clearToken();
        }
        return null;
      }
      const data = await res.json();

      // Check if Firestore has more recent profile data
      if (data.user?.id) {
        try {
          const fsProfile = await firestoreGetUserProfile(data.user.id);
          if (fsProfile && fsProfile.updatedAt > (data.profile?.updatedAt || 0)) {
            data.profile = fsProfile;
          }
        } catch {}
      }

      return data;
    } catch {
      return null;
    }
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch {}
    try {
      await firebaseLogout();
    } catch {}
    this.clearToken();
  },

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/account', {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Account deletion failed');
    try {
      await firebaseLogout();
    } catch {}
    this.clearToken();
    return data;
  },

  // =====================
  // PROFILE
  // =====================
  async getProfile(): Promise<UserProfile> {
    const res = await fetch('/api/profile', {
      headers: this.getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch profile');

    // Sync with Firestore if available
    try {
      if (data.profile?.userId) {
        const fsProfile = await firestoreGetUserProfile(data.profile.userId);
        if (fsProfile) return fsProfile;
      }
    } catch {}

    return data.profile;
  },

  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');

    // Save to Firestore
    try {
      if (data.profile?.userId) {
        await firestoreSaveUserProfile(data.profile.userId, data.profile);
      }
    } catch (err) {
      console.warn('Firestore update profile warning:', err);
    }

    return data.profile;
  },

  // =====================
  // DOCUMENTS
  // =====================
  async getDocuments(): Promise<ProcessedDocument[]> {
    const res = await fetch('/api/documents', {
      headers: this.getAuthHeaders(),
    });
    const data = await res.json();
    const serverDocs = (res.ok && data.documents) ? data.documents : [];

    // Check Firestore documents
    return serverDocs;
  },

  async saveDocument(document: Partial<ProcessedDocument>): Promise<ProcessedDocument> {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ document }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save document');

    // Persist to Firestore
    try {
      if (data.document?.userId) {
        await firestoreSaveUserDocument(data.document.userId, data.document);
      }
    } catch (err) {
      console.warn('Firestore save document warning:', err);
    }

    return data.document;
  },

  async deleteDocument(id: string): Promise<boolean> {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    try {
      const me = await this.getMe();
      if (me?.user?.id) {
        await firestoreDeleteUserDocument(me.user.id, id);
      }
    } catch {}

    return res.ok;
  },

  async updateEntityStatus(docId: string, entityId: string, status: string, newValue?: string) {
    const res = await fetch(`/api/documents/${docId}/entity`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ entityId, status, newValue }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update entity');

    // Sync to Firestore
    try {
      if (data.document?.userId) {
        await firestoreUpdateDocumentEntity(data.document.userId, docId, entityId, status, newValue);
      }
    } catch {}

    return data.document;
  },

  async confirmAllEntities(docId: string) {
    const res = await fetch(`/api/documents/${docId}/confirm-all`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to confirm entities');

    try {
      if (data.document?.userId) {
        await firestoreSaveUserDocument(data.document.userId, data.document);
      }
    } catch {}

    return data.document;
  },

  async processOcr(params: {
    filename: string;
    fileData: string;
    mimeType?: string;
    fileSize?: number;
    documentId?: string;
  }) {
    const res = await fetch('/api/ocr/process', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'OCR processing failed');
    return data;
  },

  async runRegressionSuite() {
    const res = await fetch('/api/test/regression-suite');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to run regression suite');
    return data;
  },

  // =====================
  // SUMMARY
  // =====================
  async getSummary(): Promise<UserHealthSummary> {
    const res = await fetch('/api/summary', {
      headers: this.getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load summary');
    return data;
  },

  // =====================
  // SHARING
  // =====================
  async getActiveSession() {
    const res = await fetch('/api/share/active-session', {
      headers: this.getAuthHeaders(),
    });
    return await res.json();
  },

  async generateDoctorCode(duration: string = '1h', scope = { summary: true, docs: true, labs: true }) {
    const res = await fetch('/api/share/generate-code', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ duration, scope }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate access code');

    // Persist session to Firestore
    try {
      if (data.session) {
        await firestoreSaveSharingSession(data.session);
      }
    } catch (err) {
      console.warn('Firestore sharing session save warning:', err);
    }

    return data;
  },

  async revokeAccess(code?: string) {
    const res = await fetch('/api/share/revoke', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ code }),
    });
    const data = await res.json();

    // Revoke in Firestore
    try {
      if (code) {
        const me = await this.getMe();
        await firestoreRevokeSharingSession(code, me?.user?.id || '');
      }
    } catch {}

    return data;
  },

  // =====================
  // DOCTOR ACCESS (GATEWAY)
  // =====================
  async verifyDoctorAccess(code: string) {
    // Check backend first
    const res = await fetch('/api/doctor/verify-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) {
      // Check Firestore as fallback
      try {
        const fsSession = await firestoreGetSharingSession(code.trim().toUpperCase());
        if (fsSession && fsSession.status === 'active' && fsSession.expiresAt > Date.now()) {
          return {
            success: true,
            authToken: fsSession.authToken || 'dtok_' + Math.random().toString(36).substring(2),
            patientName: 'Verified Patient',
            duration: fsSession.duration,
            scope: fsSession.scope,
          };
        }
      } catch {}
      throw new Error(data.error || 'Verification failed');
    }
    return data;
  },

  async getDoctorSummary(authToken: string) {
    const res = await fetch('/api/doctor/summary', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Unable to retrieve summary');
    return data;
  },

  async signDoctorNote(authToken: string, note: string, nmcReg?: string) {
    const res = await fetch('/api/doctor/sign-note', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ note, nmcReg }),
    });
    return await res.json();
  },
};
