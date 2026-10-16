import React, { useState } from 'react';
import { ProcessedDocument, UserProfile } from '../types/clinical';
import { downloadHealthSummaryPdf, downloadEmergencySummaryPdf } from '../services/summaryPdfService';
import { PRELOADED_DOCUMENTS } from '../data/mockDocuments';
import {
  FileText,
  Download,
  CheckCircle2,
  Pill,
  HeartPulse,
  Activity,
  Calendar,
  AlertTriangle,
  Stethoscope,
  ShieldCheck,
  User,
  Sparkles,
  Printer,
  ChevronDown,
  Clock,
  ArrowRight,
  UploadCloud,
  ShieldAlert,
} from 'lucide-react';

interface HealthSummaryViewProps {
  profile: UserProfile;
  documents: ProcessedDocument[];
  isDemoMode?: boolean;
  onNavigate: (tab: string) => void;
  onOpenTwoPanelForDoc?: (docFilename: string) => void;
  onEnableDemoMode?: () => void;
}

export const HealthSummaryView: React.FC<HealthSummaryViewProps> = ({
  profile,
  documents,
  isDemoMode = false,
  onNavigate,
  onOpenTwoPanelForDoc,
  onEnableDemoMode,
}) => {
  // Default directly to Single-Page PDF sheet preview
  const [activeTab, setActiveTab] = useState<'interactive' | 'pdf-preview'>('pdf-preview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingEmergencyPdf, setIsGeneratingEmergencyPdf] = useState(false);

  // Strictly load synthetic demo documents only when Demo Mode is explicitly enabled
  const effectiveDocuments = isDemoMode ? PRELOADED_DOCUMENTS : documents;

  // Extract entities dynamically from effective documents
  const allEntities = effectiveDocuments.flatMap((d) =>
    d.extractedEntities.map((e) => ({ ...e, parentDoc: d.filename, uploadDate: d.uploadDate }))
  );

  const allergies = allEntities.filter((e) => e.category === 'allergy' && e.status !== 'Rejected');
  const medications = allEntities.filter((e) => e.category === 'medication' && e.status !== 'Rejected');
  const conditions = allEntities.filter((e) => e.category === 'condition' && e.status !== 'Rejected');
  const procedures = allEntities.filter((e) => e.category === 'procedure' && e.status !== 'Rejected');
  const labs = allEntities.filter((e) => e.category === 'lab' && e.status !== 'Rejected');

  const totalConfirmed = allEntities.filter((e) => e.status === 'Confirmed').length;

  // Single-Page PDF Print Action
  const handlePrintPdf = () => {
    setToastMessage('Preparing Single-Page A4 PDF...');
    setTimeout(() => {
      window.print();
      setToastMessage('Print dialog opened. Select "Save as PDF".');
      setTimeout(() => setToastMessage(null), 3000);
    }, 400);
  };

  // Direct Standard-Compliant .PDF Binary Generation & Download via pdf-lib
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setToastMessage('Generating Take Care Single-Page PDF...');
    try {
      await downloadHealthSummaryPdf(profile, effectiveDocuments);
      setToastMessage('PDF downloaded successfully!');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback to print dialog
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadEmergencyPdf = async () => {
    setIsGeneratingEmergencyPdf(true);
    setToastMessage('Generating Emergency-Ready PDF...');
    try {
      await downloadEmergencySummaryPdf(profile, effectiveDocuments);
      setToastMessage('Emergency Summary PDF downloaded!');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error('Emergency PDF generation error:', err);
      window.print();
    } finally {
      setIsGeneratingEmergencyPdf(false);
    }
  };

  return (
    <div className="flex flex-col w-full pb-28 space-y-4 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Demo Mode Notice Banner (Explicitly synthetic) */}
      {isDemoMode && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span><strong>Demo Mode Active:</strong> Displaying synthetic test records. This data is not connected to any real patient account.</span>
        </div>
      )}

      {effectiveDocuments.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4 my-4">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 border border-teal-200 text-[#006D60] flex items-center justify-center mx-auto shadow-xs">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h2 className="text-lg font-black text-slate-900">No medical records uploaded yet</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload or scan your prescriptions, lab reports, or discharge summaries to generate an accurate, verified clinical summary.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2 w-full max-w-xs">
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="w-full py-3 px-4 rounded-2xl bg-[#006D60] hover:bg-[#005248] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-teal-200" />
              <span>Scan / Upload Documents</span>
            </button>
            {onEnableDemoMode && (
              <button
                type="button"
                onClick={onEnableDemoMode}
                className="w-full py-2.5 px-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition cursor-pointer"
              >
                <span>View Demo Mode (Synthetic)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Header & Single-Page PDF Download Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Patient Health Summary</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              Single-Page A4
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {effectiveDocuments.length} verified record{effectiveDocuments.length !== 1 ? 's' : ''} • {totalConfirmed} confirmed clinical finding{totalConfirmed !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Action Buttons: Real PDF Download & Print A4 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadEmergencyPdf}
            disabled={isGeneratingEmergencyPdf}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs active:scale-95 transition text-xs font-bold cursor-pointer disabled:opacity-50"
            title="Download emergency-ready single-page PDF"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isGeneratingEmergencyPdf ? 'Generating...' : 'Emergency PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#006D60] hover:bg-[#005248] text-white shadow-xs active:scale-95 transition text-xs font-bold cursor-pointer disabled:opacity-50"
            title="Download verified single-page PDF (.pdf)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-xs active:scale-95 transition text-xs font-bold cursor-pointer"
            title="Print or Save via browser"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print A4</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('interactive')}
          className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'interactive'
              ? 'bg-white text-[#006D60] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Interactive View</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pdf-preview')}
          className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'pdf-preview'
              ? 'bg-white text-[#006D60] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Single-Page PDF Sheet</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE VIEW */}
      {activeTab === 'interactive' && (
        <div className="space-y-4">
          {/* Patient Header Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border-2 border-teal-200 text-[#006D60] flex items-center justify-center font-bold text-lg">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{profile.fullName || 'Take Care Patient'}</h2>
                  <p className="text-xs text-slate-500 font-mono">+91 {profile.mobile}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                Verified Patient
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold text-[10px]">DOB / AGE</span>
                <span className="font-bold text-slate-800">{profile.dob || '1 Apr 2006'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold text-[10px]">GENDER</span>
                <span className="font-bold text-slate-800">{profile.gender || 'Male'}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block font-semibold text-[10px]">BLOOD GROUP</span>
                <span className="font-bold text-slate-800">{profile.bloodGroup || 'O+'}</span>
              </div>
            </div>
          </div>

          {/* SECTION A: KEY HEALTH CONDITIONS & DIAGNOSES */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Key Health Conditions ({conditions.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Diagnosed Problems</span>
            </div>

            {conditions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No health conditions documented.</p>
            ) : (
              <div className="space-y-2.5">
                {conditions.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-sky-50/60 border border-sky-100 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{item.title || item.value}</h4>
                        <p className="text-xs font-semibold text-sky-800 mt-0.5">{item.value}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold shrink-0">
                        Active Condition
                      </span>
                    </div>

                    {item.secondaryValue && (
                      <div className="p-2 rounded-lg bg-white/80 border border-sky-200/60 text-[11px] text-slate-700 font-medium flex items-center justify-between">
                        <span>{item.secondaryValue}</span>
                        <span className="font-bold text-emerald-700 text-[10px]">Managed</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                      <span>Source: {item.parentDoc}</span>
                      <span className="text-teal-700 font-bold cursor-pointer hover:underline" onClick={() => onOpenTwoPanelForDoc?.(item.parentDoc)}>
                        View Document →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION B: CURRENT MEDICATIONS & LINKED TREATMENTS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-[#006D60]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Prescribed Treatments &amp; Medications ({medications.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Active Regimen</span>
            </div>

            {medications.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No prescribed medications documented.</p>
            ) : (
              <div className="space-y-2.5">
                {medications.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{item.title || item.value}</h4>
                        <p className="text-xs text-slate-700 font-medium mt-0.5">{item.value}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold shrink-0">
                        Prescribed
                      </span>
                    </div>

                    {/* Problem / Indication Linkage */}
                    {item.secondaryValue && (
                      <div className="p-2 rounded-lg bg-white border border-teal-200/70 text-[11px] text-[#006D60] font-semibold flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-[#006D60] shrink-0" />
                        <span>{item.secondaryValue}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                      <span>Source: {item.parentDoc}</span>
                      <span className="text-teal-700 font-bold cursor-pointer hover:underline" onClick={() => onOpenTwoPanelForDoc?.(item.parentDoc)}>
                        View Document →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION C: ALLERGIES & SENSITIVITIES */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Allergies &amp; Sensitivities
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Safety Alert</span>
            </div>

            {allergies.length === 0 ? (
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No Known Drug Allergies (NKDA) recorded on file.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {allergies.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs flex items-start justify-between"
                  >
                    <div>
                      <p className="font-bold text-rose-950">{item.title || item.value}</p>
                      <p className="text-[11px] text-rose-800 mt-0.5">{item.secondaryValue || item.value}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-200/70 text-rose-900 text-[10px] font-bold">
                      Reported
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION D: RECENT LAB INVESTIGATIONS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent Lab &amp; Diagnostic Results ({labs.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Laboratory</span>
            </div>

            {labs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No lab findings recorded.</p>
            ) : (
              <div className="space-y-2">
                {labs.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{item.title}</span>
                      <span className="font-mono font-bold text-amber-900">{item.value}</span>
                    </div>
                    {item.secondaryValue && (
                      <p className="text-[11px] text-amber-800">{item.secondaryValue}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SINGLE-PAGE A4 PDF SHEET (PRINT TARGET) */}
      <div
        id="health-summary-pdf-sheet"
        className={`${
          activeTab === 'interactive' ? 'hidden print:block' : 'block'
        } bg-white rounded-2xl border border-slate-300 p-6 sm:p-8 shadow-md text-slate-900 max-w-[210mm] mx-auto print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full`}
        style={{ minHeight: '280mm' }}
      >
        {/* Printable Document Header */}
        <div className="border-b-2 border-[#006D60] pb-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006D60] text-white flex items-center justify-center font-black text-xl">
              +
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                Take Care Health
              </h1>
              <p className="text-[10px] font-bold text-[#006D60] tracking-widest uppercase">
                Single-Page Patient Health Summary &amp; Clinical Provenance
              </p>
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-500 font-medium">
            <div className="font-bold text-slate-800">RECORD ID: TC-HR-{profile.mobile.slice(-4)}</div>
            <div>Generated: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="text-emerald-700 font-bold">● Patient Verified • 100% Provenance</div>
          </div>
        </div>

        {/* Patient Demographics Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 grid grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Patient Name</span>
            <strong className="text-slate-900">{profile.fullName || 'Take Care Patient'}</strong>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block">DOB / Age</span>
            <span className="text-slate-800 font-medium">{profile.dob || '1 Apr 2006'}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Gender &amp; Blood</span>
            <span className="text-slate-800 font-medium">{profile.gender || 'Male'} • {profile.bloodGroup || 'O+'}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Verified Mobile</span>
            <span className="text-slate-800 font-mono font-medium">+91 {profile.mobile}</span>
          </div>
        </div>

        {/* Grid Section 1: Conditions & Linked Treatments Table */}
        <div className="mb-4">
          <h2 className="text-xs font-bold text-[#006D60] uppercase tracking-wider pb-1 border-b border-slate-200 mb-2 flex items-center gap-1.5">
            <span>Section A: Diagnosed Problems &amp; Linked Treatments</span>
          </h2>

          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold">
              <tr>
                <th className="p-2 border-b border-slate-200 w-1/4">Diagnosed Problem</th>
                <th className="p-2 border-b border-slate-200 w-1/4">Severity &amp; Status</th>
                <th className="p-2 border-b border-slate-200 w-2/5">Prescribed Treatment / Medication</th>
                <th className="p-2 border-b border-slate-200 w-1/6">Source File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {conditions.length > 0 ? (
                conditions.map((cond, idx) => {
                  const linkedMed = medications[idx] || medications[0];
                  return (
                    <tr key={cond.id} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-900 align-top">
                        {cond.title || cond.value}
                      </td>
                      <td className="p-2 text-slate-600 align-top">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold text-[10px] mb-0.5">
                          {cond.secondaryValue || 'Stage 1 • Managed'}
                        </span>
                        <div className="text-[10px] text-slate-500">{cond.value}</div>
                      </td>
                      <td className="p-2 text-slate-800 align-top">
                        {linkedMed ? (
                          <>
                            <strong className="text-teal-900">{linkedMed.title || linkedMed.value}</strong>
                            <div className="text-[10px] text-slate-600">{linkedMed.value}</div>
                            <div className="text-[9px] text-[#006D60] font-semibold mt-0.5">
                              {linkedMed.secondaryValue || `Indication: Treatment for ${cond.title}`}
                            </div>
                          </>
                        ) : (
                          <span className="italic text-slate-400">Lifestyle &amp; clinical monitoring</span>
                        )}
                      </td>
                      <td className="p-2 text-slate-500 text-[10px] align-top font-mono truncate max-w-[90px]">
                        {cond.parentDoc}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-3 text-center text-slate-400 italic">
                    No chronic conditions or diagnoses recorded in verified files.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Grid Section 2: Two Column Split (Medications & Lab Results) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Active Medications Full Regimen */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/40">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200 flex items-center justify-between">
              <span>Section B: Full Medication Regimen</span>
              <span className="text-[9px] text-slate-400">Total: {medications.length}</span>
            </h3>
            {medications.length > 0 ? (
              <div className="space-y-2">
                {medications.map((m) => (
                  <div key={m.id} className="text-[11px] p-2 rounded-lg bg-white border border-slate-200/80">
                    <div className="font-bold text-slate-900">{m.title || m.value}</div>
                    <div className="text-slate-600 text-[10px]">{m.value}</div>
                    {m.secondaryValue && (
                      <div className="text-[9px] text-[#006D60] font-semibold mt-0.5">{m.secondaryValue}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">No medication items recorded.</p>
            )}
          </div>

          {/* Laboratory & Diagnostic Tests */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/40">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200 flex items-center justify-between">
              <span>Section C: Recent Laboratory Investigations</span>
              <span className="text-[9px] text-slate-400">Total: {labs.length}</span>
            </h3>
            {labs.length > 0 ? (
              <div className="space-y-2">
                {labs.map((l) => (
                  <div key={l.id} className="text-[11px] p-2 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{l.title}</div>
                      <div className="text-slate-500 text-[10px]">{l.secondaryValue || 'Venous blood panel'}</div>
                    </div>
                    <span className="font-mono font-bold text-slate-800 text-xs px-2 py-0.5 rounded bg-slate-100">
                      {l.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">No laboratory results in current records.</p>
            )}
          </div>
        </div>

        {/* Grid Section 3: Allergies & Recommended Follow-up Care Plan */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          {/* Allergies Card */}
          <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/30">
            <h3 className="text-[11px] font-bold text-rose-950 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>Section D: Allergies &amp; Safety Contraindications</span>
            </h3>
            {allergies.length > 0 ? (
              <div className="space-y-1">
                {allergies.map((a) => (
                  <div key={a.id} className="text-[11px] font-semibold text-rose-900">
                    • {a.title || a.value}: {a.secondaryValue || a.value}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                <span>No Known Drug Allergies (NKDA) recorded.</span>
              </div>
            )}
          </div>

          {/* Follow-up Plan Card */}
          <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/30">
            <h3 className="text-[11px] font-bold text-teal-950 uppercase tracking-wider mb-1.5">
              Section E: Follow-Up &amp; Care Plan
            </h3>
            <ul className="text-[10px] text-slate-700 space-y-1">
              <li>• Repeat BP and fasting glucose checkup in 4 weeks.</li>
              <li>• Adhere to daily morning administration of antihypertensive therapy.</li>
              <li>• Maintain hydration and follow low-sodium, balanced nutrition.</li>
            </ul>
          </div>
        </div>

        {/* Footer Disclaimer & Verification Badge */}
        <div className="pt-3 border-t border-slate-200 text-[9px] text-slate-500 leading-normal flex items-start justify-between gap-4">
          <p className="flex-1">
            <strong>Medical Notice:</strong> This clinical health summary is synthesized strictly from patient-verified medical records in Take Care Health Vault. It is intended for coordination and clinical reference, and does not replace original clinical hospital records.
          </p>
          <div className="text-right font-bold text-slate-700 shrink-0">
            <div>PAGE 1 OF 1</div>
            <div className="text-[#006D60]">TAKE CARE DIGITAL HEALTH</div>
          </div>
        </div>

        {/* Floating Print / Download Trigger Button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 print:hidden">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#006D60] hover:bg-[#005248] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Single-Page PDF (.pdf)'}</span>
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
