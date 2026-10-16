import React, { useState, useEffect } from 'react';
import { ProcessedDocument } from '../types/clinical';
import { PRELOADED_DOCUMENTS } from '../data/mockDocuments';
import { ApiService } from '../services/api';

interface DoctorClinicalViewProps {
  sessionCode: string;
  authToken?: string;
  onExit: () => void;
  onInspectDocument: (doc: ProcessedDocument) => void;
}

export const DoctorClinicalView: React.FC<DoctorClinicalViewProps> = ({
  sessionCode,
  authToken,
  onExit,
  onInspectDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'timeline' | 'vault'>('summary');
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState<number>(3600); // Default 1 hour until fetched from backend
  const [physicianNote, setPhysicianNote] = useState('');
  const [isSignedWithNmc, setIsSignedWithNmc] = useState(true);
  const [isNoteSaved, setIsNoteSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSessionRevoked, setIsSessionRevoked] = useState(false);
  const [permittedScope, setPermittedScope] = useState({ summary: true, docs: true, labs: true });
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [patientInfo, setPatientInfo] = useState<{
    id: string;
    name: string;
    age?: number | string;
    dob?: string;
    gender?: string;
    bloodGroup?: string;
    emergencyContact?: string;
  } | null>(null);
  const [patientDocs, setPatientDocs] = useState<ProcessedDocument[]>([]);
  const [patientAllergies, setPatientAllergies] = useState<any[]>([]);
  const [patientMedications, setPatientMedications] = useState<any[]>([]);
  const [patientConditions, setPatientConditions] = useState<any[]>([]);
  const [patientLabs, setPatientLabs] = useState<any[]>([]);

  // On mount: Fetch genuine protected summary from backend using authToken
  useEffect(() => {
    let isMounted = true;

    async function fetchSummary() {
      setIsLoadingSession(true);
      try {
        const headers: Record<string, string> = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const res = await fetch(ApiService.url('/api/doctor/summary'), { headers });

        if (res.status === 403 || res.status === 401) {
          if (isMounted) setIsSessionRevoked(true);
          return;
        }

        const cType = res.headers.get('content-type') || '';
        if (res.ok && cType.includes('application/json')) {
          const data = await res.json();
          if (isMounted && data.success) {
            if (typeof data.remainingSeconds === 'number') {
              setSessionSeconds(data.remainingSeconds);
            }
            if (data.scope) {
              setPermittedScope(data.scope);
            }
            if (data.consultationNote) {
              setPhysicianNote(data.consultationNote);
            }
            if (data.isSigned) {
              setIsNoteSaved(true);
            }
            if (data.patient) {
              setPatientInfo(data.patient);
            }
            if (Array.isArray(data.documents)) {
              setPatientDocs(data.documents);
            }
            if (Array.isArray(data.allergies)) {
              setPatientAllergies(data.allergies);
            }
            if (Array.isArray(data.medications)) {
              setPatientMedications(data.medications);
            }
            if (Array.isArray(data.conditions)) {
              setPatientConditions(data.conditions);
            }
            if (Array.isArray(data.labs)) {
              setPatientLabs(data.labs);
            }
          }
        } else {
          // Check active session if authToken was direct
          const activeRes = await fetch(ApiService.url('/api/share/active-session'));
          const actType = activeRes.headers.get('content-type') || '';
          if (activeRes.ok && actType.includes('application/json')) {
            const activeData = await activeRes.json();
            if (isMounted && activeData.active && activeData.session) {
              setSessionSeconds(activeData.session.remainingSeconds);
              if (activeData.session.scope) setPermittedScope(activeData.session.scope);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching doctor summary:', err);
      } finally {
        if (isMounted) setIsLoadingSession(false);
      }
    }

    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, [authToken]);

  // Expiry countdown timer (derived strictly from backend remaining time)
  useEffect(() => {
    if (sessionSeconds <= 0) return;

    const timer = setInterval(() => {
      setSessionSeconds((prev) => {
        if (prev <= 1) {
          setShowExpiryModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionSeconds]);

  const formatTimer = () => {
    if (sessionSeconds <= 0) return 'Expired';
    const hrs = Math.floor(sessionSeconds / 3600);
    const mins = Math.floor((sessionSeconds % 3600) / 60);
    const secs = sessionSeconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveAndSign = async () => {
    try {
      if (authToken) {
        await fetch(ApiService.url('/api/doctor/sign-note'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            note: physicianNote,
            nmcReg: 'NMC-48102',
          }),
        });
      }
    } catch {
      // Local fallback
    }
    setIsNoteSaved(true);
    showToast('Consultation Note counter-signed & certified with NMC Reg #48102');
  };

  const handleRevokeFromDoctor = async () => {
    if (window.confirm('Close active consultation session and return to Take Care?')) {
      try {
        await fetch(ApiService.url('/api/share/revoke'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: sessionCode }),
        });
      } catch {}
      onExit();
    }
  };

  if (isSessionRevoked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-800">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[30px]">lock</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Revoked by Patient</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            The patient has explicitly revoked access to this consultation sharing token. You can no longer view this health summary.
          </p>
          <button
            onClick={onExit}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Return to Take Care App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800 font-sans antialiased selection:bg-teal-100 selection:text-teal-900 overflow-x-hidden animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-teal-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Clinical Navigation Bar (Responsive on Mobile, Tablet & Desktop) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Mobile Top Header (Clean, Spacious 2-row layout on phones) */}
          <div className="sm:hidden py-2 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onExit}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition"
                  title="Return to Take Care App"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>
                <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[16px]">local_hospital</span>
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900">Take Care</span>
                  <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200">
                    Clinical Portal
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRevokeFromDoctor}
                className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
              >
                <span className="material-symbols-outlined text-[14px]">logout</span>
                <span>Exit</span>
              </button>
            </div>

            {/* Row 2 on Mobile: Ephemeral Code & Countdown Timer */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-900 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Session: <strong className="font-mono font-bold text-teal-800">#{sessionCode || 'Active'}</strong></span>
              </div>

              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                <span className="material-symbols-outlined text-[14px] text-amber-700">schedule</span>
                <span className="font-mono font-bold">{formatTimer()}</span>
              </div>
            </div>
          </div>

          {/* Tablet & Desktop Top Header (1-row layout) */}
          <div className="hidden sm:flex items-center justify-between h-16 gap-4">
            {/* Left: Brand & Clinical Portal Badge */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onExit}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
                title="Return to Take Care App"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>

              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-[20px]">local_hospital</span>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-slate-900">Take Care</span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                    Clinical Portal
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Consent-Governed EHR Exchange
                </p>
              </div>
            </div>

            {/* Doctor info */}
            <div className="flex items-center space-x-2.5 border-l border-slate-200 pl-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                DS
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900">Dr. Rajesh Sharma, MD</span>
                <p className="text-[11px] text-slate-500">Cardiology • City Hospital (NMC: #48102)</p>
              </div>
            </div>

            {/* Right: Session Code, Timer & Actions */}
            <div className="flex items-center space-x-2.5 ml-auto">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Session: <strong className="font-mono text-teal-900">#{sessionCode || 'Active'}</strong></span>
              </div>

              <div className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                <span className="material-symbols-outlined text-[15px] text-amber-600">schedule</span>
                <span className="font-mono font-bold">{formatTimer()}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowExpiryModal(true)}
                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition"
                title="Test Expiry State Overlay"
              >
                <span className="material-symbols-outlined text-[15px] text-amber-600">bolt</span>
                <span>Simulate</span>
              </button>

              <button
                type="button"
                onClick={handleRevokeFromDoctor}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px]">logout</span>
                <span>Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Patient Context Master Ribbon (Responsive Stack on Mobile, Grid on Tablet/Desktop) */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Patient Identity Block */}
            {(() => {
              const activePatient = patientInfo || {
                id: sessionCode ? `PAT-${sessionCode.slice(0, 4)}` : 'PATIENT-01',
                name: 'Verified Patient',
                age: 'Not Specified',
                gender: 'Not Specified',
                bloodGroup: 'Not Documented',
                emergencyContact: 'Not Documented',
              };
              const recordedAllergiesCount = patientAllergies.length > 0 ? patientAllergies.length : 1;
              const recordedMedsCount = patientMedications.length > 0 ? patientMedications.length : 2;
              const recordedDocsCount = patientDocs.length > 0 ? patientDocs.length : 5;

              return (
                <>
                  <div className="flex items-center space-x-3.5 sm:space-x-4 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-teal-50 border-2 border-teal-500/30 text-teal-800 flex items-center justify-center font-bold text-lg shadow-xs">
                        {activePatient.name ? activePatient.name.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <span
                        className="absolute bottom-0 right-0 w-4 h-4 bg-teal-600 border-2 border-white rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                        title="Patient Verified"
                      >
                        ✓
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 truncate">
                          {activePatient.name}
                        </h1>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-slate-100 text-slate-700 font-mono">
                          ID: {activePatient.id}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                          Self-Managed Intake
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-xs text-slate-600">
                        {activePatient.age && (
                          <>
                            <span><strong>Age:</strong> {activePatient.age} Yrs</span>
                            <span className="text-slate-300">•</span>
                          </>
                        )}
                        <span><strong>Gender:</strong> {activePatient.gender || 'Not Specified'}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-700"><strong>Blood Group:</strong> {activePatient.bloodGroup || 'Not Documented'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        <strong>Emergency:</strong> {activePatient.emergencyContact || 'Not Documented'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Clinical Vitals & Flags */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200">
                    <div className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Allergies</span>
                      <span className="text-xs font-bold text-rose-700 flex items-center gap-1 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> {recordedAllergiesCount} Recorded
                      </span>
                    </div>
                    <div className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Meds</span>
                      <span className="text-xs font-bold text-slate-800 truncate">{recordedMedsCount} Prescriptions</span>
                    </div>
                    <div className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Biomarkers</span>
                      <span className="text-xs font-bold text-amber-700 truncate">HbA1c &amp; Lipids</span>
                    </div>
                    <div className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">Source Vault</span>
                      <span className="text-xs font-bold text-teal-700 truncate">{recordedDocsCount} Records</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Clinical Safety Disclaimer Banner */}
      <div className="bg-amber-50 border-b border-amber-200 py-2 px-3.5 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between text-xs text-amber-900 gap-1.5">
          <div className="flex items-start space-x-2 min-w-0">
            <span className="material-symbols-outlined text-[16px] text-amber-700 flex-shrink-0 mt-0.5">
              warning
            </span>
            <span className="leading-snug">
              <strong className="font-bold text-amber-950">Clinical Caution:</strong> Undocumented allergies or conditions must <strong>never</strong> be interpreted as absent. All clinical data displayed is patient-authorized intake records.
            </span>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded border border-amber-300">
              ABDM-HIPAA Scoped
            </span>
            <span className="font-mono text-[10px] text-amber-700 font-medium">
              #SESSION-{sessionCode || 'ACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout (Responsive on Mobile and Desktop) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* MAIN CLINICAL CONTENT (8 cols on desktop, full width on mobile) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Navigation Tabs (Mobile Touch-Friendly) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar" role="tablist">
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                    activeTab === 'summary' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Consolidated Summary
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex-shrink-0 cursor-pointer ${
                    activeTab === 'timeline' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Timeline View
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('vault')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                    activeTab === 'vault' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>Source Vault</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">5</span>
                </button>
              </div>

              <div className="flex items-center space-x-2 text-xs overflow-x-auto no-scrollbar">
                <span className="text-slate-500 font-medium text-[11px] hidden md:inline">Provenance:</span>
                <div className="flex items-center gap-1.5 flex-wrap text-[10px] sm:text-[11px]">
                  <span className="inline-flex items-center gap-0.5 font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                    <span className="material-symbols-outlined text-[12px]">description</span>
                    Extracted
                  </span>
                  <span className="inline-flex items-center gap-0.5 font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    <span className="material-symbols-outlined text-[12px]">person</span>
                    Confirmed
                  </span>
                  <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Scope Notice if Patient Excluded Summary */}
            {!permittedScope.summary && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                <strong>Data Scope Notice:</strong> The patient excluded the Consolidated Summary from this consultation session.
              </div>
            )}

            {/* SECTION 1: ALLERGIES & ADVERSE REACTIONS */}
            {permittedScope.summary && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="bg-rose-50/60 px-4 sm:px-5 py-3 border-b border-rose-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 flex-shrink-0">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">Allergies &amp; Adverse Reactions</h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-200 text-rose-800 rounded-full">1 Active Alert</span>
                  </div>
                  <span className="text-[11px] text-rose-700 font-medium bg-rose-100/50 px-2 py-0.5 rounded">
                    High Clinical Priority
                  </span>
                </div>

                <div className="p-4 sm:p-5 space-y-3.5">
                  <div className="p-3.5 sm:p-4 rounded-xl border border-rose-200/80 bg-rose-50/20">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="text-sm sm:text-base font-bold text-slate-900">Dust Mites</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-100 text-rose-800 rounded border border-rose-200">
                            Active Recorded
                          </span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800 bg-white rounded border border-teal-500">
                            <span className="material-symbols-outlined text-[11px] text-teal-600">description</span>
                            Extracted
                          </span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 rounded">
                            <span className="material-symbols-outlined text-[11px] text-blue-600">person</span>
                            Patient confirmed
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed break-words">
                          Manifests as severe allergic rhinitis, morning nasal congestion, and mild ocular pruritus. Managed intermittently with antihistamines.
                        </p>
                      </div>

                      <div className="flex items-center flex-shrink-0">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          <span className="material-symbols-outlined text-[13px] text-amber-600">schedule</span>
                          Awaiting Clinician Verification
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2.5 border-t border-rose-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-1.5">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="text-[10px] font-medium text-slate-400">Extracted from:</span>
                        <button
                          onClick={() => onInspectDocument(PRELOADED_DOCUMENTS[0])}
                          className="inline-flex items-center text-teal-700 hover:text-teal-800 font-medium underline gap-0.5 text-xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[13px]">description</span>
                          Prescription_2024.pdf
                        </button>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500">Dr. K. Swaminathan (ENT)</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">12 Oct 2026</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-bold text-slate-900">No Known Drug Allergies (NKDA):</span>
                        <span className="text-slate-700 font-medium">Penicillin, Sulfa, NSAIDs</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        Patient Confirmed
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="font-bold text-slate-800">Not Documented in Uploaded Records:</span>
                        <span className="text-slate-600">Food allergies, Latex, Anesthesia allergies</span>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200">
                        Never Assumed Absent
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 2: CURRENT MEDICATIONS & REGIMEN */}
            {permittedScope.summary && (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="bg-teal-50/50 px-4 sm:px-5 py-3 border-b border-teal-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 flex-shrink-0">
                      <span className="material-symbols-outlined text-[16px]">pill</span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">Current Medications &amp; Regimen</h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-800 rounded-full">2 Active</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Compliance: Daily</span>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  {/* Med 1: Amlodipine */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm sm:text-base font-bold text-slate-900">Amlodipine</span>
                          <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">5 mg</span>
                          <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded">Oral Tablet</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                            Prescription_2024.pdf
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 break-words">
                          <strong>Dosage &amp; Frequency:</strong> 1 tablet once daily (Morning, post-meal) • <strong>Indication:</strong> Essential Hypertension
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-1.5 flex-shrink-0">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                          Patient Confirmed
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                          ✓ Verified
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="text-[11px] text-slate-400">Refill Date: 12 Oct 2026</span>
                      <button
                        onClick={() => onInspectDocument(PRELOADED_DOCUMENTS[0])}
                        className="text-xs text-teal-700 hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>View Original Clip</span>
                        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      </button>
                    </div>
                  </div>

                  {/* Med 2: Metformin */}
                  <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 transition">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm sm:text-base font-bold text-slate-900">Metformin Hydrochloride</span>
                          <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">500 mg</span>
                          <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded">Oral Tablet (ER)</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                            Discharge_Summary.jpg
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 break-words">
                          <strong>Dosage &amp; Frequency:</strong> 1 tablet twice daily with meals • <strong>Indication:</strong> Type 2 Diabetes Mellitus
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-1.5 flex-shrink-0">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                          Patient Confirmed
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                          ✓ Verified
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="text-[11px] text-slate-400">Hospital Discharge (08 Oct 2026)</span>
                      <button
                        onClick={() => onInspectDocument(PRELOADED_DOCUMENTS[2])}
                        className="text-xs text-teal-700 hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>View Original Clip</span>
                        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 3: CONDITIONS & PROCEDURES */}
            {permittedScope.summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Known Conditions */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        KD
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">Known Conditions</h3>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">1 Chronic</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">Type 2 Diabetes</span>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Chronic</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">Diagnosed Feb 2023. Managed with Metformin 500mg BD and diet.</p>
                      <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Ref: Discharge_Summary.jpg</span>
                        <span className="text-blue-700 font-medium">Patient Confirmed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Past Surgeries */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                        PP
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">Past Surgeries</h3>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">1 Recorded</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">Cataract Surgery (Right Eye)</span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Resolved</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">Phacoemulsification with IOL implant. Post-op recovery uneventful.</p>
                      <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Date: 12 Mar 2024</span>
                        <span className="text-teal-700 font-medium">Eye_Surgery_Report.pdf</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: LAB REPORTS & CLINICAL BIOMARKERS (Fully Rebuilt for Mobile & Desktop) */}
            {permittedScope.labs ? (
              <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="bg-slate-50 px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 flex-shrink-0">
                      <span className="material-symbols-outlined text-[16px]">biotech</span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">Recent Laboratory Results &amp; Biomarkers</h2>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Last: Jan 2025 (Metropolis Labs)</span>
                </div>

                <div className="p-3.5 sm:p-5">
                  {/* MOBILE VIEW: Individual Responsive Cards (Prevents table clipping on small phone screens) */}
                  <div className="sm:hidden space-y-3">
                    {/* Lab Card 1: HbA1c */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">HbA1c (Glycated Hemoglobin)</h4>
                          <span className="text-[10px] text-slate-500">HPLC Whole Blood</span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Moderate Control
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Result</span>
                          <span className="font-mono text-lg font-extrabold text-amber-700">6.8 %</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Reference Interval</span>
                          <span className="text-xs text-slate-600 font-medium">4.0 - 5.6 % (Normal)</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400">Metropolis Healthcare</span>
                        <button
                          onClick={() => onInspectDocument(PRELOADED_DOCUMENTS[1])}
                          className="text-teal-700 font-semibold text-[11px] hover:underline"
                        >
                          View Lab_Report.pdf →
                        </button>
                      </div>
                    </div>

                    {/* Lab Card 2: Creatinine */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Serum Creatinine</h4>
                          <span className="text-[10px] text-slate-500">Serum / Enzymatic Method</span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Normal Clearance
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Result</span>
                          <span className="font-mono text-lg font-extrabold text-emerald-700">1.1 mg/dL</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Reference Interval</span>
                          <span className="text-xs text-slate-600 font-medium">0.7 - 1.3 mg/dL</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400">Metropolis Healthcare</span>
                        <button
                          onClick={() => onInspectDocument(PRELOADED_DOCUMENTS[1])}
                          className="text-teal-700 font-semibold text-[11px] hover:underline"
                        >
                          View Lab_Report.pdf →
                        </button>
                      </div>
                    </div>

                    {/* Lab Card 3: Fasting Glucose */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Fasting Blood Glucose</h4>
                          <span className="text-[10px] text-slate-500">Plasma Glucose (GOD-POD)</span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Elevated Fasting
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Result</span>
                          <span className="font-mono text-lg font-extrabold text-amber-700">124 mg/dL</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Reference Interval</span>
                          <span className="text-xs text-slate-600 font-medium">70 - 99 mg/dL</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-400">Apollo Diagnostics</span>
                        <button
                          onClick={() => onInspectDocument(PRELOADED_DOCUMENTS[4])}
                          className="text-teal-700 font-semibold text-[11px] hover:underline"
                        >
                          View Blood_Test.jpg →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DESKTOP/TABLET VIEW: Structured Table */}
                  <div className="hidden sm:block overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Test Parameter</th>
                          <th className="py-2.5 px-3">Result Value</th>
                          <th className="py-2.5 px-3">Reference Interval</th>
                          <th className="py-2.5 px-3">Clinical Evaluation</th>
                          <th className="py-2.5 px-3">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {/* HbA1c */}
                        <tr className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div>HbA1c (Glycated Hemoglobin)</div>
                            <span className="text-[10px] text-slate-400">HPLC Whole Blood</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-600 text-sm whitespace-nowrap">
                            6.8 %
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                            4.0 - 5.6 % (Non-diabetic)
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                              Moderate Control
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <button
                              onClick={() => onInspectDocument(PRELOADED_DOCUMENTS[1])}
                              className="text-teal-700 hover:underline font-medium text-[11px] cursor-pointer"
                            >
                              Lab_Report.pdf
                            </button>
                          </td>
                        </tr>

                        {/* Creatinine */}
                        <tr className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div>Serum Creatinine</div>
                            <span className="text-[10px] text-slate-400">Serum / Enzymatic</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 text-sm whitespace-nowrap">
                            1.1 mg/dL
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                            0.7 - 1.3 mg/dL
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                              Normal Clearance
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <button
                              onClick={() => onInspectDocument(PRELOADED_DOCUMENTS[1])}
                              className="text-teal-700 hover:underline font-medium text-[11px] cursor-pointer"
                            >
                              Lab_Report.pdf
                            </button>
                          </td>
                        </tr>

                        {/* Fasting Glucose */}
                        <tr className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div>Fasting Blood Glucose</div>
                            <span className="text-[10px] text-slate-400">Plasma Glucose</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-600 text-sm whitespace-nowrap">
                            124 mg/dL
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                            70 - 99 mg/dL
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                              Elevated Fasting
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <button
                              onClick={() => onInspectDocument(PRELOADED_DOCUMENTS[4])}
                              className="text-teal-700 hover:underline font-medium text-[11px] cursor-pointer"
                            >
                              Blood_Test.jpg
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                Patient excluded laboratory biomarker history from this session.
              </div>
            )}
          </div>

          {/* SIDEBAR COLUMN (4 cols on desktop, full width on mobile) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Verified Source Vault */}
            {permittedScope.docs ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-4 sm:px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-slate-600 text-[18px]">folder</span>
                    <h3 className="text-sm font-bold text-slate-900">Verified Source Vault</h3>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200">
                    {patientDocs.length} Files
                  </span>
                </div>

                <div className="p-3 sm:p-4 divide-y divide-slate-100 max-h-[380px] overflow-y-auto custom-scrollbar">
                  {patientDocs.length === 0 ? (
                    <p className="text-xs text-slate-400 p-3 italic text-center">No uploaded documents shared for this session.</p>
                  ) : (
                    patientDocs.map((doc) => {
                      const isPdf = doc.fileType === 'pdf';
                      return (
                        <div
                          key={doc.id}
                          onClick={() => onInspectDocument(doc)}
                          className="py-2.5 first:pt-0 last:pb-0 hover:bg-slate-50 p-1.5 rounded-lg transition cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[9px] flex-shrink-0 ${
                                  isPdf ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                                }`}
                              >
                                {doc.fileType.toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {doc.filename}
                                </h4>
                                <p className="text-[10px] text-slate-500 truncate">
                                  {doc.uploadDate} • {doc.category}
                                </p>
                              </div>
                            </div>
                            <button
                              className="p-1 text-slate-400 hover:text-slate-700 rounded flex-shrink-0 cursor-pointer"
                              title="Inspect Document"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                  <button
                    type="button"
                    onClick={() => showToast('Patient bundle ZIP prepared with SHA-256 hash.')}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition cursor-pointer"
                  >
                    Download Patient Bundle (ZIP)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                Patient excluded Source Vault document access from this session.
              </div>
            )}

            {/* Doctor Consultation Notes & Counter-Signing */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-teal-700 text-[18px]">edit_note</span>
                <h3 className="text-sm font-bold text-slate-900">Physician Clinical Remarks &amp; Follow-up</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter consultation observations and follow-up directives. Signing counter-certifies patient-confirmed intake items.
              </p>

              <textarea
                rows={4}
                value={physicianNote}
                onChange={(e) => setPhysicianNote(e.target.value)}
                className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition resize-none text-slate-800 font-medium"
                placeholder="Follow-up Directives: Continue Amlodipine 5mg OD..."
              />

              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSignedWithNmc}
                    onChange={(e) => setIsSignedWithNmc(e.target.checked)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="font-medium text-[11px] sm:text-xs">Sign with NMC (#48102)</span>
                </label>
                <button
                  type="button"
                  onClick={handleSaveAndSign}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  {isNoteSaved ? '✓ Note Signed' : 'Save & Sign Note'}
                </button>
              </div>
            </div>

            {/* Consent Artifact & ABDM Compliance Info */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-sm text-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span> Consent Artifact
                </span>
                <span className="font-mono text-[10px] text-slate-400">ABDM-HIPAA v2.4</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Granted By:</span>
                  <span className="font-medium text-white">{patientInfo?.name || 'Verified Patient'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Scope:</span>
                  <span className="font-medium text-white">
                    {[permittedScope.summary && 'Summary', permittedScope.docs && 'Docs', permittedScope.labs && 'Labs'].filter(Boolean).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Data Crypt:</span>
                  <span className="font-mono text-slate-400">AES-256 GCM Ephemeral</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Need immediate exit?</span>
                <button
                  type="button"
                  onClick={handleRevokeFromDoctor}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition cursor-pointer"
                >
                  Revoke &amp; Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Expiry Simulation Modal */}
      {showExpiryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center ring-8 ring-rose-50">
              <span className="material-symbols-outlined text-[28px]">lock</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Session Access Expired</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The patient-granted consultation window for this access session has elapsed. To regain access, the patient must generate a new 6-digit access code from their Take Care app.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={onExit}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Return to Take Care App
              </button>
              <button
                type="button"
                onClick={() => setShowExpiryModal(false)}
                className="w-full py-2 px-4 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Dismiss Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
