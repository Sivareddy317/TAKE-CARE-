import React, { useState, useMemo } from 'react';
import {
  History,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Edit3,
  ShieldCheck,
  Clock,
  Filter,
  Search,
  ArrowRight,
  User,
  Heart,
  Pill,
  Lock,
  ChevronDown,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { ProcessedDocument, UserProfile } from '../../types/clinical';

export interface HealthHistoryEvent {
  id: string;
  timestamp: number;
  type:
    | 'document_upload'
    | 'entity_confirmed'
    | 'entity_rejected'
    | 'entity_edited'
    | 'profile_update'
    | 'vital_recorded'
    | 'medication_updated'
    | 'summary_generated'
    | 'access_event';
  category: 'document' | 'finding' | 'vital' | 'medication' | 'profile' | 'permission';
  title: string;
  description: string;
  statusLabel: 'Extracted' | 'Patient Confirmed' | 'Clinician Verified' | 'Rejected' | 'Corrected' | 'System Event';
  sourceDoc?: string;
  sourcePage?: number;
  previousValue?: string;
  newValue?: string;
  actor?: string;
  reason?: string;
}

interface HealthHistoryViewProps {
  documents: ProcessedDocument[];
  profile?: UserProfile | null;
  onSelectDocument?: (doc: ProcessedDocument) => void;
}

export const HealthHistoryView: React.FC<HealthHistoryViewProps> = ({
  documents,
  profile,
  onSelectDocument,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dynamically assemble chronological history from confirmed documents, entities, and stored corrections
  const timelineEvents = useMemo(() => {
    const events: HealthHistoryEvent[] = [];

    // 1. Processed Document Uploads
    documents.forEach((doc) => {
      const uploadTime = new Date(doc.uploadDate).getTime() || Date.now();
      events.push({
        id: `doc_up_${doc.id}`,
        timestamp: uploadTime,
        type: 'document_upload',
        category: 'document',
        title: `Document Uploaded: ${doc.filename}`,
        description: `Classified as ${doc.category || 'Clinical Record'}. ${doc.pageCount} page(s), OCR Readability: ${doc.ocrConfidence > 80 ? 'Good' : 'Review Needed'}.`,
        statusLabel: 'Extracted',
        sourceDoc: doc.filename,
        sourcePage: 1,
        actor: profile?.fullName || 'Patient',
      });

      // 2. Extracted Findings & Provenance
      doc.extractedEntities.forEach((ent, idx) => {
        const entTime = uploadTime + idx * 1000 + 5000;
        const isConfirmed = ent.status === 'Confirmed';
        const isRejected = ent.status === 'Rejected';

        events.push({
          id: `ent_${ent.id || idx}_${doc.id}`,
          timestamp: entTime,
          type: isRejected ? 'entity_rejected' : isConfirmed ? 'entity_confirmed' : 'entity_edited',
          category: 'finding',
          title: `${ent.category.toUpperCase()}: ${ent.value || ent.title || 'Clinical Entry'}`,
          description: ent.details ? `${ent.details}` : `Extracted clinical entry.`,
          statusLabel: isConfirmed ? 'Patient Confirmed' : isRejected ? 'Rejected' : 'Extracted',
          sourceDoc: doc.filename,
          sourcePage: ent.pageNumber || 1,
          actor: isConfirmed ? (profile?.fullName || 'Patient') : 'System Parser',
        });
      });
    });

    // 3. Stored Corrections Audit Trail
    try {
      const storedCorrections = localStorage.getItem('takecare_corrections_audit');
      if (storedCorrections) {
        const parsed: any[] = JSON.parse(storedCorrections);
        parsed.forEach((c) => {
          events.push({
            id: c.id || `corr_${c.timestamp}`,
            timestamp: c.timestamp,
            type: 'entity_edited',
            category: 'finding',
            title: `Record Corrected: ${c.fieldName || c.title}`,
            description: c.reason ? `Reason: ${c.reason}` : 'Clinical value updated by user.',
            statusLabel: 'Corrected',
            sourceDoc: c.sourceDoc,
            previousValue: c.previousValue,
            newValue: c.newValue,
            actor: c.actor || profile?.fullName || 'Patient',
            reason: c.reason,
          });
        });
      }
    } catch {}

    // 4. Family & Health Worker Access Events
    try {
      const storedAudit = localStorage.getItem('takecare_family_audit');
      if (storedAudit) {
        const parsedAudit: any[] = JSON.parse(storedAudit);
        parsedAudit.forEach((a) => {
          events.push({
            id: a.id || `audit_${a.timestamp}`,
            timestamp: a.timestamp,
            type: 'access_event',
            category: 'permission',
            title: `Access Event: ${a.action.replace('_', ' ').toUpperCase()}`,
            description: `${a.details || ''} (Target: ${a.targetProfileName}, Level: ${a.permissionLevel})`,
            statusLabel: 'System Event',
            actor: a.actorName,
          });
        });
      }
    } catch {}

    // Sort chronologically (newest first)
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [documents, profile]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return timelineEvents.filter((ev) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'corrections') {
          if (ev.statusLabel !== 'Corrected' && ev.type !== 'entity_edited') return false;
        } else if (ev.category !== selectedCategory) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesDesc = ev.description.toLowerCase().includes(q);
        const matchesSource = ev.sourceDoc?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesSource) return false;
      }

      return true;
    });
  }, [timelineEvents, selectedCategory, searchQuery]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100/70 text-[#006D60] flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Health History &amp; Audit Log</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chronological log of verified medical records, clinical reviews, corrections, and access events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {filteredEvents.length} Recorded Events
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'document', label: 'Documents' },
            { id: 'finding', label: 'Findings' },
            { id: 'corrections', label: 'Corrections' },
            { id: 'permission', label: 'Permissions' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#006D60] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events, documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl text-xs bg-white border border-slate-200 focus:outline-none focus:border-[#006D60]"
          />
        </div>
      </div>

      {/* Timeline List */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No events found in this category</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When documents are scanned, reviewed, or corrected, each step is timestamped and recorded here for clinical provenance.
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-teal-100 ml-4 sm:ml-6 space-y-4 py-2">
          {filteredEvents.map((ev) => {
            const dateStr = new Date(ev.timestamp).toLocaleDateString();
            const timeStr = new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const isCorrection = ev.statusLabel === 'Corrected';
            const isConfirmed = ev.statusLabel === 'Patient Confirmed';
            const isRejected = ev.statusLabel === 'Rejected';

            return (
              <div key={ev.id} className="relative pl-6 group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-[9px] top-3.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                    isCorrection
                      ? 'border-amber-500'
                      : isConfirmed
                      ? 'border-emerald-600'
                      : isRejected
                      ? 'border-rose-500'
                      : 'border-[#006D60]'
                  }`}
                />

                <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-teal-300 p-4 shadow-xs transition space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{ev.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCorrection
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : isConfirmed
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}
                      >
                        {ev.statusLabel}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {dateStr} • {timeStr}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{ev.description}</p>

                  {/* Previous vs New Values for Corrections */}
                  {isCorrection && (ev.previousValue || ev.newValue) && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                      <p className="font-bold text-amber-900 text-[11px]">Audit Delta (Correction Tracked):</p>
                      {ev.previousValue && (
                        <p className="text-slate-600">
                          <span className="text-rose-700 line-through">Previous: {ev.previousValue}</span>
                        </p>
                      )}
                      {ev.newValue && (
                        <p className="text-emerald-800 font-semibold">
                          Updated Value: {ev.newValue}
                        </p>
                      )}
                      {ev.reason && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">Note: {ev.reason}</p>
                      )}
                    </div>
                  )}

                  {/* Source Reference & Provenance */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-3">
                      {ev.sourceDoc && (
                        <span className="flex items-center gap-1 font-medium text-[#006D60]">
                          <FileText className="w-3.5 h-3.5" />
                          {ev.sourceDoc} {ev.sourcePage && `(Page ${ev.sourcePage})`}
                        </span>
                      )}
                      {ev.actor && <span>Recorded by: {ev.actor}</span>}
                    </div>

                    {ev.sourceDoc && onSelectDocument && (
                      <button
                        type="button"
                        onClick={() => {
                          const doc = documents.find((d) => d.filename === ev.sourceDoc);
                          if (doc) onSelectDocument(doc);
                        }}
                        className="text-[#006D60] font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>View Source Document</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
