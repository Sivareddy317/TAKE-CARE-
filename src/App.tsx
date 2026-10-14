/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ProcessedDocument,
  AcceptanceTestCase,
  AuthUser,
  UserProfile,
} from './types/clinical';
import { PRELOADED_DOCUMENTS } from './data/mockDocuments';
import { ApiService } from './services/api';
import { onAuthStateChanged, signOut, syncFirebaseUserWithApp } from './services/auth';
import { NavigationHeader } from './components/NavigationHeader';
import { BottomNavigation } from './components/BottomNavigation';
import { PatientHome } from './components/PatientHome';
import { DocumentList } from './components/DocumentList';
import { UploadFlow } from './components/UploadFlow';
import { TwoPanelVerification } from './components/TwoPanelVerification';
import { HealthSummaryView } from './components/HealthSummaryView';
import { ShareDoctorView } from './components/ShareDoctorView';
import { AbdmView } from './components/AbdmView';
import { DoctorAccessGateway } from './components/DoctorAccessGateway';
import { DoctorClinicalView } from './components/DoctorClinicalView';
import { AcceptanceTestSuiteModal } from './components/AcceptanceTestSuiteModal';
import { LoginView } from './components/auth/LoginView';
import { SignupView } from './components/auth/SignupView';
import { VerifyView } from './components/auth/VerifyView';
import { OnboardingView } from './components/auth/OnboardingView';
import { ProfileView } from './components/profile/ProfileView';
import { ProfileEditView } from './components/profile/ProfileEditView';
import { SettingsView } from './components/SettingsView';

const DEMO_PROFILE: UserProfile = {
  id: 'prof_demo',
  userId: 'usr_demo_patient',
  fullName: 'Arjun Mehta (Demo Patient)',
  dob: '1982-05-14',
  gender: 'Male',
  mobile: '9876543210',
  isMobileVerified: true,
  email: 'arjun.mehta.demo@example.com',
  emergencyContactName: 'Priya Mehta',
  emergencyContactPhone: '9876500000',
  bloodGroup: 'B+',
  preferredLanguage: 'English',
  isComplete: true,
  updatedAt: Date.now(),
};

