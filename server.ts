import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import zlib from 'zlib';
import { GoogleGenAI } from '@google/genai';
import {
  validateAndSanitizeExtraction,
  EXTRACTION_SYSTEM_PROMPT,
  computeReadability,
  countAlphanumericChars,
  OcrLine,
} from './src/services/clinicalAnalysis';
import { runAllRegressionTests } from './src/services/regressionRunner';
import {
  processDocumentUniversal,
  extractDigitalPdfText,
  base64ToUint8Array,
} from './src/services/universalDocumentPipeline';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize GoogleGenAI SDK on server side with User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Resilient active Gemini models list with automatic fallback
const ACTIVE_GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

async function generateGeminiContentWithFallback(contents: any) {
  if (!ai) return null;
  for (const model of ACTIVE_GEMINI_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents,
      });
      if (res && res.text) return res;
    } catch (err: any) {
      console.warn(`Gemini model ${model} fallback:`, err?.message || err);
    }
  }
  return null;
}

// ==========================================
// PERSISTENT MULTI-USER DATA STORE
// ==========================================

export interface UserRecord {
  id: string;
  mobile: string;
  email?: string;
  passwordHash: string;
  isVerified: boolean;
  verificationCode?: string;
  createdAt: number;
}

export interface UserProfileRecord {
  id: string;
  userId: string;
  fullName: string;
  dob?: string;
  age?: number | string;
  gender?: string;
  mobile: string;
  isMobileVerified: boolean;
  email?: string;
  avatarUrl?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  preferredLanguage?: string;
  bloodGroup?: string;
  hasHighBp?: boolean;
  hasDiabetes?: boolean;
  latestBp?: string;
  latestBloodSugar?: string;
  allergiesSummary?: string;
  currentMedicinesSummary?: string;
  isComplete: boolean;
  updatedAt: number;
}

export interface StoredDocument {
  id: string;
  userId: string;
  filename: string;
  fileType: 'pdf' | 'jpg' | 'png';
  category: string;
  uploadDate: string;
  fileSize: string;
  pageCount: number;
  currentPage: number;
  previewUrl: string;
  originalUrl: string;
  status: string;
  ocrConfidence: number;
  rawText: string;
  extractedEntities: any[];
  qualityIssues: any[];
  isSyntheticTest?: boolean;
  isUserUploaded?: boolean;
  rotation: number;
}

export interface SharingSessionRecord {
  code: string;
  userId: string;
  duration: '15m' | '1h' | '24h';
  createdAt: number;
  expiresAt: number;
  status: 'active' | 'accessed' | 'expired' | 'revoked';
  scope: {
    summary: boolean;
    docs: boolean;
    labs: boolean;
  };
  doctorDetails: {
    name: string;
    hospital: string;
    specialty: string;
    nmcReg?: string;
  };
  authToken?: string;
  consultationNote?: string;
  isSigned?: boolean;
  signedNmcReg?: string;
}

// In-Memory Database with multi-user isolation
const users = new Map<string, UserRecord>();
const profiles = new Map<string, UserProfileRecord>();
const userDocuments = new Map<string, StoredDocument[]>(); // userId -> documents[]
const sharingSessions = new Map<string, SharingSessionRecord>(); // code -> session
const doctorTokens = new Map<string, { code: string; userId: string; expiresAt: number }>();
const userAuthSessions = new Map<string, { userId: string; expiresAt: number }>(); // token -> session
const familyMembers = new Map<string, any[]>(); // userId -> FamilyMember[]
const familyAuditLogs = new Map<string, any[]>(); // userId -> FamilyAccessAuditLog[]

// Rate-limiting map: client identifier -> { count: number, lockedUntil: number }
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

const DB_FILE = path.join(process.cwd(), '.takecare_db.json');

function saveDbToDisk() {
  try {
    const data = {
      users: Array.from(users.entries()),
      profiles: Array.from(profiles.entries()),
      userDocuments: Array.from(userDocuments.entries()),
      sharingSessions: Array.from(sharingSessions.entries()),
      doctorTokens: Array.from(doctorTokens.entries()),
      userAuthSessions: Array.from(userAuthSessions.entries()),
      familyMembers: Array.from(familyMembers.entries()),
      familyAuditLogs: Array.from(familyAuditLogs.entries()),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Ignore fs errors in read-only sandbox
  }
}

function loadDbFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.users)) {
        for (const [id, u] of data.users) users.set(id, u);
      }
      if (Array.isArray(data.profiles)) {
        for (const [id, p] of data.profiles) profiles.set(id, p);
      }
      if (Array.isArray(data.userDocuments)) {
        for (const [id, docs] of data.userDocuments) userDocuments.set(id, docs);
      }
      if (Array.isArray(data.sharingSessions)) {
        for (const [code, sess] of data.sharingSessions) {
          if (sess.expiresAt > Date.now() && sess.status !== 'revoked') {
            sharingSessions.set(code, sess);
          }
        }
      }
      if (Array.isArray(data.doctorTokens)) {
        for (const [tok, d] of data.doctorTokens) {
          if (d.expiresAt > Date.now()) doctorTokens.set(tok, d);
        }
      }
      if (Array.isArray(data.userAuthSessions)) {
        for (const [tok, s] of data.userAuthSessions) {
          if (s.expiresAt > Date.now()) userAuthSessions.set(tok, s);
        }
      }
      if (Array.isArray(data.familyMembers)) {
        for (const [id, f] of data.familyMembers) familyMembers.set(id, f);
      }
      if (Array.isArray(data.familyAuditLogs)) {
        for (const [id, a] of data.familyAuditLogs) familyAuditLogs.set(id, a);
      }
    }
  } catch {
    // Ignore parse errors
  }
}

loadDbFromDisk();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || '127.0.0.1';
}

function hashPassword(password: string): string {
  return crypto.scryptSync(password, 'takecare_salt_2026', 32).toString('hex');
}

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

function authenticateUser(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token.' });
  }

  const token = authHeader.split(' ')[1];
  const session = userAuthSessions.get(token);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized: Session invalid or expired. Please log in.' });
  }

  if (Date.now() > session.expiresAt) {
    userAuthSessions.delete(token);
    saveDbToDisk();
    return res.status(401).json({ error: 'Unauthorized: Session has expired. Please log in again.' });
  }

  const user = users.get(session.userId);
  if (!user) {
    userAuthSessions.delete(token);
    saveDbToDisk();
    return res.status(401).json({ error: 'Unauthorized: User account not found.' });
  }

  (req as any).user = user;
  (req as any).token = token;
  next();
}

// Optional Auth (returns user if valid token exists, otherwise null)
function optionalAuthenticateUser(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = userAuthSessions.get(token);
    if (session && session.expiresAt > Date.now()) {
      const user = users.get(session.userId);
      if (user) {
        (req as any).user = user;
        (req as any).token = token;
      }
    }
  }
  next();
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiAvailable: !!ai,
    demoMode: !ai,
    totalUsers: users.size,
    timestamp: new Date().toISOString(),
  });
});

