export type DocumentStatus = 'Uploaded' | 'Validating' | 'Preparing Pages' | 'Extracting Text' | 'Reading Medical Information' | 'Validating Results' | 'Awaiting Patient Review' | 'Confirmed' | 'Failed' | 'Partially Processed';

export type FieldStatus = 'Extracted' | 'Confirmed' | 'Rejected' | 'Edited';

export interface BoundingBox {
  ymin: number; // 0 to 1000
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface MedicalEntity {
  id: string;
  category: 'allergy' | 'medication' | 'condition' | 'procedure' | 'lab' | 'instruction';
  title: string;
  value: string;
  secondaryValue?: string;
  details?: string;
  sourceDoc: string;
  pageNumber: number;
  confidence: number; // 0 - 100
  isHandwritten?: boolean;
  box?: BoundingBox;
  status: FieldStatus;
  editedValue?: string;
  flagReason?: string;
}

export interface PatientInfo {
  id: string;
  name: string;
  age?: number;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  mobile?: string;
  email?: string;
  isComplete?: boolean;
  activeSessionCode?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  dob?: string;
  age?: number | string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say' | '';
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

export interface InjuryAnalysisResult {
  id: string;
  injuryType: 'burn' | 'wound' | 'cut' | 'visible_injury';
  observations: string[];
  limitations: string[];
  immediateFirstAid: string[];
  emergencyWarningSigns: string[];
  requiresEmergencyCare: boolean;
  serviceConfigured: boolean;
  timestamp: number;
}

export interface AuthUser {
  id: string;
  mobile: string;
  isVerified: boolean;
  email?: string;
  isDemo?: boolean;
}

export interface QualityIssue {
  type: 'blur' | 'low_contrast' | 'rotation' | 'low_confidence_medication' | 'missing_unit' | 'missing_date' | 'conflict' | 'unreadable';
  severity: 'warning' | 'error' | 'info';
  message: string;
  recommendation: string;
  autoResolved?: boolean;
}

export interface ProcessedDocument {
  id: string;
  userId?: string;
  filename: string;
  fileType: 'pdf' | 'jpg' | 'png';
  category: 'prescription' | 'lab' | 'discharge' | 'surgery' | 'scan' | 'other';
  uploadDate: string;
  fileSize: string;
  pageCount: number;
  currentPage: number;
  previewUrl: string;
  originalUrl: string;
  preprocessedUrl?: string;
  status: DocumentStatus;
  ocrConfidence: number;
  rawText: string;
  extractedEntities: MedicalEntity[];
  qualityIssues: QualityIssue[];
  isSyntheticTest?: boolean;
  isUserUploaded?: boolean;
  testCaseId?: string;
  rotation: number; // 0, 90, 180, 270
}

export interface AcceptanceTestCase {
  id: string;
  number: number;
  title: string;
  description: string;
  expectedBehavior: string;
  sampleFilename: string;
  category: 'prescription' | 'lab' | 'discharge' | 'surgery' | 'scan' | 'other';
  rawDocumentMock: Partial<ProcessedDocument>;
}

export interface SharingScope {
  summary: boolean;
  docs: boolean;
  labs: boolean;
}

export interface DoctorSharingSession {
  code: string;
  patientId: string;
  duration: '15m' | '1h' | '24h';
  createdAt: number;
  expiresAt: number;
  remainingSeconds: number;
  status: 'active' | 'accessed' | 'expired' | 'revoked';
  scope: SharingScope;
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

export interface HealthSummaryCategory {
  title: string;
  count: number;
  items: MedicalEntity[];
}

export interface UserHealthSummary {
  hasSummary: boolean;
  patient: PatientInfo;
  allergies: MedicalEntity[];
  medications: MedicalEntity[];
  conditions: MedicalEntity[];
  procedures: MedicalEntity[];
  labs: MedicalEntity[];
  totalConfirmedDocs: number;
  lastUpdated: string;
}

export interface AppPermissionsStatus {
  camera: 'granted' | 'denied' | 'prompt' | 'unsupported';
  notifications: 'granted' | 'denied' | 'default' | 'unsupported';
}

// ==========================================
// FAMILY HEALTH PROFILES & ACCESS MODELS
// ==========================================

export type FamilyRelationship = 'Parent' | 'Spouse' | 'Child' | 'Sibling' | 'Other';
export type FamilyPermissionLevel = 'complete' | 'emergency' | 'none';
export type FamilyAccessStatus = 'active' | 'pending_consent' | 'revoked' | 'expired';

export interface FamilyMember {
  id: string;
  ownerUserId: string; // The user who manages this link
  targetUserId?: string; // Registered user ID if they have a Take Care account
  fullName: string;
  relationship: FamilyRelationship;
  mobile: string;
  dob?: string;
  isMinor?: boolean;
  guardianName?: string;
  guardianConsentGiven?: boolean;
  
  // Permission settings
  permissionLevel: FamilyPermissionLevel;
  status: FamilyAccessStatus;
  grantedAt?: number;
  expiresAt?: number;
  invitationCode?: string;
  isOwner?: boolean;
}

export interface FamilyAccessAuditLog {
  id: string;
  timestamp: number;
  actorUserId: string;
  actorName: string;
  targetProfileId: string;
  targetProfileName: string;
  action: 'invited' | 'consent_approved' | 'access_granted' | 'access_viewed' | 'access_changed' | 'access_revoked';
  permissionLevel: FamilyPermissionLevel;
  details?: string;
}