export default function App() {
  // Auth & User Profile State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Registration flow transient states
  const [pendingVerificationMobile, setPendingVerificationMobile] = useState('');
  const [pendingVerificationCode, setPendingVerificationCode] = useState('');

  // Active Navigation Tab
  // 'login' | 'signup' | 'verify' | 'onboarding' | 'home' | 'documents' | 'upload' | 'verification' | 'summary' | 'share' | 'abdm' | 'doctor-access' | 'doctor-portal' | 'profile' | 'profile-edit' | 'settings'
  const [currentTab, setCurrentTab] = useState<string>('home');

  // Documents State (Real user accounts start with [] empty array)
  const [realUserDocuments, setRealUserDocuments] = useState<ProcessedDocument[]>([]);
  const [activeDocument, setActiveDocument] = useState<ProcessedDocument | null>(null);

  // Doctor session states
  const [doctorSessionCode, setDoctorSessionCode] = useState<string>('');
  const [doctorAuthToken, setDoctorAuthToken] = useState<string>('');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Determine active documents list based on Demo Mode toggle
  const documents = isDemoMode ? PRELOADED_DOCUMENTS : realUserDocuments;
  const activeProfile = isDemoMode
    ? DEMO_PROFILE
    : currentProfile || {
        id: 'prof_new',
        userId: currentUser?.id || 'usr_new',
        fullName: '',
        mobile: currentUser?.mobile || '',
        isMobileVerified: !!currentUser?.isVerified,
        isComplete: false,
        updatedAt: Date.now(),
      };

  // Sync user session and Firebase Authentication state changes
  useEffect(() => {
    setIsLoadingAuth(true);

    const unsubscribe = onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        try {
          const synced = await syncFirebaseUserWithApp(fbUser);
          if (synced) {
            setCurrentUser(synced.user);
            setCurrentProfile(synced.profile);

            // Load real documents for this authenticated user
            try {
              const userDocs = await ApiService.getDocuments();
              setRealUserDocuments(userDocs || []);
            } catch {
              setRealUserDocuments([]);
            }

            // Returning user direct access: bypass login directly to home/onboarding
            setCurrentTab((prev) => {
              if (['doctor-access', 'doctor-portal', 'profile', 'profile-edit', 'settings', 'documents', 'upload', 'summary', 'share'].includes(prev)) {
                return prev;
              }
              return synced.profile.fullName ? 'home' : 'onboarding';
            });
            setIsLoadingAuth(false);
            return;
          }
        } catch (err) {
          console.warn('Firebase auth sync warning:', err);
        }
      }

      // Check fallback backend session
      try {
        const me = await ApiService.getMe();
        if (me && me.user) {
          setCurrentUser(me.user);
          setCurrentProfile(me.profile);

          const userDocs = await ApiService.getDocuments();
          setRealUserDocuments(userDocs || []);

          setCurrentTab((prev) => {
            if (['doctor-access', 'doctor-portal'].includes(prev)) return prev;
            return me.profile?.fullName ? 'home' : 'onboarding';
          });
        } else {
          setCurrentTab((prev) => (['doctor-access', 'signup', 'verify'].includes(prev) ? prev : 'login'));
        }
      } catch {
        setCurrentTab((prev) => (['doctor-access', 'signup', 'verify'].includes(prev) ? prev : 'login'));
      } finally {
        setIsLoadingAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync hash routing if user opens /doctor/access or similar
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#doctor-access' || hash === '#/doctor/access') {
        setCurrentTab('doctor-access');
      } else if (hash === '#login' || hash === '#/login') {
        setCurrentTab('login');
      } else if (hash === '#signup' || hash === '#/signup') {
        setCurrentTab('signup');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Handle successful login
  const handleLoginSuccess = async (user: AuthUser, profile: UserProfile) => {
    setCurrentUser(user);
    setCurrentProfile(profile);
    setIsDemoMode(false);

    try {
      const userDocs = await ApiService.getDocuments();
      setRealUserDocuments(userDocs || []);
    } catch {
      setRealUserDocuments([]);
    }

    if (!profile?.fullName) {
      setCurrentTab('onboarding');
    } else {
      setCurrentTab('home');
    }
  };

  // Handle successful signup
  const handleSignupSuccess = (mobile: string, devCode?: string) => {
    setPendingVerificationMobile(mobile);
    setPendingVerificationCode(devCode || '');
    setCurrentTab('verify');
  };

  // Handle successful phone verification
  const handleVerifySuccess = (user: AuthUser, profile: UserProfile) => {
    setCurrentUser(user);
    setCurrentProfile(profile);
    setRealUserDocuments([]);
    setCurrentTab('onboarding');
  };

  // Handle finish onboarding
  const handleFinishOnboarding = (updatedProfile: UserProfile) => {
    setCurrentProfile(updatedProfile);
    setCurrentTab('home');
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await signOut();
    } catch {}
    setCurrentUser(null);
    setCurrentProfile(null);
    setRealUserDocuments([]);
    setActiveDocument(null);
    setIsDemoMode(false);
    setDoctorSessionCode('');
    setDoctorAuthToken('');
    setCurrentTab('login');
  };

  // Account deleted handler
  const handleAccountDeleted = () => {
    setCurrentUser(null);
    setCurrentProfile(null);
    setRealUserDocuments([]);
    setActiveDocument(null);
    setIsDemoMode(false);
    setCurrentTab('signup');
  };

  // Toggle or Enable Demo Mode
  const handleEnableDemoMode = () => {
    setIsDemoMode(true);
    if (!currentUser) {
      // Allow previewing demo mode even if not logged in yet
      setCurrentTab('home');
    }
  };

  const handleExitDemoMode = () => {
    setIsDemoMode(false);
    if (!currentUser) {
      setCurrentTab('login');
    }
  };

  // When a document is processed from UploadFlow
  const handleDocumentProcessed = async (newDoc: ProcessedDocument) => {
    if (!isDemoMode) {
      try {
        const saved = await ApiService.saveDocument(newDoc);
        setRealUserDocuments((prev) => [saved, ...prev]);
        setActiveDocument(saved);
      } catch (err) {
        console.error('Error saving document to server:', err);
        setRealUserDocuments((prev) => [newDoc, ...prev]);
        setActiveDocument(newDoc);
      }
    } else {
      setRealUserDocuments((prev) => [newDoc, ...prev]);
      setActiveDocument(newDoc);
    }
    setCurrentTab('verification');
  };

  // Inspect existing document in TwoPanelVerification
  const handleSelectDocument = (doc: ProcessedDocument) => {
    setActiveDocument(doc);
    setCurrentTab('verification');
  };

  // Update entity field state in TwoPanelVerification
  const handleUpdateEntity = async (
    docId: string,
    entityId: string,
    status: 'Confirmed' | 'Rejected' | 'Edited',
    newValue?: string
  ) => {
    if (!isDemoMode) {
      try {
        await ApiService.updateEntityStatus(docId, entityId, status, newValue);
      } catch (err) {
        console.error('Error syncing entity update:', err);
      }
    }

    setRealUserDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id !== docId) return doc;
        const updatedEntities = doc.extractedEntities.map((ent) => {
          if (ent.id !== entityId) return ent;
          return {
            ...ent,
            status,
            value: newValue || ent.value,
          };
        });
        return { ...doc, extractedEntities: updatedEntities };
      })
    );

    if (activeDocument && activeDocument.id === docId) {
      setActiveDocument((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          extractedEntities: prev.extractedEntities.map((ent) =>
            ent.id === entityId ? { ...ent, status, value: newValue || ent.value } : ent
          ),
        };
      });
    }
  };

  // Confirm all entities in a document and sync
  const handleConfirmAll = async (docId: string) => {
    if (!isDemoMode) {
      try {
        await ApiService.confirmAllEntities(docId);
      } catch (err) {
        console.error('Error syncing confirm all:', err);
      }
    }

    setRealUserDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id !== docId) return doc;
        const updatedEntities = doc.extractedEntities.map((ent) => ({
          ...ent,
          status: 'Confirmed' as const,
        }));
        return { ...doc, status: 'Confirmed' as const, extractedEntities: updatedEntities };
      })
    );
    setCurrentTab('summary');
  };

  // Retry document processing
  const handleRetryProcessing = (docId: string, options?: { rotation?: number; enhanceContrast?: boolean }) => {
    setRealUserDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id !== docId) return doc;
        return {
          ...doc,
          rotation: options?.rotation !== undefined ? options.rotation : doc.rotation,
          status: 'Awaiting Patient Review' as const,
        };
      })
    );
  };

  // Delete document
  const handleDeleteDocument = async (docId: string) => {
    if (!isDemoMode) {
      try {
        await ApiService.deleteDocument(docId);
      } catch (err) {
        console.error('Error deleting document:', err);
      }
    }
    setRealUserDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // Run acceptance test case
  const handleRunAcceptanceTest = (test: AcceptanceTestCase) => {
    const dummySvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850"><rect width="100%" height="100%" fill="%23ffffff"/><text x="40" y="60" font-family="sans-serif" font-size="18" font-weight="bold" fill="%230f172a">${test.title}</text><text x="40" y="90" font-family="sans-serif" font-size="12" fill="%2364748b">Test Case #${test.number}</text><line x1="40" y1="110" x2="560" y2="110" stroke="%23cbd5e1"/><text x="40" y="150" font-family="sans-serif" font-size="14" fill="%230f172a">1. Tab. Amlodipine 5 mg OD</text><text x="40" y="180" font-family="sans-serif" font-size="14" fill="%23b91c1c">Allergy: Dust Mites</text></svg>`;

    const newTestDoc: ProcessedDocument = {
      id: 'test-doc-' + Date.now(),
      filename: test.sampleFilename,
      fileType: test.sampleFilename.endsWith('.pdf') ? 'pdf' : 'jpg',
      category: test.category,
      uploadDate: new Date().toLocaleDateString('en-GB'),
      fileSize: '1.8 MB',
      pageCount: 1,
      currentPage: 1,
      previewUrl: dummySvg,
      originalUrl: dummySvg,
      status: test.id === 'test-8-unreadable-file' ? 'Failed' : 'Awaiting Patient Review',
      ocrConfidence: test.id === 'test-6-blurry-image' ? 68 : test.id === 'test-8-unreadable-file' ? 12 : 96,
      rotation: test.id === 'test-5-rotated-image' ? 90 : 0,
      rawText: `ACCEPTANCE TEST #${test.number}: ${test.title}\nExpected: ${test.expectedBehavior}`,
      qualityIssues: test.rawDocumentMock?.qualityIssues || [],
      extractedEntities: [
        {
          id: 'ent-test-1',
          category: 'medication',
          title: 'Amlodipine',
          value: 'Amlodipine 5 mg',
          secondaryValue: '1 tablet once daily (Morning, post-meal)',
          sourceDoc: test.sampleFilename,
          pageNumber: 1,
          confidence: 98,
          status: 'Extracted',
          box: { ymin: 130, xmin: 50, ymax: 170, xmax: 600 },
        },
        {
          id: 'ent-test-2',
          category: 'allergy',
          title: 'Dust Mites',
          value: 'Dust Mites',
          secondaryValue: 'Allergic rhinitis',
          sourceDoc: test.sampleFilename,
          pageNumber: 1,
          confidence: 94,
          status: 'Extracted',
          box: { ymin: 160, xmin: 50, ymax: 200, xmax: 600 },
        },
      ],
    };

    setRealUserDocuments((prev) => [newTestDoc, ...prev]);
    setActiveDocument(newTestDoc);
    setCurrentTab('verification');
  };

  // Loading Splash Screen while checking auth session
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md animate-pulse mb-3">
          <span className="material-symbols-outlined text-[32px]">local_hospital</span>
        </div>
        <p className="text-sm font-bold text-slate-800">Take Care</p>
        <p className="text-xs text-slate-400 mt-1">Securing clinical data repository...</p>
      </div>
    );
  }

  // AUTHENTICATION SCREENS (For unauthenticated visitors or explicit auth routes)
  if (currentTab === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-6">
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onNavigateToSignup={() => setCurrentTab('signup')}
          onEnableDemoMode={handleEnableDemoMode}
        />
      </div>
    );
  }

  if (currentTab === 'signup') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-6">
        <SignupView
          onSignupSuccess={handleSignupSuccess}
          onDirectLoginSuccess={handleLoginSuccess}
          onNavigateToLogin={() => setCurrentTab('login')}
          onEnableDemoMode={handleEnableDemoMode}
        />
      </div>
    );
  }

  if (currentTab === 'verify') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-6">
        <VerifyView
          mobile={pendingVerificationMobile}
          initialDevCode={pendingVerificationCode}
          onVerifySuccess={handleVerifySuccess}
          onBackToSignup={() => setCurrentTab('signup')}
        />
      </div>
    );
  }

  if (currentTab === 'onboarding') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-6">
        <OnboardingView
          initialProfile={activeProfile}
          onFinishOnboarding={handleFinishOnboarding}
        />
      </div>
    );
  }

  // Doctor Clinical Workstation Portal
  if (currentTab === 'doctor-portal') {
    return (
      <DoctorClinicalView
        sessionCode={doctorSessionCode}
        authToken={doctorAuthToken}
        onExit={() => setCurrentTab('doctor-access')}
        onInspectDocument={(doc) => {
          setActiveDocument(doc);
          setCurrentTab('verification');
        }}
      />
    );
  }

  // Two-Panel Verification Screen
  if (currentTab === 'verification' && activeDocument) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <NavigationHeader
          currentTab="verification"
          profile={activeProfile}
          isDemoMode={isDemoMode}
          onNavigate={(tab) => setCurrentTab(tab)}
          onOpenDoctorPortal={() => setCurrentTab('doctor-access')}
          onOpenAcceptanceTests={() => setIsTestModalOpen(true)}
          onExitDemoMode={handleExitDemoMode}
          showBack={true}
          onBack={() => setCurrentTab('documents')}
        />
        <main className="flex-1 w-full">
          <TwoPanelVerification
            document={activeDocument}
            onUpdateEntity={handleUpdateEntity}
            onConfirmAll={handleConfirmAll}
            onRetryProcessing={handleRetryProcessing}
            onClose={() => setCurrentTab('documents')}
          />
        </main>
        <AcceptanceTestSuiteModal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          onRunTest={handleRunAcceptanceTest}
        />
      </div>
    );
  }

  // Standard Take Care Application Shell
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      <NavigationHeader
        currentTab={currentTab}
        profile={activeProfile}
        isDemoMode={isDemoMode}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenDoctorPortal={() => setCurrentTab('doctor-access')}
        onOpenAcceptanceTests={() => setIsTestModalOpen(true)}
        onOpenProfile={() => setCurrentTab('profile')}
        onOpenSettings={() => setCurrentTab('settings')}
        onExitDemoMode={handleExitDemoMode}
        showBack={['upload', 'doctor-access', 'profile', 'profile-edit', 'settings'].includes(currentTab)}
        onBack={() => setCurrentTab('home')}
      />

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4">
        {currentTab === 'home' && (
          <PatientHome
            profile={activeProfile}
            documents={documents}
            isDemoMode={isDemoMode}
            onNavigate={(tab) => setCurrentTab(tab)}
            onSelectDocument={handleSelectDocument}
            onEnableDemoMode={handleEnableDemoMode}
          />
        )}

        {currentTab === 'documents' && (
          <DocumentList
            documents={documents}
            onSelectDocument={handleSelectDocument}
            onUploadMore={() => setCurrentTab('upload')}
            onShareDocument={() => setCurrentTab('share')}
            onDeleteDocument={handleDeleteDocument}
          />
        )}

        {currentTab === 'upload' && (
          <UploadFlow
            onDocumentProcessed={handleDocumentProcessed}
            onSelectTest={handleRunAcceptanceTest}
          />
        )}

        {currentTab === 'summary' && (
          <HealthSummaryView
            profile={activeProfile}
            documents={documents}
            isDemoMode={isDemoMode}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenTwoPanelForDoc={(filename) => {
              const doc = documents.find((d) => d.filename === filename);
              if (doc) {
                setActiveDocument(doc);
                setCurrentTab('verification');
              }
            }}
            onEnableDemoMode={handleEnableDemoMode}
          />
        )}

        {currentTab === 'doctor-access' && (
          <DoctorAccessGateway
            initialCode={doctorSessionCode}
            onAccessGranted={(code, token) => {
              setDoctorSessionCode(code);
              setDoctorAuthToken(token);
              setCurrentTab('doctor-portal');
            }}
            onReturnToPatientView={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'share' && (
          <ShareDoctorView
            profile={activeProfile}
            documents={documents}
            isDemoMode={isDemoMode}
            onOpenDoctorPortal={(code) => {
              if (code) setDoctorSessionCode(code);
              setCurrentTab('doctor-access');
            }}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'abdm' && <AbdmView />}

        {currentTab === 'profile' && (
          <ProfileView
            profile={activeProfile}
            onEdit={() => setCurrentTab('profile-edit')}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'profile-edit' && (
          <ProfileEditView
            initialProfile={activeProfile}
            onSaved={(updated) => {
              setCurrentProfile(updated);
              setCurrentTab('profile');
            }}
            onCancel={() => setCurrentTab('profile')}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            profile={activeProfile}
            isDemoMode={isDemoMode}
            onNavigateToProfile={() => setCurrentTab('profile')}
            onNavigateToProfileEdit={() => setCurrentTab('profile-edit')}
            onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
            onLogout={handleLogout}
            onAccountDeleted={handleAccountDeleted}
          />
        )}
      </main>

      {/* Persistent Bottom Navigation */}
      {['home', 'documents', 'summary', 'doctor-access', 'share'].includes(currentTab) && (
        <BottomNavigation
          currentTab={currentTab}
          onNavigate={(tab) => setCurrentTab(tab)}
        />
      )}

      {/* Acceptance Test Suite Modal */}
      <AcceptanceTestSuiteModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onRunTest={handleRunAcceptanceTest}
      />
    </div>
  );
}
