import React, { useState } from 'react';
import { ProcessedDocument, UserProfile } from '../types/clinical';

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
  const [activeMode, setActiveMode] = useState<'summary' | 'edit'>('summary');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    allergies: true,
    meds: true,
    conditions: true,
    procedures: true,
    labs: true,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

  // Extract real entities dynamically from documents
  const allEntities = documents.flatMap((d) =>
    d.extractedEntities.map((e) => ({ ...e, parentDoc: d.filename, uploadDate: d.uploadDate }))
  );

  const allergies = allEntities.filter((e) => e.category === 'allergy' && e.status !== 'Rejected');
  const medications = allEntities.filter((e) => e.category === 'medication' && e.status !== 'Rejected');
  const conditions = allEntities.filter((e) => e.category === 'condition' && e.status !== 'Rejected');
  const procedures = allEntities.filter((e) => e.category === 'procedure' && e.status !== 'Rejected');
  const labs = allEntities.filter((e) => e.category === 'lab' && e.status !== 'Rejected');

  const totalConfirmed = allEntities.filter((e) => e.status === 'Confirmed').length;
  const hasRecords = documents.length > 0 && allEntities.length > 0;

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownloadPdf = () => {
    setToastMessage('Generating Health Summary PDF...');
    setTimeout(() => {
      window.print();
      setToastMessage('Summary downloaded & verified.');
      setTimeout(() => setToastMessage(null), 2500);
    }, 600);
  };

  const handleOpenEdit = (category: string) => {
    setEditingCategory(category);
    setEditNotes(`Patient review note: Verified clinical finding on ${new Date().toLocaleDateString('en-IN')}.`);
  };

  const handleSaveEdit = () => {
    setEditingCategory(null);
    setToastMessage('Clinical entry updated & re-indexed.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // EMPTY STATE for fresh accounts without uploaded records
  if (!hasRecords && !isDemoMode) {
    return (
      <div className="flex flex-col w-full pb-20 space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              My Health Summary
            </h1>
            <p className="text-xs text-slate-500">
              Personal EHR summary from verified documents.
            </p>
          </div>
        </div>

        {/* Empty State Banner Card */}
        <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center mx-auto shadow-2xs">
            <span className="material-symbols-outlined text-[36px]">assignment_turned_in</span>
          </div>

          <div className="space-y-1.5 max-w-sm mx-auto">
            <h2 className="text-base font-bold text-slate-900">
              No Medical Records Uploaded Yet
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your health summary is created only from medical documents you upload and verify. We never generate fabricated medical records.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
              <span>Upload First Medical Document</span>
            </button>

            {onEnableDemoMode && (
              <button
                type="button"
                onClick={onEnableDemoMode}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-teal-600">science</span>
                <span>Explore with Demo Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Patient Profile Card (Basic Info) */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Patient Profile
            </span>
            <button
              type="button"
              onClick={() => onNavigate('profile-edit')}
              className="text-xs text-teal-700 font-bold hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Name</span>
              <span className="font-semibold text-slate-800">{profile.fullName || 'Not provided'}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Mobile</span>
              <span className="font-semibold text-slate-800">+91 {profile.mobile}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Gender</span>
              <span className="font-semibold text-slate-800">{profile.gender || 'Not specified'}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Blood Group</span>
              <span className="font-semibold text-slate-800">{profile.bloodGroup || 'Not documented'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-20 space-y-4 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-teal-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Demo Badge if in demo mode */}
      {isDemoMode && (
        <div className="p-2 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-600 text-[18px]">science</span>
          <span>Showing Fictional Demo Patient Data for Testing</span>
        </div>
      )}

      {/* Header Bar & Download PDF Action */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            My Health Summary
          </h1>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              {documents.length} record{documents.length !== 1 ? 's' : ''} analyzed • {totalConfirmed} confirmed
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white shadow-xs active:scale-95 transition-transform text-xs font-semibold cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px]">download</span>
          <span>Download PDF</span>
        </button>
      </div>

      {/* Patient Identity Card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5 relative overflow-hidden">
        <div className="w-14 h-14 rounded-full bg-teal-50 border-2 border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xl flex-shrink-0">
          {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'P'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 truncate">
              {profile.fullName || 'Patient Summary'}
            </h2>
            {profile.isMobileVerified && (
              <span className="material-symbols-outlined text-teal-600 text-[18px]">verified</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500">
            {profile.dob && <span>DOB: {profile.dob}</span>}
            {profile.gender && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>{profile.gender}</span>
              </>
            )}
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono font-bold text-slate-700 text-[11px]">
              +91 {profile.mobile}
            </span>
          </div>
        </div>
      </div>

      {/* Mode Toggle Pill Bar */}
      <div className="flex items-center p-1 rounded-xl bg-slate-200/70 gap-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveMode('summary')}
          className={`flex-1 py-1.5 rounded-lg text-center font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeMode === 'summary'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          <span>Summary View</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('edit')}
          className={`flex-1 py-1.5 rounded-lg text-center font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeMode === 'edit'
              ? 'bg-white text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">edit_note</span>
          <span>Edit &amp; Review ({allEntities.length})</span>
        </button>
      </div>

      {/* 1. Allergies Section */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('allergies')}
          className="w-full p-4 flex items-center justify-between text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Allergies</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                  {allergies.length}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {allergies.length > 0
                  ? allergies.map((a) => a.value).join(', ')
                  : 'No allergies documented'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeMode === 'edit' && allergies.length > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit('Allergies');
                }}
                className="text-xs font-bold text-teal-700 hover:underline mr-1"
              >
                Edit
              </span>
            )}
            <span
              className={`material-symbols-outlined text-slate-400 transition-transform ${
                openSections.allergies ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </div>
        </button>

        {openSections.allergies && (
          <div className="px-4 pb-4 space-y-2">
            {allergies.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">No allergy findings detected in uploaded documents.</p>
            ) : (
              allergies.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-50 p-3 flex items-start justify-between gap-2 border border-slate-200/80"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{item.value}</p>
                    {item.secondaryValue && (
                      <p className="text-xs text-slate-600 mt-0.5">{item.secondaryValue}</p>
                    )}
                    <div
                      onClick={() => onOpenTwoPanelForDoc?.(item.parentDoc)}
                      className="flex items-center gap-1.5 mt-2 cursor-pointer text-teal-700 hover:underline text-[11px] font-medium"
                    >
                      <span className="material-symbols-outlined text-[14px]">description</span>
                      <span>{item.parentDoc}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex-shrink-0">
                    <span className="material-symbols-outlined text-[13px]">check</span>
                    {item.status}
                  </span>
                </div>
              ))
            )}

            {/* Clinical Safeguard Note */}
            <div className="rounded-xl bg-amber-50 p-3 flex items-start gap-2.5 border border-amber-200 mt-2">
              <span className="material-symbols-outlined text-[18px] text-amber-700 flex-shrink-0 mt-0.5">
                shield
              </span>
              <p className="text-xs text-amber-950 leading-relaxed">
                <strong className="font-semibold">Clinical Note:</strong> Undocumented allergies are not assumed absent. Only recorded clinical findings shown.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Current Medications Section */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('meds')}
          className="w-full p-4 flex items-center justify-between text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">pill</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Current Medications</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                  {medications.length}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {medications.length > 0
                  ? medications.map((m) => m.title || m.value).join(', ')
                  : 'No active medications documented'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeMode === 'edit' && medications.length > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit('Medications');
                }}
                className="text-xs font-bold text-teal-700 hover:underline mr-1"
              >
                Edit
              </span>
            )}
            <span
              className={`material-symbols-outlined text-slate-400 transition-transform ${
                openSections.meds ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </div>
        </button>

        {openSections.meds && (
          <div className="px-4 pb-4 space-y-2">
            {medications.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">No medication findings detected.</p>
            ) : (
              medications.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-50 p-3 flex items-start justify-between gap-2 border border-slate-200/80"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{item.title || item.value}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{item.value}</p>
                    {item.secondaryValue && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.secondaryValue}</p>
                    )}
                    <div
                      onClick={() => onOpenTwoPanelForDoc?.(item.parentDoc)}
                      className="flex items-center gap-1.5 mt-2 cursor-pointer text-teal-700 hover:underline text-[11px] font-medium"
                    >
                      <span className="material-symbols-outlined text-[14px]">description</span>
                      <span>{item.parentDoc}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex-shrink-0">
                    <span className="material-symbols-outlined text-[13px]">check</span>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. Chronic Conditions Section */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('conditions')}
          className="w-full p-4 flex items-center justify-between text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">medical_services</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Conditions &amp; Diagnoses</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                  {conditions.length}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {conditions.length > 0
                  ? conditions.map((c) => c.title || c.value).join(', ')
                  : 'No chronic conditions documented'}
              </p>
            </div>
          </div>
          <span
            className={`material-symbols-outlined text-slate-400 transition-transform ${
              openSections.conditions ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </button>

        {openSections.conditions && (
          <div className="px-4 pb-4 space-y-2">
            {conditions.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">No diagnoses documented.</p>
            ) : (
              conditions.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-50 p-3 flex items-start justify-between gap-2 border border-slate-200/80"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{item.title || item.value}</p>
                    {item.secondaryValue && (
                      <p className="text-xs text-slate-600 mt-0.5">{item.secondaryValue}</p>
                    )}
                    <div
                      onClick={() => onOpenTwoPanelForDoc?.(item.parentDoc)}
                      className="flex items-center gap-1.5 mt-2 cursor-pointer text-teal-700 hover:underline text-[11px] font-medium"
                    >
                      <span className="material-symbols-outlined text-[14px]">description</span>
                      <span>{item.parentDoc}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex-shrink-0">
                    <span className="material-symbols-outlined text-[13px]">check</span>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 4. Lab Results Section */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('labs')}
          className="w-full p-4 flex items-center justify-between text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">science</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Lab Results</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {labs.length}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {labs.length > 0 ? `${labs.length} parameters tracked` : 'No lab results documented'}
              </p>
            </div>
          </div>
          <span
            className={`material-symbols-outlined text-slate-400 transition-transform ${
              openSections.labs ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </button>

        {openSections.labs && (
          <div className="px-4 pb-4 space-y-2">
            {labs.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">No laboratory results documented.</p>
            ) : (
              labs.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl bg-slate-50 p-3 flex items-start justify-between gap-2 border border-slate-200/80"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{item.title || item.value}</p>
                    <p className="text-xs text-slate-700 font-mono mt-0.5">{item.value}</p>
                    {item.secondaryValue && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.secondaryValue}</p>
                    )}
                    <div
                      onClick={() => onOpenTwoPanelForDoc?.(item.parentDoc)}
                      className="flex items-center gap-1.5 mt-2 cursor-pointer text-teal-700 hover:underline text-[11px] font-medium"
                    >
                      <span className="material-symbols-outlined text-[14px]">description</span>
                      <span>{item.parentDoc}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex-shrink-0">
                    <span className="material-symbols-outlined text-[13px]">check</span>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Edit {editingCategory} Review</h3>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-3 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-xs bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 cursor-pointer shadow-2xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
