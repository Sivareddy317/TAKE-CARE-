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
import { ApiService } from './services/api';
import { onAuthStateChanged, signOut, syncFirebaseUserWithApp } from './services/auth';
import { NavigationHeader } from './components/NavigationHeader';
import { BottomNavigation } from './components/BottomNavigation';
import { AyuHome } from './components/AyuHome';
import { DocumentList } from './components/DocumentList';
import { UploadFlow } from './components/UploadFlow';
import { TwoPanelVerification } from './components/TwoPanelVerification';
import { HealthSummaryView } from './components/HealthSummaryView';
import { ShareDoctorView } from './components/ShareDoctorView';
import { AbdmView } from './components/AbdmView';
import { DoctorAccessGateway } from './components/DoctorAccessGateway';
import { DoctorClinicalView } from './components/DoctorClinicalView';
import { AcceptanceTestSuiteModal } from './components/AcceptanceTestSuiteModal';
import { OnboardingCarousel } from './components/onboarding/OnboardingCarousel';
import { AyuLoginView } from './components/auth/AyuLoginView';
import { AyuRegisterView } from './components/auth/AyuRegisterView';
import { DataUsageConsentView } from './components/auth/DataUsageConsentView';
import { VerifyView } from './components/auth/VerifyView';
import { AskAyuView } from './components/assistant/AskAyuView';
import { MedicineRemindersView } from './components/features/MedicineRemindersView';
import { BookAppointmentView } from './components/features/BookAppointmentView';
import { DiabetesTrackerView } from './components/features/DiabetesTrackerView';
import { AyuAccountView } from './components/profile/AyuAccountView';
import { AyuEditProfileView } from './components/profile/AyuEditProfileView';
import { SettingsView } from './components/SettingsView';
import { AppIcon } from './components/common/AppLogo';