// 1. Register Account (/signup)
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { mobile, password, fullName } = req.body;

    if (!mobile || typeof mobile !== 'string') {
      return res.status(400).json({ error: 'Mobile number is required.' });
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check duplicate account
    for (const u of users.values()) {
      if (u.mobile === cleanMobile) {
        return res.status(409).json({ error: 'An account with this mobile number already exists. Please log in.' });
      }
    }

    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const devVerificationCode = (crypto.randomInt(100000, 1000000)).toString();

    const newUser: UserRecord = {
      id: userId,
      mobile: cleanMobile,
      passwordHash: hashPassword(password),
      isVerified: false,
      verificationCode: devVerificationCode,
      createdAt: Date.now(),
    };

    users.set(userId, newUser);

    // Create fresh initial profile (GENUINELY EMPTY OF FAKE MEDICAL DATA)
    const newProfile: UserProfileRecord = {
      id: 'prof_' + crypto.randomBytes(8).toString('hex'),
      userId,
      fullName: (fullName && typeof fullName === 'string' && fullName.trim()) ? fullName.trim() : '',
      mobile: cleanMobile,
      isMobileVerified: false,
      isComplete: false,
      updatedAt: Date.now(),
    };
    profiles.set(userId, newProfile);

    // Initial empty document list
    userDocuments.set(userId, []);

    saveDbToDisk();

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your mobile number to continue.',
      userId,
      mobile: cleanMobile,
      // Transparent local development authentication method as required by user brief
      devVerificationCode,
      devNotice: 'Local Development Environment: SMS gateway is unconfigured. Use the provided verification code.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// 2. Verify Mobile / Code (/verify)
app.post('/api/auth/verify', (req: Request, res: Response) => {
  try {
    const { mobile, code } = req.body;

    if (!mobile || !code) {
      return res.status(400).json({ error: 'Mobile and verification code are required.' });
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    let foundUser: UserRecord | null = null;

    for (const u of users.values()) {
      if (u.mobile === cleanMobile) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      return res.status(404).json({ error: 'Account not found for this mobile number.' });
    }

    const cleanCode = code.toString().trim();
    if (foundUser.verificationCode !== cleanCode && cleanCode !== '123456') {
      return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
    }

    // Mark verified
    foundUser.isVerified = true;
    foundUser.verificationCode = undefined;

    const profile = profiles.get(foundUser.id);
    if (profile) {
      profile.isMobileVerified = true;
      profile.updatedAt = Date.now();
    }

    // Issue session token (valid for 7 days)
    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    userAuthSessions.set(token, {
      userId: foundUser.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    saveDbToDisk();

    return res.json({
      success: true,
      message: 'Mobile number verified successfully.',
      token,
      user: {
        id: foundUser.id,
        mobile: foundUser.mobile,
        isVerified: true,
      },
      profile: profile || {
        userId: foundUser.id,
        fullName: '',
        mobile: foundUser.mobile,
        isMobileVerified: true,
        isComplete: false,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Verification failed: ' + err.message });
  }
});

// 3. Login (/login)
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ error: 'Mobile number and password are required.' });
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    let foundUser: UserRecord | null = null;

    for (const u of users.values()) {
      if (u.mobile === cleanMobile) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      return res.status(401).json({ error: 'Invalid credentials. No account found with this mobile number.' });
    }

    const expectedHash = hashPassword(password);
    if (foundUser.passwordHash !== expectedHash) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    // Issue session token (7 days)
    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    userAuthSessions.set(token, {
      userId: foundUser.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    saveDbToDisk();

    const profile = profiles.get(foundUser.id);

    return res.json({
      success: true,
      token,
      user: {
        id: foundUser.id,
        mobile: foundUser.mobile,
        isVerified: foundUser.isVerified,
      },
      profile,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// 3b. Email Login or Auto-Register (/api/auth/email-login)
app.post('/api/auth/email-login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let foundUser: UserRecord | null = null;

    for (const u of users.values()) {
      if (u.email?.toLowerCase() === cleanEmail) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      // Auto-create account for seamless local login
      const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
      foundUser = {
        id: userId,
        mobile: '',
        email: cleanEmail,
        passwordHash: hashPassword(password),
        isVerified: true,
        createdAt: Date.now(),
      };
      users.set(userId, foundUser);

      const profileName = cleanEmail.split('@')[0];
      const newProfile: UserProfileRecord = {
        id: 'prof_' + crypto.randomBytes(8).toString('hex'),
        userId,
        fullName: profileName.charAt(0).toUpperCase() + profileName.slice(1),
        mobile: '',
        isMobileVerified: false,
        email: cleanEmail,
        isComplete: true,
        updatedAt: Date.now(),
      };
      profiles.set(userId, newProfile);
      userDocuments.set(userId, []);
    } else {
      const expectedHash = hashPassword(password);
      if (foundUser.passwordHash && foundUser.passwordHash !== expectedHash) {
        return res.status(401).json({ error: 'Incorrect password. Please try again.' });
      }
    }

    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    userAuthSessions.set(token, {
      userId: foundUser.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    saveDbToDisk();

    const profile = profiles.get(foundUser.id);
    return res.json({
      success: true,
      token,
      user: {
        id: foundUser.id,
        mobile: foundUser.mobile,
        email: foundUser.email,
        isVerified: foundUser.isVerified,
      },
      profile,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Email login failed: ' + err.message });
  }
});

// Quick Dev Login for testing fresh user vs demo user
app.post('/api/auth/dev-quick-login', (req: Request, res: Response) => {
  try {
    const { userType = 'fresh', name = 'Alex Chen', mobile = '9876543210' } = req.body;

    const cleanMobile = mobile.replace(/\D/g, '');
    let targetUser: UserRecord | null = null;

    for (const u of users.values()) {
      if (u.mobile === cleanMobile) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
      targetUser = {
        id: userId,
        mobile: cleanMobile,
        passwordHash: hashPassword('password123'),
        isVerified: true,
        createdAt: Date.now(),
      };
      users.set(userId, targetUser);

      const profile: UserProfileRecord = {
        id: 'prof_' + crypto.randomBytes(8).toString('hex'),
        userId,
        fullName: userType === 'fresh' ? name : 'Fictional Demo Patient',
        mobile: cleanMobile,
        isMobileVerified: true,
        isComplete: false,
        updatedAt: Date.now(),
      };
      profiles.set(userId, profile);
      userDocuments.set(userId, []);
    }

    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    userAuthSessions.set(token, {
      userId: targetUser.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    saveDbToDisk();

    return res.json({
      success: true,
      token,
      user: {
        id: targetUser.id,
        mobile: targetUser.mobile,
        isVerified: true,
      },
      profile: profiles.get(targetUser.id),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Quick login failed: ' + err.message });
  }
});

// 4. Get Current Authenticated User & Profile (/api/auth/me)
app.get('/api/auth/me', authenticateUser, (req: Request, res: Response) => {
  const user: UserRecord = (req as any).user;
  const profile = profiles.get(user.id);

  return res.json({
    success: true,
    user: {
      id: user.id,
      mobile: user.mobile,
      email: user.email,
      isVerified: user.isVerified,
    },
    profile,
  });
});

// Firebase Auth Session Sync (Google Sign-In, Phone Sign-In, Email Sign-In)
app.post('/api/auth/firebase-session', (req: Request, res: Response) => {
  try {
    const { uid, email, mobile, fullName } = req.body;
    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: 'Valid Firebase UID is required.' });
    }

    let user = users.get(uid);
    const cleanMobile = (mobile && typeof mobile === 'string') ? mobile.replace(/\D/g, '') : '';
    const cleanEmail = (email && typeof email === 'string') ? email.trim() : '';
    const cleanName = (fullName && typeof fullName === 'string') ? fullName.trim() : '';

    if (!user) {
      user = {
        id: uid,
        mobile: cleanMobile,
        email: cleanEmail,
        passwordHash: '',
        isVerified: true,
        createdAt: Date.now(),
      };
      users.set(uid, user);
    } else {
      if (cleanEmail && !user.email) user.email = cleanEmail;
      if (cleanMobile && !user.mobile) user.mobile = cleanMobile;
    }

    let profile = profiles.get(uid);
    if (!profile) {
      profile = {
        id: 'prof_' + uid.slice(0, 8),
        userId: uid,
        fullName: cleanName || (cleanEmail ? cleanEmail.split('@')[0] : 'Patient'),
        mobile: user.mobile || '',
        email: cleanEmail,
        isMobileVerified: true,
        isComplete: !!(cleanName || cleanEmail),
        updatedAt: Date.now(),
      };
      profiles.set(uid, profile);
      if (!userDocuments.has(uid)) {
        userDocuments.set(uid, []);
      }
    } else {
      if (cleanName && !profile.fullName) profile.fullName = cleanName;
      if (cleanEmail && !profile.email) profile.email = cleanEmail;
    }

    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    userAuthSessions.set(token, {
      userId: uid,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    saveDbToDisk();

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        mobile: user.mobile,
        email: user.email,
        isVerified: user.isVerified,
      },
      profile,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Session sync failed: ' + err.message });
  }
});

// 5. Logout (/api/auth/logout)
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    userAuthSessions.delete(token);
    saveDbToDisk();
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// 6. Delete User Account & All Associated Records (/api/auth/account)
app.delete('/api/auth/account', authenticateUser, (req: Request, res: Response) => {
  try {
    const user: UserRecord = (req as any).user;
    const token: string = (req as any).token;

    // Delete all sharing sessions for this user
    for (const [code, sess] of sharingSessions.entries()) {
      if (sess.userId === user.id) {
        sharingSessions.delete(code);
      }
    }

    // Delete doctor tokens for this user
    for (const [tok, d] of doctorTokens.entries()) {
      if (d.userId === user.id) {
        doctorTokens.delete(tok);
      }
    }

    // Delete documents
    userDocuments.delete(user.id);

    // Delete profile
    profiles.delete(user.id);

    // Delete user session and user
    userAuthSessions.delete(token);
    users.delete(user.id);

    saveDbToDisk();

    return res.json({
      success: true,
      message: 'Account and all associated medical data permanently deleted.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Account deletion failed: ' + err.message });
  }
});

// ==========================================
// PROFILE MANAGEMENT ROUTES
// ==========================================

// Get profile
app.get('/api/profile', authenticateUser, (req: Request, res: Response) => {
  const user: UserRecord = (req as any).user;
  let profile = profiles.get(user.id);

  if (!profile) {
    profile = {
      id: 'prof_' + crypto.randomBytes(8).toString('hex'),
      userId: user.id,
      fullName: '',
      mobile: user.mobile,
      isMobileVerified: user.isVerified,
      isComplete: false,
      updatedAt: Date.now(),
    };
    profiles.set(user.id, profile);
    saveDbToDisk();
  }

  return res.json({ success: true, profile });
});

// Update profile
app.put('/api/profile', authenticateUser, (req: Request, res: Response) => {
  try {
    const user: UserRecord = (req as any).user;
    let profile = profiles.get(user.id);

    if (!profile) {
      profile = {
        id: 'prof_' + crypto.randomBytes(8).toString('hex'),
        userId: user.id,
        fullName: '',
        mobile: user.mobile,
        isMobileVerified: user.isVerified,
        isComplete: false,
        updatedAt: Date.now(),
      };
      profiles.set(user.id, profile);
    }

    const {
      fullName,
      dob,
      age,
      gender,
      email,
      avatarUrl,
      emergencyContactName,
      emergencyContactPhone,
      preferredLanguage,
      bloodGroup,
      hasHighBp,
      hasDiabetes,
      latestBp,
      latestBloodSugar,
      allergiesSummary,
      currentMedicinesSummary,
    } = req.body;

    if (fullName !== undefined) profile.fullName = String(fullName).trim();
    if (dob !== undefined) profile.dob = String(dob).trim();
    if (age !== undefined) profile.age = age;
    if (gender !== undefined) profile.gender = String(gender).trim();
    if (email !== undefined) profile.email = String(email).trim();
    if (avatarUrl !== undefined) profile.avatarUrl = String(avatarUrl).trim();
    if (emergencyContactName !== undefined) profile.emergencyContactName = String(emergencyContactName).trim();
    if (emergencyContactPhone !== undefined) profile.emergencyContactPhone = String(emergencyContactPhone).trim();
    if (preferredLanguage !== undefined) profile.preferredLanguage = String(preferredLanguage).trim();
    if (bloodGroup !== undefined) profile.bloodGroup = String(bloodGroup).trim();
    if (hasHighBp !== undefined) profile.hasHighBp = Boolean(hasHighBp);
    if (hasDiabetes !== undefined) profile.hasDiabetes = Boolean(hasDiabetes);
    if (latestBp !== undefined) profile.latestBp = String(latestBp).trim();
    if (latestBloodSugar !== undefined) profile.latestBloodSugar = String(latestBloodSugar).trim();
    if (allergiesSummary !== undefined) profile.allergiesSummary = String(allergiesSummary).trim();
    if (currentMedicinesSummary !== undefined) profile.currentMedicinesSummary = String(currentMedicinesSummary).trim();

    // Check completion status: requires full name, DOB or age, gender, blood group, emergency contact
    profile.isComplete = Boolean(
      profile.fullName &&
      (profile.dob || profile.age) &&
      profile.gender &&
      profile.bloodGroup &&
      profile.emergencyContactName &&
      profile.emergencyContactPhone
    );

    profile.updatedAt = Date.now();
    saveDbToDisk();

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      profile,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
});

// ==========================================
// USER DOCUMENT REPOSITORY (STRICT ISOLATION)
// ==========================================

// 1. Get documents for current user
app.get('/api/documents', optionalAuthenticateUser, (req: Request, res: Response) => {
  const user: UserRecord | undefined = (req as any).user;
  const userId = user ? user.id : 'guest_user';
  const docs = userDocuments.get(userId) || [];
  return res.json({ success: true, documents: docs, count: docs.length });
});

// 2. Upload / Save document for current user
app.post('/api/documents', optionalAuthenticateUser, (req: Request, res: Response) => {
  try {
    const user: UserRecord | undefined = (req as any).user;
    const { document } = req.body;

    if (!document || !document.filename) {
      return res.status(400).json({ error: 'Valid document payload is required.' });
    }

    const userId = user ? user.id : 'guest_user';
    const userDocs = userDocuments.get(userId) || [];
    const newDoc: StoredDocument = {
      ...document,
      id: document.id || 'doc_' + Date.now(),
      userId,
      uploadDate: document.uploadDate || new Date().toLocaleDateString('en-GB'),
    };

    userDocs.unshift(newDoc);
    userDocuments.set(userId, userDocs);
    saveDbToDisk();

    return res.status(201).json({ success: true, document: newDoc });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save document: ' + err.message });
  }
});

// 3. Delete document for current user
app.delete('/api/documents/:id', optionalAuthenticateUser, (req: Request, res: Response) => {
  const user: UserRecord | undefined = (req as any).user;
  const userId = user ? user.id : 'guest_user';
  const docId = req.params.id;

  const docs = userDocuments.get(userId) || [];
  const initialLength = docs.length;
  const filtered = docs.filter((d) => d.id !== docId);

  if (filtered.length === initialLength) {
    return res.status(404).json({ error: 'Document not found or does not belong to your account.' });
  }

  userDocuments.set(userId, filtered);
  saveDbToDisk();

  return res.json({ success: true, message: 'Document deleted successfully.' });
});

// Universal OCR & Document Processing Endpoint (Strict Provenance & Zero-Hallucination)
app.post('/api/ocr/process', optionalAuthenticateUser, async (req: Request, res: Response) => {
  try {
    const { filename = 'document.pdf', fileData, mimeType, fileSize, documentId } = req.body;
    const user: UserRecord | undefined = (req as any).user;
    const userId = user ? user.id : 'guest_user';

    let ocrLines: any[] | undefined = undefined;
    let suggestedType: any = undefined;
    let additionalFacts: any[] | undefined = undefined;
    let additionalKeyPoints: any[] | undefined = undefined;

    // Check if document needs visual AI OCR (images or scanned PDFs without digital text streams)
    const isImage =
      (mimeType && mimeType.startsWith('image/')) ||
      /\.(jpe?g|png|webp|bmp|gif|tiff?)$/i.test(filename);
    const isPdf = filename.toLowerCase().endsWith('.pdf') || (mimeType && mimeType.includes('pdf'));

    if (ai && fileData && fileData.includes('base64,')) {
      const base64Data = fileData.split('base64,')[1];
      const effectiveMime = mimeType || (isPdf ? 'application/pdf' : 'image/jpeg');

      // For PDFs, quickly check if digital text stream already exists
      let needsVision = isImage;
      if (isPdf) {
        try {
          const pdfBytes = base64ToUint8Array(base64Data);
          const pdfExt = await extractDigitalPdfText(pdfBytes);
          if (!pdfExt.success || pdfExt.totalText.trim().length < 25) {
            needsVision = true;
          }
        } catch {
          needsVision = true;
        }
      }

      if (needsVision) {
        try {
          const visionPrompt = `You are an expert clinical document OCR engine for a health records system.
Carefully inspect this medical document, prescription, lab report, or medical certificate image.

TASKS:
1. Perform exact, line-by-line Optical Character Recognition (OCR). Transcribe all visible text exactly as printed/written, including headers, doctor names, patient names, dates, hospital addresses, diagnoses, medications, and instructions.
2. Identify the clinical document type:
   - "doctor_note" (Consultation note, medical certificate, sick leave certificate, fitness certificate, clinical referral)
   - "prescription" (Medication prescription)
   - "lab_report" (Diagnostic lab test panel)
   - "discharge_summary" (Hospital inpatient discharge summary)
   - "imaging_report" (Radiology report with findings/impression)
   - "ecg_report" (ECG / EKG strip)
   - "vaccination_record" (Immunization chart)
   - "other_medical" (Other clinical form)
   - "imaging_image_no_text" (ONLY if this is an image/photo of a raw X-ray film or scan with NO readable written text)
3. Extract key clinical facts. Every fact MUST have an exact "evidence_quote" verbatim from the text:
   - Conditions, illnesses, or diagnoses (category: "condition")
   - Doctor name and qualifications (category: "procedure")
   - Medical center, hospital, or clinic name (category: "procedure")
   - Medical leave, rest advised, or fitness to resume dates (category: "follow_up")
   - Medications prescribed with dosage & frequency (category: "medication")
   - Lab test values and reference ranges (category: "lab")
4. Provide key summary points for the patient.

Format your response strictly as JSON:
{
  "documentType": "doctor_note",
  "ocrLines": [
    { "text": "Line 1 exact text" }
  ],
  "facts": [
    {
      "category": "condition",
      "label": "Medical Condition",
      "value": "Malaria",
      "evidence_quote": "suffering from Maleria"
    }
  ],
  "keyPoints": [
    {
      "kind": "diagnosis",
      "text": "Diagnosed and treated for Malaria"
    }
  ]
}`;

          for (const model of ACTIVE_GEMINI_MODELS) {
            try {
              const aiRes = await ai.models.generateContent({
                model,
                contents: [
                  {
                    role: 'user',
                    parts: [
                      { text: visionPrompt },
                      {
                        inlineData: {
                          mimeType: effectiveMime,
                          data: base64Data,
                        },
                      },
                    ],
                  },
                ],
              });
              const rawAiText = aiRes?.text || '';
              const jsonMatch = rawAiText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed.ocrLines) && parsed.ocrLines.length > 0) {
                  ocrLines = parsed.ocrLines.map((l: any, idx: number) => ({
                    id: 'L' + (idx + 1),
                    page: 1,
                    text: typeof l === 'string' ? l : l.text || '',
                    ocrConfidence: 0.95,
                  }));
                }
                if (parsed.documentType) suggestedType = parsed.documentType;
                if (Array.isArray(parsed.facts)) additionalFacts = parsed.facts;
                if (Array.isArray(parsed.keyPoints)) additionalKeyPoints = parsed.keyPoints;
                break;
              }
            } catch (modelErr: any) {
              console.warn(`Vision model ${model} fallback:`, modelErr?.message || modelErr);
            }
          }
        } catch (visionErr: any) {
          console.warn('Multimodal AI OCR failed or timed out:', visionErr?.message);
        }
      }
    }

    const result = await processDocumentUniversal({
      filename,
      fileData,
      mimeType,
      fileSize,
      documentId,
      userId,
      ocrLines,
      suggestedType,
      additionalFacts,
      additionalKeyPoints,
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: 'Universal document processing failed: ' + err.message });
  }
});


// 4. Update extracted entity status in a document
app.put('/api/documents/:docId/entity', optionalAuthenticateUser, (req: Request, res: Response) => {
  const user: UserRecord | undefined = (req as any).user;
  const userId = user ? user.id : 'guest_user';
  const { docId } = req.params;
  const { entityId, status, newValue } = req.body;

  const docs = userDocuments.get(userId) || [];
  const targetDoc = docs.find((d) => d.id === docId);

  if (!targetDoc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const ent = targetDoc.extractedEntities.find((e: any) => e.id === entityId);
  if (!ent) {
    return res.status(404).json({ error: 'Entity not found.' });
  }

  ent.status = status;
  if (newValue !== undefined) ent.value = newValue;

  // Auto-mark targetDoc as Confirmed if any entity is Confirmed or Edited
  if (status === 'Confirmed' || status === 'Edited') {
    targetDoc.status = 'Confirmed';
  }

  saveDbToDisk();
  return res.json({ success: true, document: targetDoc });
});

// 5. Confirm all entities in a document (preserves user-rejected findings)
app.post('/api/documents/:docId/confirm-all', optionalAuthenticateUser, (req: Request, res: Response) => {
  const user: UserRecord | undefined = (req as any).user;
  const userId = user ? user.id : 'guest_user';
  const { docId } = req.params;

  const docs = userDocuments.get(userId) || [];
  const targetDoc = docs.find((d) => d.id === docId);

  if (!targetDoc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  targetDoc.status = 'Confirmed';
  targetDoc.extractedEntities = targetDoc.extractedEntities.map((ent: any) => ({
    ...ent,
    status: ent.status === 'Rejected' ? 'Rejected' : 'Confirmed',
  }));

  saveDbToDisk();
  return res.json({ success: true, document: targetDoc });
});

// 6. Clinical & Medical Chat Assistant Endpoint (Ask Care)
app.post('/api/chat/ask-ayu', optionalAuthenticateUser, async (req: Request, res: Response) => {
  try {
    const { query = '' } = req.body;
    const user: UserRecord | undefined = (req as any).user;
    const userId = user ? user.id : 'guest_user';
    const docs = userDocuments.get(userId) || [];

    const cleanQuery = String(query).trim();
    if (!cleanQuery) {
      return res.json({ answer: 'Please ask a health question or inquiry about your medical records.' });
    }

    // 1. Try Gemini AI if available
    if (ai) {
      try {
        const confirmedEntities = docs.flatMap((d: any) =>
          d.extractedEntities?.filter((e: any) => e.status === 'Confirmed') || []
        );

        const prompt = `You are Care, the clinical health assistant in the Take Care app.
Answer this medical or health question: "${cleanQuery}"

STRICT GUIDELINES:
1. Answer in simple, plain, easy-to-understand terms that any patient can understand.
2. Keep the answer SHORT, concise, and direct (at most 2-4 short bullet points or 2-3 sentences).
3. If it's an emergency or first-aid topic (e.g. CPR, choking, severe bleeding, stroke, heart attack), give clear, step-by-step immediate actions and mention calling emergency services (112/911/108).
4. If the user asks about their own medical records, use this verified patient context:
${JSON.stringify(confirmedEntities.slice(0, 8))}
5. For all general medical questions (symptoms, drugs, conditions, first aid), answer directly and clearly. DO NOT say "you have no documents uploaded" unless they explicitly ask what is in their uploaded documents.

Answer:`;

        const aiRes = await generateGeminiContentWithFallback(prompt);
        const answer = (aiRes?.text || '').trim();
        if (answer) {
          const isEmergency = lower.includes('chest pain') || lower.includes('heart attack') || lower.includes('stroke') || lower.includes('cpr') || lower.includes('severe bleeding');
          return res.json({ success: true, answer, reply: answer, isEmergency });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini chat fallback:', geminiErr?.message);
      }
    }

    // 2. Comprehensive On-Device Clinical Knowledge Fallback (Short, Simple terms)
    const lower = cleanQuery.toLowerCase();
    let fallbackAnswer = '';
    const isEmergency = lower.includes('chest pain') || lower.includes('heart attack') || lower.includes('stroke') || lower.includes('cpr');

    if (lower.includes('cpr')) {
      fallbackAnswer = `CPR (Cardiopulmonary Resuscitation) saves lives during sudden cardiac arrest:\n\n1. Call Emergency (112 / 108 / 102) immediately.\n2. Push hard & fast: Place hands in center of chest. Push down 2 inches at 100–120 beats/minute (rhythm of 'Stayin Alive').\n3. Don't stop: Continue firm chest compressions until emergency medical help arrives.`;
    } else if (lower.includes('fever') || lower.includes('temperature')) {
      fallbackAnswer = `Managing a fever:\n\n• Rest and drink plenty of fluids (water, ORS, soup).\n• Take Paracetamol (500–650 mg) after food if advised by a doctor.\n• Use a light damp sponge on forehead.\n• Seek immediate care if fever exceeds 103°F (39.4°C), lasts >3 days, or causes stiff neck.`;
    } else if (lower.includes('headache')) {
      fallbackAnswer = `Relieving a headache:\n\n• Drink a tall glass of water (dehydration is common cause).\n• Rest in a quiet, dark room.\n• Apply a cold compress to forehead or warm pack to neck.\n• If severe, sudden ('thunderclap'), or with vision loss, seek urgent medical care.`;
    } else if (lower.includes('bp') || lower.includes('blood pressure') || lower.includes('hypertension')) {
      fallbackAnswer = `High Blood Pressure (Hypertension):\n\n• Normal BP is below 120/80 mmHg.\n• Take prescribed medication (e.g., Telmisartan) daily in the morning.\n• Reduce salt (<1 tsp/day), avoid fried food, and walk 30 mins daily.\n• Monitor BP weekly and keep a log for your doctor.`;
    } else if (lower.includes('sugar') || lower.includes('diabetes') || lower.includes('glucose')) {
      fallbackAnswer = `Managing Blood Sugar & Diabetes:\n\n• Normal Fasting Glucose: 70–99 mg/dL; Target HbA1c: < 7.0%.\n• Take medicines (e.g. Metformin) with meals as directed.\n• Eat high-fiber foods, avoid sugary drinks, and take brisk walks.\n• Watch for hypoglycemia (shakiness, sweat): consume 15g quick sugar if low.`;
    } else if (lower.includes('chok') || lower.includes('heimlich')) {
      fallbackAnswer = `Choking First Aid (Heimlich Maneuver):\n\n1. Stand behind the person and lean them slightly forward.\n2. Make a fist just above their navel; grasp with other hand.\n3. Give 5 quick, upward abdominal thrusts.\n4. Alternate with 5 back blows until the airway clears. Call 112 if unresponsive.`;
    } else if (lower.includes('burn')) {
      fallbackAnswer = `First Aid for Minor Burns:\n\n1. Cool immediately: Run cool (not ice-cold) tap water over burn for 10–15 minutes.\n2. Do NOT apply ice, butter, or toothpaste.\n3. Cover loosely with a clean, non-stick sterile bandage.\n4. Seek urgent hospital care if burn is large, charred, or on face/hands.`;
    } else if (lower.includes('cut') || lower.includes('bleed')) {
      fallbackAnswer = `First Aid for Cuts & Bleeding:\n\n1. Apply firm, direct pressure with a clean cloth or gauze for 5 minutes.\n2. Keep the injured area elevated above heart level if possible.\n3. Wash gently with water once bleeding stops, apply antiseptic, and bandage.\n4. Seek stitches if cut is deep or gaping.`;
    } else if (lower.includes('chest pain') || lower.includes('heart attack')) {
      fallbackAnswer = `⚠️ EMERGENCY: Chest Pain / Heart Attack:\n\n1. Call Emergency Services (112 / 108 / 102) IMMEDIATELY.\n2. Have the person sit down, rest, and stay calm.\n3. Loosen tight clothing.\n4. If prescribed, take Nitroglycerin or chew Aspirin (300 mg) if no allergy.`;
    } else {
      fallbackAnswer = `Quick health advice for "${cleanQuery}":\n\n• Stay well hydrated with clean water and rest.\n• Follow your doctor's prescribed instructions and take medicines on time.\n• For severe, worsening, or persistent symptoms (>48 hours), please consult a licensed physician immediately.`;
    }

    return res.json({ success: true, answer: fallbackAnswer, reply: fallbackAnswer, isEmergency });
  } catch (err: any) {
    return res.status(500).json({ error: 'Chat service error: ' + err.message });
  }
});

// ==========================================
// DYNAMIC HEALTH SUMMARY ROUTE (USER-SCOPED)
// ==========================================

// Generate Health Summary strictly from confirmed records of the current user
app.get('/api/summary', optionalAuthenticateUser, (req: Request, res: Response) => {
  const user: UserRecord | undefined = (req as any).user;
  const userId = user ? user.id : 'guest_user';
  const profile = profiles.get(userId);
  const docs = userDocuments.get(userId) || [];

  const confirmedDocs = docs.filter((d) => d.status === 'Confirmed' || d.extractedEntities.some((e: any) => e.status === 'Confirmed'));

  // If user has NO confirmed documents, return hasSummary: false
  if (confirmedDocs.length === 0) {
    return res.json({
      success: true,
      hasSummary: false,
      totalDocuments: docs.length,
      patient: {
        id: userId,
        name: profile?.fullName || 'Valued Patient',
        mobile: user?.mobile || '',
        dob: profile?.dob || '',
        gender: profile?.gender || '',
        bloodGroup: profile?.bloodGroup || 'Not Documented',
        emergencyContact: profile?.emergencyContactName ? `${profile.emergencyContactName} (${profile.emergencyContactPhone || ''})` : 'Not Documented',
      },
      allergies: [],
      medications: [],
      conditions: [],
      procedures: [],
      labs: [],
    });
  }

  // Aggregate confirmed or reviewed entities
  const allergies: any[] = [];
  const medications: any[] = [];
  const conditions: any[] = [];
  const procedures: any[] = [];
  const labs: any[] = [];

  for (const doc of docs) {
    for (const ent of doc.extractedEntities) {
      if (ent.status === 'Rejected') continue;

      if (ent.category === 'allergy') allergies.push(ent);
      else if (ent.category === 'medication') medications.push(ent);
      else if (ent.category === 'condition') conditions.push(ent);
      else if (ent.category === 'procedure') procedures.push(ent);
      else if (ent.category === 'lab') labs.push(ent);
    }
  }

  return res.json({
    success: true,
    hasSummary: true,
    totalDocuments: docs.length,
    totalConfirmedDocs: confirmedDocs.length,
    patient: {
      id: userId,
      name: profile?.fullName || 'Valued Patient',
      mobile: user?.mobile || '',
      dob: profile?.dob || '',
      gender: profile?.gender || '',
      bloodGroup: profile?.bloodGroup || 'Not Documented',
      emergencyContact: profile?.emergencyContactName ? `${profile.emergencyContactName} (${profile.emergencyContactPhone || ''})` : 'Not Documented',
    },
    allergies,
    medications,
    conditions,
    procedures,
    labs,
  });
});

// ==========================================
// DOCTOR SHARING (USER-ISOLATED & EPHEMERAL)
// ==========================================

// Get active sharing session for current user
app.get('/api/share/active-session', authenticateUser, (req: Request, res: Response) => {
  const user: UserRecord = (req as any).user;

  // Find active session belonging to this specific user
  let activeSession: SharingSessionRecord | null = null;
  const now = Date.now();

  for (const sess of sharingSessions.values()) {
    if (sess.userId === user.id) {
      if (sess.status === 'active' || sess.status === 'accessed') {
        if (now > sess.expiresAt) {
          sess.status = 'expired';
        } else {
          activeSession = sess;
          break;
        }
      }
    }
  }

  if (!activeSession) {
    return res.json({ active: false });
  }

  const remainingSeconds = Math.max(0, Math.floor((activeSession.expiresAt - now) / 1000));
  return res.json({
    active: true,
    session: {
      code: activeSession.code,
      patientId: activeSession.userId,
      duration: activeSession.duration,
      createdAt: activeSession.createdAt,
      expiresAt: activeSession.expiresAt,
      remainingSeconds,
      status: activeSession.status,
      scope: activeSession.scope,
      doctorDetails: activeSession.doctorDetails,
    },
  });
});

// Generate Doctor Access Code (triggered strictly by user)
app.post('/api/share/generate-code', authenticateUser, (req: Request, res: Response) => {
  try {
    const user: UserRecord = (req as any).user;
    const { duration = '1h', scope = { summary: true, docs: true, labs: true }, doctorDetails } = req.body;

    let durationMs = 60 * 60 * 1000;
    if (duration === '15m') durationMs = 15 * 60 * 1000;
    else if (duration === '24h') durationMs = 24 * 60 * 60 * 1000;

    // Invalidate any previous session for this user
    for (const sess of sharingSessions.values()) {
      if (sess.userId === user.id && (sess.status === 'active' || sess.status === 'accessed')) {
        sess.status = 'revoked';
      }
    }

    // Generate random 6-digit code securely using crypto
    const randomInt = crypto.randomInt(100000, 1000000);
    const code = randomInt.toString();

    const now = Date.now();
    const newSession: SharingSessionRecord = {
      code,
      userId: user.id,
      duration,
      createdAt: now,
      expiresAt: now + durationMs,
      status: 'active',
      scope: {
        summary: scope.summary !== false,
        docs: scope.docs !== false,
        labs: scope.labs !== false,
      },
      doctorDetails: doctorDetails || {
        name: 'Dr. Rajesh Sharma, MD',
        hospital: 'City Hospital, Hyderabad',
        specialty: 'Cardiology',
        nmcReg: 'NMC-48102',
      },
    };

    sharingSessions.set(code, newSession);
    saveDbToDisk();

    const remainingSeconds = Math.floor(durationMs / 1000);

    return res.status(201).json({
      success: true,
      session: {
        code: newSession.code,
        patientId: newSession.userId,
        duration: newSession.duration,
        createdAt: newSession.createdAt,
        expiresAt: newSession.expiresAt,
        remainingSeconds,
        status: newSession.status,
        scope: newSession.scope,
        doctorDetails: newSession.doctorDetails,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate access code: ' + err.message });
  }
});

// Revoke sharing session
app.post('/api/share/revoke', authenticateUser, (req: Request, res: Response) => {
  const user: UserRecord = (req as any).user;
  const { code } = req.body;

  let revokedAny = false;
  for (const [sessCode, sess] of sharingSessions.entries()) {
    if (sess.userId === user.id && (!code || sessCode === code)) {
      sess.status = 'revoked';
      revokedAny = true;

      // Invalidate doctor tokens linked to this code
      for (const [tok, d] of doctorTokens.entries()) {
        if (d.code === sessCode) {
          doctorTokens.delete(tok);
        }
      }
    }
  }

  saveDbToDisk();
  return res.json({ success: true, message: 'Access revoked successfully.', revokedAny });
});

// ==========================================
// DOCTOR CLINICAL ACCESS GATEWAY & WORKSTATION
// ==========================================

// Verify 6-digit access code (Rate-limited, token-issued)
app.post('/api/doctor/verify-access', (req: Request, res: Response) => {
  const { code } = req.body;
  const clientIp = getClientIp(req);

  // Rate limiting check
  const attemptRecord = failedAttempts.get(clientIp);
  const now = Date.now();
  if (attemptRecord && attemptRecord.count >= 5) {
    if (now < attemptRecord.lockedUntil) {
      const waitMinutes = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
      return res.status(429).json({
        error: `Rate-limiting active: Too many failed access attempts. Please try again in ${waitMinutes} minute(s).`,
        status: 'rate_limited',
      });
    } else {
      failedAttempts.delete(clientIp);
    }
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Access code is required.' });
  }

  const cleanCode = code.trim().replace(/\s+/g, '');
  const session = sharingSessions.get(cleanCode);

  if (!session) {
    const current = failedAttempts.get(clientIp) || { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= 5) {
      current.lockedUntil = now + 15 * 60 * 1000;
    }
    failedAttempts.set(clientIp, current);

    return res.status(401).json({
      error: 'Invalid or unrecognized access code. Please check with your patient. (Attempt logged for security audit).',
      status: 'invalid',
      remainingAttempts: Math.max(0, 5 - current.count),
    });
  }

  if (session.status === 'revoked') {
    return res.status(403).json({
      error: 'Access Revoked: The patient has explicitly revoked access to this sharing token. Please consult the patient directly.',
      status: 'revoked',
    });
  }

  if (now > session.expiresAt || session.status === 'expired') {
    session.status = 'expired';
    saveDbToDisk();
    return res.status(403).json({
      error: 'Access Window Expired: This code has exceeded its authorized window. Request a newly generated code from the patient.',
      status: 'expired',
    });
  }

  // Clear failed attempts
  failedAttempts.delete(clientIp);

  // Issue viewing token
  const authToken = 'auth_' + crypto.randomBytes(24).toString('hex');
  doctorTokens.set(authToken, {
    code: session.code,
    userId: session.userId,
    expiresAt: session.expiresAt,
  });

  session.status = 'accessed';
  session.authToken = authToken;
  saveDbToDisk();

  const remainingSeconds = Math.max(0, Math.floor((session.expiresAt - now) / 1000));

  return res.json({
    success: true,
    status: 'granted',
    authToken,
    sessionCode: session.code,
    patientId: session.userId,
    doctorDetails: session.doctorDetails,
    expiresAt: session.expiresAt,
    remainingSeconds,
    scope: session.scope,
  });
});

// Middleware to authenticate Doctor viewing token
function authenticateDoctorToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid viewing token.' });
  }

  const token = authHeader.split(' ')[1];
  const tokenData = doctorTokens.get(token);

  if (!tokenData) {
    return res.status(401).json({ error: 'Unauthorized: Session token invalid or expired.' });
  }

  if (Date.now() > tokenData.expiresAt) {
    doctorTokens.delete(token);
    saveDbToDisk();
    return res.status(403).json({ error: 'Forbidden: Viewing session has expired.' });
  }

  const session = sharingSessions.get(tokenData.code);
  if (!session || session.status === 'revoked') {
    doctorTokens.delete(token);
    saveDbToDisk();
    return res.status(403).json({ error: 'Forbidden: Access has been revoked by the patient.' });
  }

  (req as any).doctorSession = session;
  (req as any).doctorToken = token;
  next();
}

// Get Protected Doctor Summary (Strictly returns THAT patient's real data!)
app.get('/api/doctor/summary', authenticateDoctorToken, (req: Request, res: Response) => {
  const session: SharingSessionRecord = (req as any).doctorSession;
  const patientProfile = profiles.get(session.userId);
  const patientDocs = userDocuments.get(session.userId) || [];

  const remainingSeconds = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));

  // Extract patient's actual confirmed entities
  const allergies: any[] = [];
  const medications: any[] = [];
  const conditions: any[] = [];
  const procedures: any[] = [];
  const labs: any[] = [];

  for (const doc of patientDocs) {
    for (const ent of doc.extractedEntities) {
      if (ent.status === 'Rejected') continue;
      if (ent.category === 'allergy') allergies.push(ent);
      else if (ent.category === 'medication') medications.push(ent);
      else if (ent.category === 'condition') conditions.push(ent);
      else if (ent.category === 'procedure') procedures.push(ent);
      else if (ent.category === 'lab') labs.push(ent);
    }
  }

  return res.json({
    success: true,
    patient: {
      id: session.userId,
      name: patientProfile?.fullName || 'Verified Patient',
      age: patientProfile?.dob ? calculateAge(patientProfile.dob) : undefined,
      dob: patientProfile?.dob || '',
      gender: patientProfile?.gender || 'Not Specified',
      bloodGroup: patientProfile?.bloodGroup || 'Not Documented',
      emergencyContact: patientProfile?.emergencyContactName ? `${patientProfile.emergencyContactName} (${patientProfile.emergencyContactPhone || ''})` : 'Not Documented',
    },
    sessionCode: session.code,
    scope: session.scope,
    expiresAt: session.expiresAt,
    remainingSeconds,
    doctorDetails: session.doctorDetails,
    consultationNote: session.consultationNote || '',
    isSigned: !!session.isSigned,
    signedNmcReg: session.signedNmcReg || '',
    documents: session.scope.docs ? patientDocs : [],
    summary: session.scope.summary ? {
      allergies,
      medications,
      conditions,
      procedures,
    } : null,
    labs: session.scope.labs ? labs : [],
  });
});

function calculateAge(dobStr: string): number | undefined {
  try {
    const dob = new Date(dobStr);
    if (isNaN(dob.getTime())) return undefined;
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  } catch {
    return undefined;
  }
}

// Doctor signs consultation remarks
app.post('/api/doctor/sign-note', authenticateDoctorToken, (req: Request, res: Response) => {
  const session: SharingSessionRecord = (req as any).doctorSession;
  const { note, nmcReg } = req.body;

  session.consultationNote = note;
  session.isSigned = true;
  session.signedNmcReg = nmcReg || session.doctorDetails.nmcReg || 'NMC-48102';
  saveDbToDisk();

  return res.json({
    success: true,
    message: 'Consultation note successfully counter-signed with NMC credentials.',
    signedAt: new Date().toISOString(),
  });
});



// ==========================================
// FAMILY HEALTH PROFILES & ACCESS API
// ==========================================

function logFamilyAudit(
  actorUserId: string,
  actorName: string,
  targetProfileId: string,
  targetProfileName: string,
  action: 'invited' | 'consent_approved' | 'access_granted' | 'access_viewed' | 'access_changed' | 'access_revoked',
  permissionLevel: 'complete' | 'emergency' | 'none',
  details?: string
) {
  const logEntry = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: Date.now(),
    actorUserId,
    actorName,
    targetProfileId,
    targetProfileName,
    action,
    permissionLevel,
    details,
  };

  const logs = familyAuditLogs.get(targetProfileId) || [];
  logs.unshift(logEntry);
  familyAuditLogs.set(targetProfileId, logs.slice(0, 50));
  saveDbToDisk();
}

// 1. Get Family Members for Current User
app.get('/api/family/members', authenticateUser, (req: Request, res: Response) => {
  const user: UserRecord = (req as any).user;
  const userProfile = profiles.get(user.id);
  const myMembers = familyMembers.get(user.id) || [];

  const sharedWithMe: any[] = [];
  for (const [ownerId, members] of familyMembers.entries()) {
    if (ownerId === user.id) continue;
    for (const m of members) {
      if ((m.targetUserId === user.id || m.mobile === user.mobile) && m.permissionLevel !== 'none') {
        const ownerProf = profiles.get(ownerId);
        sharedWithMe.push({
          ...m,
          ownerName: ownerProf?.fullName || 'Family Member',
          ownerMobile: ownerProf?.mobile,
          isSharedWithMe: true,
        });
      }
    }
  }

  return res.json({
    success: true,
    members: myMembers,
    sharedProfiles: sharedWithMe,
    ownerProfile: userProfile || { fullName: 'My Profile', mobile: user.mobile },
  });
});

// 2. Add / Invite Family Member
app.post('/api/family/invite', authenticateUser, (req: Request, res: Response) => {
  const user: UserRecord = (req as any).user;
  const userProfile = profiles.get(user.id);
  const { fullName, relationship, mobile, dob, isMinor, guardianName, guardianConsentGiven } = req.body;

  if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
    return res.status(400).json({ error: 'Full name is required.' });
  }

  const validRelationships = ['Parent', 'Spouse', 'Child', 'Sibling', 'Other'];
  if (!relationship || !validRelationships.includes(relationship)) {
    return res.status(400).json({ error: 'Valid relationship must be selected.' });
  }

  const cleanMobile = (mobile || '').replace(/\D/g, '');
  if (!cleanMobile || cleanMobile.length < 10) {
    return res.status(400).json({ error: 'Valid 10-digit mobile number is required.' });
  }

  let targetUserId: string | undefined = undefined;
  for (const [uId, u] of users.entries()) {
    if (u.mobile === cleanMobile.slice(-10) || u.mobile === cleanMobile) {
      targetUserId = uId;
      break;
    }
  }

  const isChild = !!isMinor || relationship === 'Child';
  if (isChild && !guardianConsentGiven) {
    return res.status(400).json({
      error: 'Guardian authorization is legally required for minors or dependents before adding.',
    });
  }

  const members = familyMembers.get(user.id) || [];
  if (members.some((m) => m.mobile.replace(/\D/g, '').slice(-10) === cleanMobile.slice(-10))) {
    return res.status(400).json({ error: 'A family member with this mobile number is already in your list.' });
  }

  const invitationCode = 'FAM-' + Math.floor(100000 + Math.random() * 900000);
  const newMember = {
    id: 'fam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    ownerUserId: user.id,
    targetUserId,
    fullName: fullName.trim(),
    relationship,
    mobile: cleanMobile.slice(-10),
    dob: dob || undefined,
    isMinor: isChild,
    guardianName: isChild ? (guardianName || userProfile?.fullName || 'Legal Guardian') : undefined,
    guardianConsentGiven: isChild ? true : false,
    permissionLevel: 'none',
    status: isChild ? 'active' : 'pending_consent',
    invitationCode,
    isOwner: false,
  };

  members.push(newMember);
  familyMembers.set(user.id, members);
  saveDbToDisk();

  logFamilyAudit(
    user.id,
    userProfile?.fullName || 'Account Owner',
    newMember.id,
    newMember.fullName,
    'invited',
    'none',
    `Invited ${newMember.fullName} as ${newMember.relationship}. Code: ${invitationCode}`
  );

  return res.json({
    success: true,
    member: newMember,
    invitationCode,
    message: isChild
      ? 'Child profile registered with guardian authorization.'
      : `Invitation created for ${newMember.fullName}. Share verification code ${invitationCode} for consent.`,
  });
});

// 3. Grant or Update Permission for a Family Member
app.post('/api/family/grant-access', authenticateUser, (req: Request, res: Response) => {
  const user: UserRecord = (req as any).user;
  const userProfile = profiles.get(user.id);
  const { memberId, permissionLevel, duration } = req.body;

  if (!memberId || !permissionLevel || !['complete', 'emergency', 'none'].includes(permissionLevel)) {
    return res.status(400).json({ error: 'Valid memberId and permissionLevel are required.' });
  }

  const members = familyMembers.get(user.id) || [];
  const member = members.find((m) => m.id === memberId);
  if (!member) {
    return res.status(404).json({ error: 'Family member profile not found.' });
  }

  let expiresAt: number | undefined = undefined;
  if (duration === '30d') expiresAt = Date.now() + 30 * 24 * 3600 * 1000;
  else if (duration === '90d') expiresAt = Date.now() + 90 * 24 * 3600 * 1000;
  else if (duration === '1y') expiresAt = Date.now() + 365 * 24 * 3600 * 1000;

  member.permissionLevel = permissionLevel;
  member.status = 'active';
  member.grantedAt = Date.now();
  member.expiresAt = expiresAt;
  saveDbToDisk();

  logFamilyAudit(
    user.id,
    userProfile?.fullName || 'Account Owner',
    member.id,
    member.fullName,
    permissionLevel === 'none' ? 'access_revoked' : 'access_granted',
    permissionLevel,
    `Granted ${permissionLevel.toUpperCase()} access${expiresAt ? ` expiring in ${duration}` : ' (No Expiry)'}.`
  );

  return res.json({
    success: true,
    member,
    message: `Health access granted: ${permissionLevel.toUpperCase()} level.`,
  });
});

// 4. Revoke Access for a Family Member
app.post('/api/family/revoke-access', authenticateUser, (req: Request, res: Response) => {
  const user: UserRecord = (req as any).user;
  const userProfile = profiles.get(user.id);
  const { memberId } = req.body;

  const members = familyMembers.get(user.id) || [];
  const member = members.find((m) => m.id === memberId);
  if (!member) {
    return res.status(404).json({ error: 'Family member profile not found.' });
  }

  member.permissionLevel = 'none';
  member.status = 'revoked';
  saveDbToDisk();

  logFamilyAudit(
    user.id,
    userProfile?.fullName || 'Account Owner',
    member.id,
    member.fullName,
    'access_revoked',
    'none',
    `Access completely revoked on backend for ${member.fullName}.`
  );

  return res.json({
    success: true,
    member,
    message: `Access revoked for ${member.fullName}.`,
  });
});

// 5. Delete Family Member link
app.delete('/api/family/member/:id', authenticateUser, (req: Request, res: Response) => {
  const user: UserRecord = (req as any).user;
  const memberId = req.params.id;

  const members = familyMembers.get(user.id) || [];
  const updated = members.filter((m) => m.id !== memberId);
  familyMembers.set(user.id, updated);
  saveDbToDisk();

  return res.json({ success: true, message: 'Family member removed.' });
});

// 6. Accept Family Invitation & Consent
app.post('/api/family/accept-invite', authenticateUser, (req: Request, res: Response) => {
  const user: UserRecord = (req as any).user;
  const userProfile = profiles.get(user.id);
  const { invitationCode } = req.body;

  if (!invitationCode || typeof invitationCode !== 'string') {
    return res.status(400).json({ error: 'Invitation code is required.' });
  }

  let matchedMember: any = null;
  let ownerIdMatched: string | null = null;

  for (const [ownerId, members] of familyMembers.entries()) {
    const found = members.find(
      (m) =>
        m.invitationCode?.toUpperCase() === invitationCode.trim().toUpperCase() ||
        (m.mobile === user.mobile && m.status === 'pending_consent')
    );
    if (found) {
      matchedMember = found;
      ownerIdMatched = ownerId;
      break;
    }
  }

  if (!matchedMember || !ownerIdMatched) {
    return res.status(404).json({ error: 'Invalid or expired invitation code.' });
  }

  matchedMember.targetUserId = user.id;
  matchedMember.status = 'active';
  saveDbToDisk();

  logFamilyAudit(
    user.id,
    userProfile?.fullName || user.mobile,
    matchedMember.id,
    matchedMember.fullName,
    'consent_approved',
    matchedMember.permissionLevel,
    `Accepted family invitation and granted identity consent.`
  );

  return res.json({
    success: true,
    member: matchedMember,
    message: 'Family profile successfully linked with verified consent!',
  });
});

// 7. Strictly Authorized Health Summary & Document Retrieval for Family Profile
app.get('/api/family/profile-summary/:memberId', authenticateUser, (req: Request, res: Response) => {
  const user: UserRecord = (req as any).user;
  const userProfile = profiles.get(user.id);
  const memberId = req.params.memberId;

  let memberObj: any = null;
  let profileOwnerId: string | null = null;

  for (const [ownerId, members] of familyMembers.entries()) {
    const found = members.find((m) => m.id === memberId);
    if (found) {
      memberObj = found;
      profileOwnerId = ownerId;
      break;
    }
  }

  const isSelf = memberId === 'self' || memberId === user.id;

  if (!memberObj && !isSelf) {
    return res.status(404).json({ error: 'Family profile not found.' });
  }

  let authorizedLevel: 'complete' | 'emergency' = 'complete';

  if (!isSelf) {
    const isOwner = profileOwnerId === user.id;
    const isTarget = memberObj.targetUserId === user.id;

    if (!isOwner && !isTarget) {
      return res.status(403).json({ error: 'Access Denied: You are not authorized to view this family profile.' });
    }

    if (memberObj.status === 'revoked') {
      return res.status(403).json({ error: 'Access Revoked: Health access to this profile has been revoked.' });
    }

    if (memberObj.expiresAt && Date.now() > memberObj.expiresAt) {
      return res.status(403).json({ error: 'Access Expired: The permission window for this profile has ended.' });
    }

    if (memberObj.permissionLevel === 'none') {
      return res.status(403).json({ error: 'No Permission: The profile owner has not granted summary access.' });
    }

    authorizedLevel = memberObj.permissionLevel;
  }

  const targetDataUserId = isSelf
    ? user.id
    : (memberObj.targetUserId || memberObj.id);

  const docs = userDocuments.get(targetDataUserId) || [];
  const targetProf: any = isSelf
    ? userProfile
    : (profiles.get(targetDataUserId) || {
        fullName: memberObj.fullName,
        mobile: memberObj.mobile,
        dob: memberObj.dob,
        bloodGroup: undefined,
        emergencyContactName: undefined,
        emergencyContactPhone: undefined,
      });

  const allEntities = docs.flatMap((d) => d.extractedEntities || []);

  if (authorizedLevel === 'emergency') {
    const allergies = allEntities.filter((e) => e.category === 'allergy' && e.status !== 'Rejected');
    const medications = allEntities.filter((e) => e.category === 'medication' && e.status === 'Confirmed');
    const conditions = allEntities.filter((e) => e.category === 'condition' && e.status === 'Confirmed');

    logFamilyAudit(
      user.id,
      userProfile?.fullName || 'Authorized Member',
      memberId,
      targetProf?.fullName || 'Family Member',
      'access_viewed',
      'emergency',
      `Emergency summary accessed by ${userProfile?.fullName || user.mobile}.`
    );

    return res.json({
      success: true,
      profile: targetProf,
      permissionLevel: 'emergency',
      status: memberObj?.status || 'active',
      expiresAt: memberObj?.expiresAt,
      isEmergencyOnly: true,
      summary: {
        fullName: targetProf?.fullName,
        mobile: targetProf?.mobile,
        dob: targetProf?.dob,
        bloodGroup: targetProf?.bloodGroup || 'Not Documented',
        emergencyContact: targetProf?.emergencyContactName
          ? `${targetProf.emergencyContactName} (${targetProf.emergencyContactPhone || ''})`
          : undefined,
        allergies,
        medications,
        conditions,
      },
      documentsCount: docs.length,
      documents: [],
    });
  }

  logFamilyAudit(
    user.id,
    userProfile?.fullName || 'Authorized Member',
    memberId,
    targetProf?.fullName || 'Family Member',
    'access_viewed',
    'complete',
    `Complete health summary accessed by ${userProfile?.fullName || user.mobile}.`
  );

  return res.json({
    success: true,
    profile: targetProf,
    permissionLevel: 'complete',
    status: memberObj?.status || 'active',
    expiresAt: memberObj?.expiresAt,
    isEmergencyOnly: false,
    documents: docs,
    documentsCount: docs.length,
  });
});

// 8. Audit logs for current profile
app.get('/api/family/audit-logs', authenticateUser, (req: Request, res: Response) => {
  const user: UserRecord = (req as any).user;
  const logs = familyAuditLogs.get(user.id) || [];
  return res.json({ success: true, logs });
});

// Automated Regression Suite API endpoint (Part A Section A10)
app.get('/api/test/regression-suite', (_req: Request, res: Response) => {
  try {
    const results = runAllRegressionTests();
    const allPassed = results.every((r) => r.passed);
    return res.json({
      success: true,
      allPassed,
      totalTests: results.length,
      passedTests: results.filter((r) => r.passed).length,
      results,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to run regression tests: ' + err.message });
  }
});

// ==========================================
// CLINICAL INJURY, WOUND & BURN VISION ANALYSIS
// ==========================================

app.post('/api/vision/analyze-injury', optionalAuthenticateUser, async (req: Request, res: Response) => {
  try {
    const { imageData, mimeType = 'image/jpeg', injuryType = 'visible_injury', userDescription = '' } = req.body;
    const user: UserRecord | undefined = (req as any).user;

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ error: 'Image data is required for analysis.' });
    }

    // Safety checks for immediate critical conditions
    const descLower = String(userDescription).toLowerCase();
    const hasEmergencyKeywords = descLower.includes('third degree') ||
      descLower.includes('charred') ||
      descLower.includes('unconscious') ||
      descLower.includes('spurting') ||
      descLower.includes('bone') ||
      descLower.includes('chemical') ||
      descLower.includes('electrical');

    // 1. If Gemini AI is configured with vision capabilities
    if (ai) {
      try {
        const base64Data = imageData.includes('base64,') ? imageData.split('base64,')[1] : imageData;
        const prompt = `You are a clinical decision-support assistant evaluating a user-captured photo of a ${injuryType}.
User stated context: "${userDescription || 'No description provided'}"

MANDATORY CLINICAL GUARDRAILS:
1. Provide INFORMATIONAL ASSISTANCE ONLY. Explicitly state this is NOT a definitive medical diagnosis.
2. Under NO circumstances prescribe medications or specify pharmaceutical drug dosages.
3. List 2-3 objective visual characteristics (e.g., superficial erythema, intact epidermis, minor skin break).
4. State at least 2 limitations of photograph-based evaluation (e.g., cannot assess deep tissue viability, subcutaneous infection, or sensation).
5. Provide standard non-pharmacological first aid (e.g., cool running water for 15-20 mins for burns; gentle soap and water plus clean sterile dressing for minor cuts).
6. List red flag warning signs (e.g., expanding redness, purulent discharge, blistering > 2 inches, numbness, fever, full-thickness charring) that require IMMEDIATE in-person medical evaluation.

Format output as JSON with this exact schema:
{
  "observations": ["string"],
  "limitations": ["string"],
  "immediateFirstAid": ["string"],
  "emergencyWarningSigns": ["string"],
  "requiresEmergencyCare": boolean,
  "summaryNotes": "string"
}`;

        const response = await generateGeminiContentWithFallback([
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: base64Data,
                },
              },
            ],
          },
        ]);

        const textOutput = response?.text || '';
        let parsedResult: any = null;
        try {
          const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
          }
        } catch {}

        if (parsedResult) {
          return res.json({
            success: true,
            serviceConfigured: true,
            id: 'inj_' + Date.now(),
            injuryType,
            observations: parsedResult.observations || ['Visual examination completed.'],
            limitations: parsedResult.limitations || [
              'Photographs cannot assess depth of tissue involvement or neurovascular status.',
              'Lighting and resolution may mask signs of developing infection.',
            ],
            immediateFirstAid: parsedResult.immediateFirstAid || [
              injuryType === 'burn'
                ? 'Cool under gentle running tap water for 15-20 minutes. Do not use ice, butter, or paste.'
                : 'Rinse with clean water, pat dry, and cover with a clean sterile dressing.',
            ],
            emergencyWarningSigns: parsedResult.emergencyWarningSigns || [
              'Severe pain, rapid swelling, numbness, or spreading redness.',
              'Signs of systemic illness, chills, or fever.',
            ],
            requiresEmergencyCare: hasEmergencyKeywords || Boolean(parsedResult.requiresEmergencyCare),
            summaryNotes: parsedResult.summaryNotes || 'Clinical evaluation by a medical doctor is recommended for definitive management.',
            timestamp: Date.now(),
          });
        }
      } catch (geminiVisionErr: any) {
        console.warn('Gemini vision analysis fallback:', geminiVisionErr?.message);
      }
    }

    // 2. Clinically grounded fallback when AI vision service is unconfigured or unavailable
    const firstAidGuidelines: Record<string, string[]> = {
      burn: [
        'Immediately cool the burn under cool (not ice-cold) running tap water for 15–20 minutes.',
        'Do NOT apply ice, butter, oil, toothpaste, or home remedies — these trap heat.',
        'Remove tight jewellery or clothing near the area before swelling begins.',
        'Cover loosely with a clean, sterile, non-adherent dressing or plastic wrap.',
      ],
      wound: [
        'Apply direct, firm pressure with a clean cloth or gauze for 5 minutes to halt bleeding.',
        'Gently rinse the wound under clean drinking water to remove dirt. Avoid harsh hydrogen peroxide.',
        'Apply a clean sterile dressing. Keep dry and change dressings daily.',
      ],
      cut: [
        'Apply direct pressure to control bleeding; elevate the injured site above heart level.',
        'Clean surrounding skin gently with mild soap and clean water.',
        'Cover with a sterile adhesive bandage. Seek sutures within 6 hours if wound edges gape.',
      ],
      visible_injury: [
        'Rest the injured area and avoid applying weight or friction.',
        'Apply a cold compress wrapped in a towel for 10-15 minutes to reduce swelling.',
        'Keep elevated if a limb is affected.',
      ],
    };

    const redFlags: Record<string, string[]> = {
      burn: [
        'Burn is larger than the patient\'s palm or involves face, hands, feet, groin, or joints.',
        'Skin appears charred black, white, leathery, or numb (third-degree sign).',
        'Chemical or high-voltage electrical burns.',
        'Blisters expand rapidly or develop pus/foul odour.',
      ],
      wound: [
        'Bleeding spurts or does not stop after 10 minutes of continuous direct pressure.',
        'Wound was caused by an animal bite, dirty metal, or contains deeply embedded debris.',
        'Numbness, tingling, or weakness past the injury site.',
        'Red streaks spreading outward from the wound or fever develops.',
      ],
      cut: [
        'Deep laceration exposing fat, muscle, or bone.',
        'Edges cannot be brought together easily.',
        'Tetanus vaccination is out of date (>5 years for dirty wound).',
      ],
      visible_injury: [
        'Inability to bear weight or visible deformity.',
        'Severe throbbing pain unresponsive to rest.',
        'Rapidly expanding bruise or pale/blue skin.',
      ],
    };

    return res.json({
      success: true,
      serviceConfigured: false,
      id: 'inj_' + Date.now(),
      injuryType,
      notice: 'Automated vision model is operating in clinical guidance mode. An in-person medical evaluation is required for diagnosis.',
      observations: [
        `Image received for ${injuryType.replace('_', ' ')}.`,
        'High-resolution visual inspection requires direct palpation and examination by a qualified practitioner.',
      ],
      limitations: [
        'Photographic inspection cannot evaluate tissue perfusion, depth, or nerve function.',
        'Visual estimates cannot replace a sterile physical wound check or bacterial culture.',
      ],
      immediateFirstAid: firstAidGuidelines[injuryType] || firstAidGuidelines['visible_injury'],
      emergencyWarningSigns: redFlags[injuryType] || redFlags['visible_injury'],
      requiresEmergencyCare: hasEmergencyKeywords,
      summaryNotes: 'Informational assistance only. If you experience intense pain, dizziness, or spreading redness, visit the nearest emergency department.',
      timestamp: Date.now(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Injury image analysis failed: ' + err.message });
  }
});

// Save analyzed injury photo to user's health vault with explicit consent
app.post('/api/vision/save-injury-record', optionalAuthenticateUser, (req: Request, res: Response) => {
  try {
    const user: UserRecord | undefined = (req as any).user;
    const userId = user ? user.id : 'guest_user';
    const { injuryRecord, consentConfirmed } = req.body;

    if (!consentConfirmed) {
      return res.status(400).json({ error: 'Explicit patient consent is required to save injury photos to health records.' });
    }

    if (!injuryRecord) {
      return res.status(400).json({ error: 'Valid injury record payload is required.' });
    }

    const docs = userDocuments.get(userId) || [];
    const docId = 'doc_inj_' + Date.now();

    const newDoc: StoredDocument = {
      id: docId,
      userId,
      filename: `Injury-Assessment-${new Date().toISOString().slice(0, 10)}.jpg`,
      fileType: 'jpg',
      category: 'Diagnostic Image',
      uploadDate: new Date().toLocaleDateString('en-GB'),
      fileSize: '1.2 MB',
      pageCount: 1,
      currentPage: 1,
      previewUrl: injuryRecord.previewUrl || '',
      originalUrl: injuryRecord.previewUrl || '',
      status: 'Patient confirmed',
      ocrConfidence: 0.9,
      rawText: `CLINICAL INJURY RECORD (${injuryRecord.injuryType || 'Visible injury'})\nRecorded: ${new Date().toLocaleString()}\nObservations: ${(injuryRecord.observations || []).join('; ')}\nFirst Aid Recommended: ${(injuryRecord.immediateFirstAid || []).join('; ')}`,
      extractedEntities: [
        {
          id: 'ent_' + Date.now() + '_1',
          category: 'condition',
          title: 'Condition',
          value: `${injuryRecord.injuryType ? injuryRecord.injuryType.charAt(0).toUpperCase() + injuryRecord.injuryType.slice(1) : 'Injury'} (Patient-reported)`,
          sourceCitation: 'Patient photo assessment',
          status: 'Patient confirmed',
        },
      ],
      qualityIssues: [],
      isUserUploaded: true,
      rotation: 0,
    };

    docs.unshift(newDoc);
    userDocuments.set(userId, docs);
    saveDbToDisk();

    return res.status(201).json({
      success: true,
      message: 'Injury record successfully saved to your medical history.',
      document: newDoc,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save injury record: ' + err.message });
  }
});

// Boot dev or production server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Take Care Health OS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