export default function App() {
  // Auth & User Profile State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Registration flow transient states
  const [pendingMobile, setPendingMobile] = useState('+919182302896');
  const [pendingOtpCode, setPendingOtpCode] = useState('123456');
  const [pendingRegData, setPendingRegData] = useState<{
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
  } | null>(null);

  // Active Navigation Tab:
  // 'onboarding' | 'login' | 'register' | 'consent' | 'verify' | 'home' | 'documents' | 'upload' | 'verification' | 'summary' | 'share' | 'doctor-access' | 'doctor-portal' | 'account' | 'profile-edit' | 'ask-ayu' | 'reminders' | 'appointments' | 'diabetes' | 'settings'
  const [currentTab, setCurrentTab] = useState<string>('home');

  // Documents State: Real authenticated documents strictly (starts at [] empty)
  const [realUserDocuments, setRealUserDocuments] = useState<ProcessedDocument[]>([]);
  const [activeDocument, setActiveDocument] = useState<ProcessedDocument | null>(null);

  // Doctor session states
  const [doctorSessionCode, setDoctorSessionCode] = useState<string>('');
  const [doctorAuthToken, setDoctorAuthToken] = useState<string>('');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Active Profile object
  const activeProfile: UserProfile = currentProfile || {
    id: 'prof_default',
    userId: currentUser?.id || 'usr_siva',
    fullName: 'Siva Reddy',
    dob: '1 Apr 2006',
    gender: 'Male',
    mobile: '9182302896',
    isMobileVerified: true,
    isComplete: true,
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

            // Returning user direct access: bypass login directly to home
            setCurrentTab((prev) => {
              if (
                [
                  'doctor-access',
                  'doctor-portal',
                  'account',
                  'profile-edit',
                  'settings',
                  'documents',
                  'upload',
                  'summary',
                  'share',
                  'ask-ayu',
                  'reminders',
                  'appointments',
                  'diabetes',
                ].includes(prev)
              ) {
                return prev;
              }
              return 'home';
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
            return 'home';
          });
        } else {
          // If no active session, show onboarding carousel or login
          const hasSeenOnboarding = localStorage.getItem('ayu_seen_onboarding');
          setCurrentTab(hasSeenOnboarding ? 'home' : 'onboarding');
        }
      } catch {
        const hasSeenOnboarding = localStorage.getItem('ayu_seen_onboarding');
        setCurrentTab(hasSeenOnboarding ? 'home' : 'onboarding');
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
      } else if (hash === '#onboarding') {
        setCurrentTab('onboarding');
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

    try {
      const userDocs = await ApiService.getDocuments();
      setRealUserDocuments(userDocs || []);
    } catch {
      setRealUserDocuments([]);
    }

    setCurrentTab('home');
  };

  // Finish Onboarding Carousel (Image 10-12)
  const handleFinishOnboardingCarousel = () => {
    localStorage.setItem('ayu_seen_onboarding', 'true');
    setCurrentTab('login');
  };

  // Handle Phone OTP Required
  const handlePhoneOtpRequired = (phone: string, devCode?: string) => {
    setPendingMobile(phone);
    setPendingOtpCode(devCode || '123456');
    setCurrentTab('verify');
  };

  // Handle Navigate to Register
  const handleNavigateToRegister = (phone: string) => {
    setPendingMobile(phone);
    setCurrentTab('register');
  };

  // Handle Register Continue -> moves to Data Usage & AI Consent
  const handleRegisterContinue = (data: {
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
  }) => {
    setPendingRegData(data);
    setCurrentTab('consent');
  };

  // Handle Consent Given -> completes registration
  const handleConsentGiven = async () => {
    const fullName = pendingRegData
      ? `${pendingRegData.firstName} ${pendingRegData.lastName}`
      : 'Siva Reddy';

    const newProfile: UserProfile = {
      id: 'prof_' + Date.now(),
      userId: currentUser?.id || 'usr_' + Date.now(),
      fullName,
      dob: pendingRegData?.dob || '1 Apr 2006',
      gender: (pendingRegData?.gender as any) || 'Male',
      mobile: pendingMobile.replace(/^\+91/, ''),
      isMobileVerified: true,
      isComplete: true,
      updatedAt: Date.now(),
    };

    try {
      await ApiService.updateProfile(newProfile);
    } catch {}

    setCurrentProfile(newProfile);
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
    setCurrentTab('login');
  };

  // When a document is processed from UploadFlow
  const handleDocumentProcessed = async (newDoc: ProcessedDocument) => {
    try {
      const saved = await ApiService.saveDocument(newDoc);
      setRealUserDocuments((prev) => [saved, ...prev]);
      setActiveDocument(saved);
    } catch (err) {
      console.error('Error saving document to server:', err);
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
    try {
      await ApiService.updateEntityStatus(docId, entityId, status, newValue);
    } catch (err) {
      console.error('Error syncing entity update:', err);
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
    try {
      await ApiService.confirmAllEntities(docId);
    } catch (err) {
      console.error('Error syncing confirm all:', err);
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
    setCurrentTab('documents');
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
    try {
      await ApiService.deleteDocument(docId);
    } catch (err) {
      console.error('Error deleting document:', err);
    }
    setRealUserDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // Acceptance tests runner
  const handleRunAcceptanceTest = (test: AcceptanceTestCase) => {
    const dummySvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850"><rect width="100%" height="100%" fill="%23ffffff"/><text x="40" y="60" font-family="sans-serif" font-size="18" font-weight="bold" fill="%230f172a">${test.title}</text><text x="40" y="90" font-family="sans-serif" font-size="12" fill="%2364748b">Test Case #${test.number}</text><line x1="40" y1="110" x2="560" y2="110" stroke="%23cbd5e1"/><text x="40" y="150" font-family="sans-serif" font-size="14" fill="%230f172a">1. Tab. Paracetamol 650 mg</text></svg>`;

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
          title: 'Paracetamol',
          value: 'Paracetamol 650 mg',
          secondaryValue: '1 tablet twice daily',
          sourceDoc: test.sampleFilename,
          pageNumber: 1,
          confidence: 98,
          status: 'Extracted',
          box: { ymin: 130, xmin: 50, ymax: 170, xmax: 600 },
        },
      ],
    };

    setRealUserDocuments((prev) => [newTestDoc, ...prev]);
    setActiveDocument(newTestDoc);
    setCurrentTab('verification');
  };

  // Loading Splash Screen
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <AppIcon size={64} className="animate-pulse mb-3" />
        <p className="text-base font-extrabold text-slate-900">Ayu Health</p>
        <p className="text-xs text-slate-500 mt-1">Paperless Medical History powered by AI</p>
      </div>
    );
  }

  // 1. ONBOARDING CAROUSEL (Images 10, 11, 12)
  if (currentTab === 'onboarding') {
    return <OnboardingCarousel onFinish={handleFinishOnboardingCarousel} />;
  }

  // 2. PHONE / EMAIL / GOOGLE LOGIN (Image 3)
  if (currentTab === 'login') {
    return (
      <AyuLoginView
        onLoginSuccess={handleLoginSuccess}
        onNavigateToRegister={handleNavigateToRegister}
        onPhoneOtpRequired={handlePhoneOtpRequired}
      />
    );
  }

  // 3. REGISTER SCREEN (Image 8)
  if (currentTab === 'register') {
    return (
      <AyuRegisterView
        initialMobile={pendingMobile}
        onContinue={handleRegisterContinue}
        onBack={() => setCurrentTab('login')}
      />
    );
  }

  // 4. DATA USAGE & AI CONSENT (Image 9)
  if (currentTab === 'consent') {
    return (
      <DataUsageConsentView
        onConsentGiven={handleConsentGiven}
        onBack={() => setCurrentTab('register')}
      />
    );
  }

  // 5. OTP VERIFY SCREEN
  if (currentTab === 'verify') {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-6">
        <VerifyView
          mobile={pendingMobile}
          initialDevCode={pendingOtpCode}
          onVerifySuccess={(user, profile) => {
            setCurrentUser(user);
            setCurrentProfile(profile);
            setCurrentTab('home');
          }}
          onBackToSignup={() => setCurrentTab('login')}
        />
      </div>
    );
  }

  // 6. DOCTOR CLINICAL VIEW
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

  // 7. TWO-PANEL VISUAL VERIFICATION SCREEN
  if (currentTab === 'verification' && activeDocument) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <NavigationHeader
          currentTab="verification"
          profile={activeProfile}
          onNavigate={(tab) => setCurrentTab(tab)}
          onOpenDoctorPortal={() => setCurrentTab('doctor-access')}
          onOpenAcceptanceTests={() => setIsTestModalOpen(true)}
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

  // 8. FULL AYU APPLICATION SHELL
  const isFullScreenSubpage = [
    'home',
    'account',
    'profile-edit',
    'ask-ayu',
    'reminders',
    'appointments',
    'diabetes',
  ].includes(currentTab);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-slate-900 font-sans antialiased">
      {/* Show Navigation Header on sub-pages like documents, upload, summary, share */}
      {!isFullScreenSubpage && (
        <NavigationHeader
          currentTab={currentTab}
          profile={activeProfile}
          onNavigate={(tab) => setCurrentTab(tab)}
          onOpenDoctorPortal={() => setCurrentTab('doctor-access')}
          onOpenAcceptanceTests={() => setIsTestModalOpen(true)}
          onOpenProfile={() => setCurrentTab('account')}
          showBack={['upload', 'doctor-access', 'summary', 'share'].includes(currentTab)}
          onBack={() => setCurrentTab('home')}
        />
      )}

      <main className="flex-1 w-full">
        {/* AYU HOME (Images 4 & 7) */}
        {currentTab === 'home' && (
          <AyuHome
            profile={activeProfile}
            documents={realUserDocuments}
            onNavigate={(tab) => setCurrentTab(tab)}
            onSelectDocument={handleSelectDocument}
            onOpenAskAyuWithQuery={() => setCurrentTab('ask-ayu')}
          />
        )}

        {/* ASK AYU ASSISTANT (Images 13 & 14) */}
        {currentTab === 'ask-ayu' && (
          <AskAyuView
            profile={activeProfile}
            documents={realUserDocuments}
            onBack={() => setCurrentTab('home')}
            onNavigateToUpload={() => setCurrentTab('upload')}
            onNavigateToHistory={() => setCurrentTab('documents')}
          />
        )}

        {/* MEDICINE REMINDERS (Image 4 Feature) */}
        {currentTab === 'reminders' && (
          <div className="p-4 sm:p-6">
            <MedicineRemindersView onBack={() => setCurrentTab('home')} />
          </div>
        )}

        {/* BOOK APPOINTMENT (Image 4 Feature) */}
        {currentTab === 'appointments' && (
          <div className="p-4 sm:p-6">
            <BookAppointmentView onBack={() => setCurrentTab('home')} />
          </div>
        )}

        {/* TRACK DIABETES (Image 4 & 12 Feature) */}
        {currentTab === 'diabetes' && (
          <div className="p-4 sm:p-6">
            <DiabetesTrackerView onBack={() => setCurrentTab('home')} />
          </div>
        )}

        {/* ACCOUNT SCREEN (Image 5) */}
        {currentTab === 'account' && (
          <AyuAccountView
            profile={activeProfile}
            onBack={() => setCurrentTab('home')}
            onNavigateToEditProfile={() => setCurrentTab('profile-edit')}
            onLogout={handleLogout}
            onConnectDoctorSession={(code) => {
              setDoctorSessionCode(code);
              setCurrentTab('doctor-access');
            }}
          />
        )}

        {/* EDIT PROFILE SCREEN (Image 6) */}
        {currentTab === 'profile-edit' && (
          <AyuEditProfileView
            profile={activeProfile}
            onBack={() => setCurrentTab('account')}
            onSaveSuccess={(updated) => setCurrentProfile(updated)}
            onAccountDeleted={handleAccountDeleted}
          />
        )}

        {/* MY MEDICAL HISTORY (DOCUMENT VAULT) */}
        {currentTab === 'documents' && (
          <div className="max-w-md mx-auto p-4">
            <DocumentList
              documents={realUserDocuments}
              onSelectDocument={handleSelectDocument}
              onUploadMore={() => setCurrentTab('upload')}
              onShareDocument={() => setCurrentTab('share')}
              onDeleteDocument={handleDeleteDocument}
            />
          </div>
        )}

        {/* SCAN / UPLOAD DOCUMENTS */}
        {currentTab === 'upload' && (
          <div className="max-w-md mx-auto p-4">
            <UploadFlow
              onDocumentProcessed={handleDocumentProcessed}
              onSelectTest={handleRunAcceptanceTest}
            />
          </div>
        )}

        {/* HEALTH SUMMARY */}
        {currentTab === 'summary' && (
          <div className="max-w-md mx-auto p-4">
            <HealthSummaryView
              profile={activeProfile}
              documents={realUserDocuments}
              isDemoMode={false}
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenTwoPanelForDoc={(filename) => {
                const doc = realUserDocuments.find((d) => d.filename === filename);
                if (doc) {
                  setActiveDocument(doc);
                  setCurrentTab('verification');
                }
              }}
              onEnableDemoMode={() => {}}
            />
          </div>
        )}

        {/* DOCTOR ACCESS GATEWAY */}
        {currentTab === 'doctor-access' && (
          <div className="max-w-md mx-auto p-4">
            <DoctorAccessGateway
              initialCode={doctorSessionCode}
              onAccessGranted={(code, token) => {
                setDoctorSessionCode(code);
                setDoctorAuthToken(token);
                setCurrentTab('doctor-portal');
              }}
              onReturnToPatientView={() => setCurrentTab('home')}
            />
          </div>
        )}

        {/* SHARE WITH DOCTOR */}
        {currentTab === 'share' && (
          <div className="max-w-md mx-auto p-4">
            <ShareDoctorView
              profile={activeProfile}
              documents={realUserDocuments}
              isDemoMode={false}
              onOpenDoctorPortal={(code) => {
                if (code) setDoctorSessionCode(code);
                setCurrentTab('doctor-access');
              }}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          </div>
        )}

        {/* ABDM HEALTH RECORDS */}
        {currentTab === 'abdm' && (
          <div className="max-w-md mx-auto p-4">
            <AbdmView />
          </div>
        )}

        {/* SETTINGS */}
        {currentTab === 'settings' && (
          <div className="max-w-md mx-auto p-4">
            <SettingsView
              profile={activeProfile}
              isDemoMode={false}
              onNavigateToProfile={() => setCurrentTab('account')}
              onNavigateToProfileEdit={() => setCurrentTab('profile-edit')}
              onToggleDemoMode={() => {}}
              onLogout={handleLogout}
              onAccountDeleted={handleAccountDeleted}
            />
          </div>
        )}
      </main>

      {/* Persistent Bottom Navigation on core tabs */}
      {['home', 'documents', 'doctor-access'].includes(currentTab) && (
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
